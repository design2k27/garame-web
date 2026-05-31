import { motion, AnimatePresence } from "motion/react";
import { Button } from "./Button";
import { Trophy, X, Sparkles, Target } from "lucide-react";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRematch: () => void;
  onMatchmaking: () => void;
  onDashboard: () => void;
  amount: number;
  rematchLabel?: string;
  rematchDisabled?: boolean;
  matchmakingLabel?: string;
  matchmakingDisabled?: boolean;
  actionMessage?: string | null;
  actionError?: string | null;
}

function ActionStatus({
  message,
  error,
}: {
  message?: string | null;
  error?: string | null;
}) {
  if (!message && !error) return null;

  return (
    <div className="mb-4 space-y-2">
      {message && (
        <div className="rounded-lg border border-blue-400/40 bg-blue-500/10 px-3 py-2 text-sm text-blue-100">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-400/50 bg-red-500/10 px-3 py-2 text-sm text-red-100">
          {error}
        </div>
      )}
    </div>
  );
}

function ModalActions({
  onRematch,
  onMatchmaking,
  onDashboard,
  rematchLabel,
  rematchDisabled,
  matchmakingLabel,
  matchmakingDisabled,
  actionMessage,
  actionError,
  rematchClassName,
  dashboardClassName,
}: Pick<
  ModalProps,
  | "onRematch"
  | "onMatchmaking"
  | "onDashboard"
  | "rematchLabel"
  | "rematchDisabled"
  | "matchmakingLabel"
  | "matchmakingDisabled"
  | "actionMessage"
  | "actionError"
> & {
  rematchClassName?: string;
  dashboardClassName?: string;
}) {
  return (
    <div className="relative z-10">
      <ActionStatus message={actionMessage} error={actionError} />
      <div className="space-y-3">
        <Button className={`w-full ${rematchClassName ?? ""}`} onClick={onRematch} disabled={rematchDisabled}>
          {rematchLabel}
        </Button>
        <Button variant="secondary" className="w-full" onClick={onMatchmaking} disabled={matchmakingDisabled}>
          {matchmakingLabel}
        </Button>
        <Button variant="outline" className={`w-full ${dashboardClassName ?? ""}`} onClick={onDashboard}>
          Retour au Dashboard
        </Button>
      </div>
    </div>
  );
}

export function VictoryModal({
  isOpen,
  onClose,
  onRematch,
  onMatchmaking,
  onDashboard,
  amount,
  rematchLabel = "Demander une revanche",
  rematchDisabled = false,
  matchmakingLabel = "Nouveau matchmaking",
  matchmakingDisabled = false,
  actionMessage = null,
  actionError = null,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#F59E0B", "#FBBF24", "#FCD34D"],
      });
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-amber-500 rounded-2xl p-8 max-w-md w-full text-center relative overflow-hidden"
          >
            {/* Animated background */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-lg transition-colors z-10"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="relative w-24 h-24 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-amber-500/50"
            >
              <Trophy className="w-12 h-12 text-white" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl font-bold text-white mb-3"
            >
              Victoire !
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-slate-300 mb-6 text-lg"
            >
              Félicitations, vous avez gagné !
            </motion.p>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-slate-800/80 backdrop-blur rounded-xl p-8 mb-6 border border-amber-500/30"
            >
              <div className="text-6xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent mb-2">
                +{amount} credits
              </div>
              <div className="text-slate-400">Ajoute a votre solde</div>
            </motion.div>

            <ModalActions
              onRematch={onRematch}
              onMatchmaking={onMatchmaking}
              onDashboard={onDashboard}
              rematchLabel={rematchLabel}
              rematchDisabled={rematchDisabled}
              matchmakingLabel={matchmakingLabel}
              matchmakingDisabled={matchmakingDisabled}
              actionMessage={actionMessage}
              actionError={actionError}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function DefeatModal({
  isOpen,
  onClose,
  onRematch,
  onMatchmaking,
  onDashboard,
  amount,
  rematchLabel = "Prendre sa revanche",
  rematchDisabled = false,
  matchmakingLabel = "Nouveau matchmaking",
  matchmakingDisabled = false,
  actionMessage = null,
  actionError = null,
}: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-red-500 rounded-2xl p-8 max-w-md w-full text-center relative overflow-hidden"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-lg transition-colors z-10"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="relative w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-500/50"
            >
              <X className="w-12 h-12 text-white" />
            </motion.div>

            <h2 className="text-5xl font-bold text-white mb-3">Défaite</h2>
            <p className="text-slate-300 mb-6 text-lg">
              Votre adversaire a gagné cette partie
            </p>

            <div className="bg-slate-800/80 backdrop-blur rounded-xl p-8 mb-6 border border-red-500/30">
              <div className="text-6xl font-bold text-red-400 mb-2">-{amount} credits</div>
              <div className="text-slate-400">Deduit de votre solde</div>
            </div>

            <ModalActions
              onRematch={onRematch}
              onMatchmaking={onMatchmaking}
              onDashboard={onDashboard}
              rematchLabel={rematchLabel}
              rematchDisabled={rematchDisabled}
              matchmakingLabel={matchmakingLabel}
              matchmakingDisabled={matchmakingDisabled}
              actionMessage={actionMessage}
              actionError={actionError}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function KoratModal({
  isOpen,
  onClose,
  onRematch,
  onMatchmaking,
  onDashboard,
  amount,
  rematchLabel = "Demander une revanche",
  rematchDisabled = false,
  matchmakingLabel = "Nouveau matchmaking",
  matchmakingDisabled = false,
  actionMessage = null,
  actionError = null,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Triple confetti for Korat!
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 7,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#F59E0B", "#FBBF24", "#FCD34D", "#DC2626"],
        });
        confetti({
          particleCount: 7,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#F59E0B", "#FBBF24", "#FCD34D", "#DC2626"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.8, y: 20, rotate: -5 }}
            animate={{ scale: 1, y: 0, rotate: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            className="bg-gradient-to-br from-amber-900 via-slate-900 to-red-900 border-4 border-amber-500 rounded-2xl p-8 max-w-md w-full text-center relative overflow-hidden"
          >
            {/* Animated glow */}
            <motion.div
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/20 via-transparent to-red-500/20"
            />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-lg transition-colors z-10"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>

            <motion.div
              animate={{
                rotate: [0, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="relative w-28 h-28 bg-gradient-to-br from-amber-400 via-amber-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-amber-500/50"
            >
              <Sparkles className="w-14 h-14 text-white" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="inline-block bg-amber-500 text-slate-900 px-6 py-2 rounded-full font-bold text-xl mb-4 shadow-lg">
                🎯 KORAT !
              </div>
              <h2 className="text-5xl font-bold text-white mb-3">Victoire Légendaire</h2>
              <p className="text-amber-200 mb-6 text-lg font-medium">
                Dernier pli avec un 3 non battu !<br />
                <span className="text-amber-400">Gain doublé</span>
              </p>
            </motion.div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-slate-900/80 backdrop-blur rounded-xl p-8 mb-6 border-2 border-amber-400"
            >
              <div className="text-7xl font-bold bg-gradient-to-r from-amber-300 via-amber-500 to-red-500 bg-clip-text text-transparent mb-2">
                +{amount * 2} credits
              </div>
              <div className="text-amber-300 font-semibold">Gain doublé ! 🔥</div>
            </motion.div>

            <ModalActions
              onRematch={onRematch}
              onMatchmaking={onMatchmaking}
              onDashboard={onDashboard}
              rematchLabel={rematchLabel}
              rematchDisabled={rematchDisabled}
              matchmakingLabel={matchmakingLabel}
              matchmakingDisabled={matchmakingDisabled}
              actionMessage={actionMessage}
              actionError={actionError}
              rematchClassName="bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600"
              dashboardClassName="border-amber-500 text-amber-500 hover:bg-amber-500"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ThreeSevenModal({
  isOpen,
  onClose,
  onRematch,
  onMatchmaking,
  onDashboard,
  amount,
  rematchLabel = "Demander une revanche",
  rematchDisabled = false,
  matchmakingLabel = "Nouveau matchmaking",
  matchmakingDisabled = false,
  actionMessage = null,
  actionError = null,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ["#8B5CF6", "#A78BFA", "#C4B5FD"],
      });
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            className="bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900 border-2 border-purple-500 rounded-2xl p-8 max-w-md w-full text-center relative overflow-hidden"
          >
            <motion.div
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent"
            />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-lg transition-colors z-10"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="relative w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/50"
            >
              <div className="text-4xl font-bold text-white">777</div>
            </motion.div>

            <div className="inline-block bg-purple-500 text-white px-6 py-2 rounded-full font-bold text-lg mb-4">
              🎰 THREE 7
            </div>
            <h2 className="text-5xl font-bold text-white mb-3">Victoire Instantanée !</h2>
            <p className="text-purple-200 mb-6 text-lg">
              Trois cartes de valeur 7 !
            </p>

            <div className="bg-slate-800/80 backdrop-blur rounded-xl p-8 mb-6 border border-purple-500/30">
              <div className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent mb-2">
                +{amount} credits
              </div>
              <div className="text-purple-300">Victoire instantanée</div>
            </div>

            <ModalActions
              onRematch={onRematch}
              onMatchmaking={onMatchmaking}
              onDashboard={onDashboard}
              rematchLabel={rematchLabel}
              rematchDisabled={rematchDisabled}
              matchmakingLabel={matchmakingLabel}
              matchmakingDisabled={matchmakingDisabled}
              actionMessage={actionMessage}
              actionError={actionError}
              rematchClassName="bg-purple-600 hover:bg-purple-700"
              dashboardClassName="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Under21Modal({
  isOpen,
  onClose,
  onRematch,
  onMatchmaking,
  onDashboard,
  amount,
  rematchLabel = "Demander une revanche",
  rematchDisabled = false,
  matchmakingLabel = "Nouveau matchmaking",
  matchmakingDisabled = false,
  actionMessage = null,
  actionError = null,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#10B981", "#34D399", "#6EE7B7"],
      });
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            className="bg-gradient-to-br from-emerald-900 via-slate-900 to-emerald-900 border-2 border-emerald-500 rounded-2xl p-8 max-w-md w-full text-center relative overflow-hidden"
          >
            <motion.div
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent"
            />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-lg transition-colors z-10"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="relative w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/50"
            >
              <Target className="w-12 h-12 text-white" />
            </motion.div>

            <div className="inline-block bg-emerald-500 text-white px-6 py-2 rounded-full font-bold text-lg mb-4">
              🎯 SOUS 21
            </div>
            <h2 className="text-5xl font-bold text-white mb-3">Victoire Instantanée !</h2>
            <p className="text-emerald-200 mb-6 text-lg">
              Somme des cartes ≤ 21 !
            </p>

            <div className="bg-slate-800/80 backdrop-blur rounded-xl p-8 mb-6 border border-emerald-500/30">
              <div className="text-6xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent mb-2">
                +{amount} credits
              </div>
              <div className="text-emerald-300">Victoire instantanée</div>
            </div>

            <ModalActions
              onRematch={onRematch}
              onMatchmaking={onMatchmaking}
              onDashboard={onDashboard}
              rematchLabel={rematchLabel}
              rematchDisabled={rematchDisabled}
              matchmakingLabel={matchmakingLabel}
              matchmakingDisabled={matchmakingDisabled}
              actionMessage={actionMessage}
              actionError={actionError}
              rematchClassName="bg-emerald-600 hover:bg-emerald-700"
              dashboardClassName="border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
