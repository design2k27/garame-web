import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { PlayingCard, type Suit, type CardValue } from "../components/PlayingCard";
import { Button } from "../components/Button";
import { motion, AnimatePresence } from "motion/react";
import { Clock, History, Trophy, X } from "lucide-react";
import {
  VictoryModal,
  DefeatModal,
  KoratModal,
  ThreeSevenModal,
  Under21Modal,
} from "../components/GameModals";
import { ApiError, getApiErrorMessage } from "../api/client";
import {
  ackGame,
  getGame,
  playCard,
  pollGame,
  requestRematch,
  startMatchmaking,
  syncGame,
} from "../api/garameApi";
import type { ApiCard, GameFull, GameResultPayload } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { toApiSuit, toUiCard } from "../game/cards";

type Card = { suit: Suit; value: CardValue; api: ApiCard };
type ModalType = "victory" | "defeat" | "korat" | "three7" | "under21" | null;

export function GameRoom() {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const { token, user, refreshUser } = useAuth();
  const [game, setGame] = useState<GameFull | null>(null);
  const [result, setResult] = useState<GameResultPayload | null>(null);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isResyncing, setIsResyncing] = useState(false);
  const [isRequestingRematch, setIsRequestingRematch] = useState(false);
  const [isStartingMatchmaking, setIsStartingMatchmaking] = useState(false);
  const [rematchWaiting, setRematchWaiting] = useState(false);
  const [modalActionError, setModalActionError] = useState<string | null>(null);

  const applyServerState = async (nextGame: GameFull, nextResult: GameResultPayload | null) => {
    setGame(nextGame);
    setResult(nextResult);
    setSelectedCard(null);

    if (nextGame.status !== "finished") {
      setActiveModal(null);
      setRematchWaiting(false);
      setModalActionError(null);
    }

    if (token && nextGame.stateVersion >= 1) {
      await ackGame(token, nextGame.id, nextGame.stateVersion).catch(() => undefined);
    }
  };

  useEffect(() => {
    if (!token || !gameId) return;

    let isMounted = true;
    setIsLoading(true);
    getGame(token, gameId)
      .then(async (response) => {
        if (!isMounted) return;
        await applyServerState(response.game, response.result);
        setError(null);
        setModalActionError(null);
      })
      .catch((loadError) => {
        if (isMounted) setError(getApiErrorMessage(loadError));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [gameId, token]);

  useEffect(() => {
    if (!token || !game || game.status === "finished") return;

    let timeoutId: number | undefined;
    let cancelled = false;

    const tick = async () => {
      try {
        const response = await pollGame(token, game.id, game.stateVersion);
        if (cancelled) return;

        if (response.changed && response.game) {
          await applyServerState(response.game, response.result);
        }

        timeoutId = window.setTimeout(tick, response.pollAfterMs ?? 1500);
      } catch {
        if (!cancelled) {
          timeoutId = window.setTimeout(tick, 2500);
        }
      }
    };

    timeoutId = window.setTimeout(tick, 1500);

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [game?.id, game?.stateVersion, game?.status, token]);

  useEffect(() => {
    if (!game || game.status !== "finished" || !user) return;

    const didWin = game.winner === user.username;
    if (!didWin) {
      setActiveModal("defeat");
      return;
    }

    switch (game.winType) {
      case "korat":
        setActiveModal("korat");
        break;
      case "three_seven":
        setActiveModal("three7");
        break;
      case "moins_21":
        setActiveModal("under21");
        break;
      default:
        setActiveModal("victory");
    }

    refreshUser().catch(() => undefined);
  }, [game?.status, game?.winType, game?.winner, refreshUser, user]);

  const playerHand = useMemo<Card[]>(
    () => game?.myHand.map((card) => ({ ...toUiCard(card), api: card })) ?? [],
    [game?.myHand],
  );

  const currentTrick = useMemo<Card[]>(
    () =>
      game?.currentRoundData?.moves.map((move) => ({
        ...toUiCard(move.card),
        api: move.card,
      })) ?? [],
    [game?.currentRoundData?.moves],
  );

  const leadSuit = currentTrick[0]?.suit ?? null;
  const isMyTurn = Boolean(
    game &&
      user &&
      game.status === "playing" &&
      ((currentTrick.length === 0 && game.currentLeader === user.username) ||
        (currentTrick.length === 1 && currentTrick[0] && game.currentRoundData?.moves[0]?.player !== user.username)),
  );

  const canPlayCard = (card: Card) => {
    if (!isMyTurn) return false;
    if (!leadSuit) return true;
    if (playerHand.length === 1) return true;
    const hasLeadSuit = playerHand.some((c) => c.suit === leadSuit);
    return hasLeadSuit ? card.suit === leadSuit : true;
  };

  const handleCardClick = (index: number) => {
    if (canPlayCard(playerHand[index])) {
      setSelectedCard(index);
    }
  };

  const handlePlayCard = async () => {
    if (!token || !game || selectedCard === null) return;
    const card = playerHand[selectedCard];
    if (!card) return;

    setIsPlaying(true);
    setError(null);
    try {
      const response = await playCard(
        token,
        game.id,
        card.value,
        toApiSuit(card.suit),
        game.stateVersion,
      );
      await applyServerState(response.game, response.result);
    } catch (playError) {
      if (playError instanceof ApiError && playError.code === "out_of_sync") {
        await handleSync();
      } else {
        setError(getApiErrorMessage(playError));
      }
    } finally {
      setIsPlaying(false);
    }
  };

  const handleSync = async () => {
    if (!token || !game) return;

    setIsResyncing(true);
    try {
      const response = await syncGame(token, game.id, game.stateVersion);
      await applyServerState(response.game, response.result);
      setError(null);
    } catch (syncError) {
      setError(getApiErrorMessage(syncError));
    } finally {
      setIsResyncing(false);
    }
  };

  const handleCloseModal = () => setActiveModal(null);
  const handleDashboard = () => navigate("/dashboard");

  const handleRematch = async () => {
    if (!token || !game) return;

    setIsRequestingRematch(true);
    setError(null);
    setModalActionError(null);
    try {
      const response = await requestRematch(token, game.id);
      if (response.status === "started" && response.game) {
        setActiveModal(null);
        setRematchWaiting(false);
        setModalActionError(null);
        setGame(response.game);
        setResult(response.result);
        navigate(`/game/${response.game.id}`);
        return;
      }

      setRematchWaiting(true);
    } catch (rematchError) {
      const message = getApiErrorMessage(rematchError);
      setError(message);
      setModalActionError(message);
    } finally {
      setIsRequestingRematch(false);
    }
  };

  const handleMatchmaking = async () => {
    if (!token) return;

    setIsStartingMatchmaking(true);
    setError(null);
    setModalActionError(null);
    try {
      const response = await startMatchmaking(token);
      if (response.action === "joined" || response.game.status !== "waiting") {
        setActiveModal(null);
        setRematchWaiting(false);
        setModalActionError(null);
        navigate(`/game/${response.game.id}`);
        return;
      }

      navigate("/lobby");
    } catch (matchmakingError) {
      const message = getApiErrorMessage(matchmakingError);
      setError(message);
      setModalActionError(message);
    } finally {
      setIsStartingMatchmaking(false);
    }
  };

  useEffect(() => {
    if (!token || !game || !rematchWaiting) return;

    let timeoutId: number | undefined;
    let cancelled = false;

    const tick = async () => {
      try {
        const response = await requestRematch(token, game.id);
        if (cancelled) return;

        if (response.status === "started" && response.game) {
          setActiveModal(null);
          setRematchWaiting(false);
          setModalActionError(null);
          setGame(response.game);
          setResult(response.result);
          navigate(`/game/${response.game.id}`);
          return;
        }

        timeoutId = window.setTimeout(tick, 1500);
      } catch {
        if (!cancelled) {
          timeoutId = window.setTimeout(tick, 2500);
        }
      }
    };

    timeoutId = window.setTimeout(tick, 1500);

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [game, navigate, rematchWaiting, token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
        Chargement de la partie...
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="text-red-300 mb-4">{error ?? "Partie introuvable."}</div>
          <Button onClick={() => navigate("/lobby")}>Retour au lobby</Button>
        </div>
      </div>
    );
  }

  const opponentCardsCount = game.opponent?.cardsLeft ?? 0;
  const pot = game.winType === "korat" ? 20 : 10;
  const myName = user?.username ?? "Vous";
  const modalAmount = game.winType === "korat" ? 20 : 10;
  const rematchLabel = rematchWaiting
    ? "En attente de l'adversaire..."
    : isRequestingRematch
      ? "Demande en cours..."
      : "Demander une revanche";
  const matchmakingLabel = isStartingMatchmaking ? "Lancement..." : "Nouveau matchmaking";
  const modalActionMessage = rematchWaiting
    ? "Demande envoyee. La partie redemarre quand l'adversaire demande aussi une revanche."
    : null;
  const rematchDisabled = isRequestingRematch || rematchWaiting || isStartingMatchmaking;
  const matchmakingDisabled = isRequestingRematch || isStartingMatchmaking;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-x-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/30 via-green-800/20 to-green-900/30" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.15) 0%, transparent 60%),
              radial-gradient(circle at 30% 40%, rgba(16, 185, 129, 0.1) 0%, transparent 40%),
              radial-gradient(circle at 70% 60%, rgba(5, 150, 105, 0.1) 0%, transparent 40%)
            `,
          }}
        />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 2px,
              rgba(255,255,255,0.03) 2px,
              rgba(255,255,255,0.03) 4px
            )`,
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/dashboard")}
            >
              <X className="w-4 h-4 mr-2 inline" />
              Quitter
            </Button>
            <div className="bg-slate-900/80 backdrop-blur px-4 py-2 rounded-lg border border-slate-700">
              <div className="text-sm text-slate-400">Gain</div>
              <div className="text-xl font-bold text-amber-500">{pot} credits</div>
            </div>
            {isResyncing && (
              <div className="bg-blue-500/10 text-blue-200 px-3 py-2 rounded-lg border border-blue-500/30 text-sm">
                resync
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-slate-900/80 backdrop-blur px-4 py-2 rounded-lg border border-slate-700">
              <div className="text-sm text-slate-400">Plis gagnes</div>
              <div className="text-lg font-bold text-white">
                {game.myTricksWon} - {game.opponent?.tricksWon ?? 0}
              </div>
            </div>
          </div>
        </div>

        <TrickHistoryPanel game={game} myName={myName} className="hidden xl:flex" />

        {error && (
          <div className="mx-auto max-w-3xl rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200">
            {error}
          </div>
        )}

        <div className="px-4 pt-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur px-4 py-3 rounded-lg border border-slate-700">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white font-bold">
                  {(game.opponent?.username ?? "?").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-white font-semibold">{game.opponent?.username ?? "En attente"}</div>
                  <div className="text-sm text-slate-400">{game.opponent?.credits ?? 0} credits</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur px-4 py-3 rounded-lg border border-slate-700">
                <Clock className={`w-5 h-5 text-amber-500 ${isMyTurn ? "animate-pulse" : ""}`} />
                <span className="text-white font-bold text-lg">
                  {game.status === "waiting" ? "Attente" : isMyTurn ? "A vous" : "Adversaire"}
                </span>
              </div>
            </div>

            <div className="flex justify-center gap-2 min-h-32">
              {Array.from({ length: opponentCardsCount }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <PlayingCard suit="spades" value={8} faceDown size="md" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 -m-32 bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-full blur-3xl" />

            <div className="relative z-10 min-h-[200px] flex items-center justify-center gap-4">
              <AnimatePresence>
                {currentTrick.map((card, i) => (
                  <motion.div
                    key={`${card.suit}-${card.value}-${i}`}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, opacity: 0 }}
                  >
                    <PlayingCard suit={card.suit} value={card.value} size="lg" />
                  </motion.div>
                ))}
              </AnimatePresence>
              {currentTrick.length === 0 && (
                <div className="text-slate-400">
                  {game.status === "waiting" ? "En attente d'un adversaire" : "Aucune carte jouee dans ce pli"}
                </div>
              )}
            </div>

            <div className="text-center mt-4">
              <div className="bg-slate-900/80 backdrop-blur px-6 py-3 rounded-lg border border-slate-700 inline-block">
                <div className="text-sm text-slate-400 mb-1">Couleur demandee</div>
                <div className="text-2xl">
                  {leadSuit ? <SuitSymbol suit={leadSuit} /> : <span className="text-slate-500">-</span>}
                </div>
              </div>
              {result?.roundWinner && (
                <div className="mt-3 text-sm text-amber-300">
                  Pli remporte par {result.roundWinner}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center gap-3 mb-4 min-h-36">
              {playerHand.map((card, i) => (
                <div key={`${card.suit}-${card.value}-${i}`} onClick={() => handleCardClick(i)}>
                  <PlayingCard
                    suit={card.suit}
                    value={card.value}
                    isPlayable={canPlayCard(card)}
                    isSelected={selectedCard === i}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur px-4 py-3 rounded-lg border border-amber-500">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold">
                  {myName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-white font-semibold">{myName}</div>
                  <div className="text-sm text-slate-400">Version {game.stateVersion}</div>
                </div>
              </div>

              <Button
                size="lg"
                disabled={selectedCard === null || !isMyTurn || isPlaying}
                onClick={handlePlayCard}
              >
                {isPlaying ? "Jeu..." : "Jouer la carte"}
              </Button>
            </div>
          </div>
        </div>

        <div className="xl:hidden px-4 pb-4">
          <div className="max-w-4xl mx-auto">
            <TrickHistoryPanel game={game} myName={myName} compact />
          </div>
        </div>
      </div>

      <VictoryModal
        isOpen={activeModal === "victory"}
        onClose={handleCloseModal}
        onRematch={handleRematch}
        onMatchmaking={handleMatchmaking}
        onDashboard={handleDashboard}
        amount={modalAmount}
        rematchLabel={rematchLabel}
        rematchDisabled={rematchDisabled}
        matchmakingLabel={matchmakingLabel}
        matchmakingDisabled={matchmakingDisabled}
        actionMessage={modalActionMessage}
        actionError={modalActionError}
      />
      <DefeatModal
        isOpen={activeModal === "defeat"}
        onClose={handleCloseModal}
        onRematch={handleRematch}
        onMatchmaking={handleMatchmaking}
        onDashboard={handleDashboard}
        amount={modalAmount}
        rematchLabel={rematchLabel}
        rematchDisabled={rematchDisabled}
        matchmakingLabel={matchmakingLabel}
        matchmakingDisabled={matchmakingDisabled}
        actionMessage={modalActionMessage}
        actionError={modalActionError}
      />
      <KoratModal
        isOpen={activeModal === "korat"}
        onClose={handleCloseModal}
        onRematch={handleRematch}
        onMatchmaking={handleMatchmaking}
        onDashboard={handleDashboard}
        amount={10}
        rematchLabel={rematchLabel}
        rematchDisabled={rematchDisabled}
        matchmakingLabel={matchmakingLabel}
        matchmakingDisabled={matchmakingDisabled}
        actionMessage={modalActionMessage}
        actionError={modalActionError}
      />
      <ThreeSevenModal
        isOpen={activeModal === "three7"}
        onClose={handleCloseModal}
        onRematch={handleRematch}
        onMatchmaking={handleMatchmaking}
        onDashboard={handleDashboard}
        amount={modalAmount}
        rematchLabel={rematchLabel}
        rematchDisabled={rematchDisabled}
        matchmakingLabel={matchmakingLabel}
        matchmakingDisabled={matchmakingDisabled}
        actionMessage={modalActionMessage}
        actionError={modalActionError}
      />
      <Under21Modal
        isOpen={activeModal === "under21"}
        onClose={handleCloseModal}
        onRematch={handleRematch}
        onMatchmaking={handleMatchmaking}
        onDashboard={handleDashboard}
        amount={modalAmount}
        rematchLabel={rematchLabel}
        rematchDisabled={rematchDisabled}
        matchmakingLabel={matchmakingLabel}
        matchmakingDisabled={matchmakingDisabled}
        actionMessage={modalActionMessage}
        actionError={modalActionError}
      />
    </div>
  );
}

function TrickHistoryPanel({
  game,
  myName,
  compact = false,
  className = "",
}: {
  game: GameFull;
  myName: string;
  compact?: boolean;
  className?: string;
}) {
  const rounds = [...game.rounds].sort((a, b) => a.number - b.number);
  const completedRounds = rounds.filter((round) => round.moves.length > 0);

  return (
    <aside
      className={`
        ${compact ? "relative flex w-full max-h-56" : "absolute right-4 top-24 bottom-4 w-80"}
        ${className}
        flex-col rounded-lg border border-slate-700 bg-slate-950/85 backdrop-blur
        shadow-2xl shadow-black/30 overflow-hidden
      `}
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2 text-white font-semibold">
          <History className="w-4 h-4 text-amber-400" />
          Historique des plis
        </div>
        <div className="text-xs text-slate-400">{completedRounds.length}/5</div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {completedRounds.length === 0 ? (
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-400">
            Aucun pli joue.
          </div>
        ) : (
          completedRounds.map((round) => {
            const leadCard = round.moves[0]?.card;
            const didWinRound = round.winner === myName;

            return (
              <div
                key={round.number}
                className={`
                  rounded-lg border p-3
                  ${didWinRound ? "border-amber-500/40 bg-amber-500/10" : "border-slate-800 bg-slate-900/70"}
                `}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="text-sm font-semibold text-white">Pli {round.number}</div>
                  {round.winner ? (
                    <div className="flex items-center gap-1 text-xs text-amber-300">
                      <Trophy className="w-3.5 h-3.5" />
                      {round.winner === myName ? "Vous" : round.winner}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500">En cours</div>
                  )}
                </div>

                <div className="mb-3 text-xs text-slate-400">
                  Couleur demandee :{" "}
                  <span className="text-slate-200">
                    {leadCard ? getApiSuitLabel(leadCard.suit) : "-"}
                  </span>
                </div>

                <div className="space-y-2">
                  {round.moves.map((move) => (
                    <div
                      key={`${round.number}-${move.playOrder}-${move.player}`}
                      className="flex items-center justify-between gap-3 rounded-md bg-slate-950/70 px-2 py-2"
                    >
                      <div className="min-w-0 text-sm text-slate-200 truncate">
                        {move.player === myName ? "Vous" : move.player}
                      </div>
                      <MiniCard card={move.card} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

function MiniCard({ card }: { card: ApiCard }) {
  const isRed = card.suit === "H" || card.suit === "D";

  return (
    <div className="flex h-9 min-w-12 items-center justify-center rounded-md border border-slate-300 bg-white px-2 text-sm font-bold shadow">
      <span className={isRed ? "text-red-600" : "text-slate-900"}>
        {card.value}
        {getApiSuitSymbol(card.suit)}
      </span>
    </div>
  );
}

function getApiSuitLabel(suit: ApiCard["suit"]) {
  switch (suit) {
    case "H":
      return "Coeur";
    case "D":
      return "Carreau";
    case "C":
      return "Trefle";
    case "S":
      return "Pique";
  }
}

function getApiSuitSymbol(suit: ApiCard["suit"]) {
  switch (suit) {
    case "H":
      return "H";
    case "D":
      return "D";
    case "C":
      return "C";
    case "S":
      return "S";
  }
}

function SuitSymbol({ suit }: { suit: Suit }) {
  const color = suit === "hearts" || suit === "diamonds" ? "#DC2626" : "#0F172A";
  const symbol = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
  }[suit];

  return <span style={{ color }}>{symbol}</span>;
}
