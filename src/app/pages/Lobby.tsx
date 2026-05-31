import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/Button";
import { motion } from "motion/react";
import { ArrowLeft, Users, Clock, Zap, Lock, RefreshCw } from "lucide-react";
import { ApiError, getApiErrorMessage } from "../api/client";
import {
  cancelMatchmaking,
  createGame,
  getMyActiveGames,
  getOpenGames,
  joinGame,
  pollGame,
  startMatchmaking,
} from "../api/garameApi";
import type { GameSummary } from "../api/types";
import { useAuth } from "../auth/AuthContext";

export function Lobby() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [selectedStake, setSelectedStake] = useState(10);
  const [isSearching, setIsSearching] = useState(false);
  const [queuedGame, setQueuedGame] = useState<GameSummary | null>(null);
  const [openGames, setOpenGames] = useState<GameSummary[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const stakes = [10, 20, 30, 40];

  const refreshLobby = async () => {
    if (!token) return;
    const [openResponse, activeResponse] = await Promise.all([
      getOpenGames(token),
      getMyActiveGames(token),
    ]);

    const activeGame = activeResponse.games[0];
    if (activeGame?.status === "playing") {
      navigate(`/game/${activeGame.id}`);
      return;
    }

    if (activeGame?.status === "waiting") {
      setQueuedGame(activeGame);
      setIsSearching(true);
    }

    setOpenGames(openResponse.games);
    setOnlineCount(countUniquePlayers(openResponse.games) + activeResponse.games.length);
  };

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    setIsLoading(true);
    refreshLobby()
      .catch((loadError) => {
        if (isMounted) setError(getApiErrorMessage(loadError));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [navigate, token]);

  useEffect(() => {
    if (!token || !queuedGame || !isSearching) return;

    let timeoutId: number | undefined;
    let cancelled = false;

    const tick = async () => {
      try {
        const response = await pollGame(token, queuedGame.id, queuedGame.stateVersion);
        if (cancelled) return;

        if (response.changed && response.game?.status !== "waiting") {
          navigate(`/game/${response.game.id}`);
          return;
        }

        timeoutId = window.setTimeout(tick, response.pollAfterMs ?? 1500);
      } catch (pollError) {
        if (!cancelled) {
          setError(getApiErrorMessage(pollError));
          timeoutId = window.setTimeout(tick, 2500);
        }
      }
    };

    timeoutId = window.setTimeout(tick, 1000);

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [isSearching, navigate, queuedGame, token]);

  const handleQuickMatch = async () => {
    if (!token) return;

    setError(null);
    setIsSearching(true);
    try {
      const response = await startMatchmaking(token);
      if (response.action === "joined" || response.game.status !== "waiting") {
        navigate(`/game/${response.game.id}`);
        return;
      }

      setQueuedGame(response.game);
    } catch (matchmakingError) {
      if (matchmakingError instanceof ApiError && matchmakingError.code === "active_game_exists") {
        await refreshLobby();
        return;
      }

      setIsSearching(false);
      setError(getApiErrorMessage(matchmakingError));
    }
  };

  const handleCancelSearch = async () => {
    if (!token) return;
    try {
      await cancelMatchmaking(token);
      setIsSearching(false);
      setQueuedGame(null);
      await refreshLobby();
    } catch (cancelError) {
      setError(getApiErrorMessage(cancelError));
    }
  };

  const handleCreateGame = async () => {
    if (!token) return;

    setIsCreating(true);
    setError(null);
    try {
      const response = await createGame(token);
      setQueuedGame(response.game);
      setIsSearching(true);
    } catch (createError) {
      setError(getApiErrorMessage(createError));
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async (gameId: string) => {
    if (!token) return;

    setError(null);
    try {
      const response = await joinGame(token, gameId);
      navigate(`/game/${response.game.id}`);
    } catch (joinError) {
      setError(getApiErrorMessage(joinError));
      await refreshLobby();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white">Lobby</h1>
          </div>
          <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg">
            <Users className="w-5 h-5 text-green-400" />
            <span className="text-white font-semibold">{onlineCount} actif(s)</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-slate-300">Chargement du lobby...</div>
        ) : !isSearching ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 mb-8"
            >
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-500 px-4 py-2 rounded-full mb-4">
                  <Zap className="w-4 h-4" />
                  <span className="font-semibold">Match rapide</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Choisissez votre niveau de credits
                </h2>
                <p className="text-slate-400">
                  L'API actuelle classe les parties en credits. Les mises en euros viendront avec un contrat wallet dedie.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {stakes.map((stake) => (
                  <motion.button
                    key={stake}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedStake(stake)}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      selectedStake === stake
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-slate-700 bg-slate-900/50 hover:border-slate-600"
                    }`}
                  >
                    <div className="text-3xl font-bold text-white mb-1">{stake}</div>
                    <div className="text-sm text-slate-400">credits indicatifs</div>
                  </motion.button>
                ))}
              </div>

              <Button size="lg" className="w-full" onClick={handleQuickMatch}>
                <Zap className="w-5 h-5 mr-2 inline" />
                Lancer le matchmaking
              </Button>
            </motion.div>

            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Parties ouvertes</h3>
                  <p className="text-slate-400">Creez ou rejoignez une partie en attente</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => refreshLobby()}>
                    <RefreshCw className="w-4 h-4 mr-2 inline" />
                    Actualiser
                  </Button>
                  <Button variant="outline" onClick={handleCreateGame} disabled={isCreating}>
                    <Lock className="w-4 h-4 mr-2 inline" />
                    {isCreating ? "Creation..." : "Creer"}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {openGames.length === 0 ? (
                  <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4 text-slate-400">
                    Aucune partie ouverte. Lancez un matchmaking ou creez une table.
                  </div>
                ) : (
                  openGames.map((game) => (
                    <PrivateGameItem
                      key={game.id}
                      game={game}
                      onJoin={() => handleJoin(game.id)}
                    />
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          <MatchmakingScreen
            stake={selectedStake}
            queuedGame={queuedGame}
            onCancel={handleCancelSearch}
          />
        )}
      </div>
    </div>
  );
}

function countUniquePlayers(games: GameSummary[]) {
  return new Set(games.flatMap((game) => game.players.map((player) => player.id))).size;
}

function PrivateGameItem({
  game,
  onJoin,
}: {
  game: GameSummary;
  onJoin: () => void;
}) {
  const host = game.players[0]?.username ?? "Joueur";

  return (
    <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold">
          {host[0]?.toUpperCase() ?? "J"}
        </div>
        <div>
          <div className="text-white font-semibold">{host}</div>
          <div className="text-sm text-slate-400">
            Partie {game.status} · version {game.stateVersion}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-amber-500 text-sm flex items-center gap-2">
          <Clock className="w-4 h-4 animate-pulse" />
          En attente
        </span>
        <Button size="sm" onClick={onJoin}>
          Rejoindre
        </Button>
      </div>
    </div>
  );
}

function MatchmakingScreen({
  stake,
  queuedGame,
  onCancel,
}: {
  stake: number;
  queuedGame: GameSummary | null;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-12 text-center"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-20 h-20 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-6"
      />
      <h2 className="text-3xl font-bold text-white mb-2">Recherche d'adversaire...</h2>
      <p className="text-slate-400 mb-2">Niveau indicatif : {stake} credits</p>
      {queuedGame && (
        <p className="text-slate-500 text-sm mb-8">Table {queuedGame.id.slice(0, 8)}</p>
      )}
      <div className="flex justify-center gap-2 mb-8">
        {[0, 0.2, 0.4].map((delay) => (
          <motion.div
            key={delay}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity, delay }}
            className="w-3 h-3 bg-amber-500 rounded-full"
          />
        ))}
      </div>
      <Button variant="outline" onClick={onCancel}>
        Annuler la recherche
      </Button>
    </motion.div>
  );
}
