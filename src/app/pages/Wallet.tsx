import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/Button";
import { motion } from "motion/react";
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Info } from "lucide-react";
import { getApiErrorMessage } from "../api/client";
import { getProfileStats } from "../api/garameApi";
import type { ProfileStatsResponse } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { getWinTypeLabel } from "../game/cards";

export function Wallet() {
  const navigate = useNavigate();
  const { token, user, refreshUser } = useAuth();
  const [stats, setStats] = useState<ProfileStatsResponse["stats"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    setIsLoading(true);
    Promise.all([getProfileStats(token), refreshUser()])
      .then(([response]) => {
        if (!isMounted) return;
        setStats(response.stats);
        setError(null);
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
  }, [refreshUser, token]);

  const summary = stats?.summary;
  const credits = summary?.credits ?? user?.credits ?? 0;

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
            <h1 className="text-2xl font-bold text-white">Credits</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200">
            {error}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-8 mb-8"
        >
          <div className="text-amber-100 mb-2">Solde de credits</div>
          <div className="text-5xl font-bold text-white mb-6">{credits}</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-amber-100 text-sm mb-1">Parties jouees</div>
              <div className="text-2xl font-bold text-white">{summary?.totalGames ?? 0}</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-amber-100 text-sm mb-1">Winrate</div>
              <div className="text-2xl font-bold text-white">{summary?.winRate ?? 0}%</div>
            </div>
          </div>
        </motion.div>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 mb-8 flex gap-3">
          <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-300">
            L'API actuelle gere un solde de credits de jeu. Les depots, retraits et transactions
            monetaires ne sont pas encore exposes par le backend.
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Derniers mouvements</h3>
          {isLoading ? (
            <div className="text-slate-400">Chargement...</div>
          ) : stats?.recent.length ? (
            <div className="space-y-3">
              {stats.recent.map((item) => (
                <Transaction
                  key={item.resultId}
                  type={item.didWin ? "win" : "loss"}
                  description={`${getWinTypeLabel(item.winType)} vs ${item.opponent.username}`}
                  amount={item.creditsDelta}
                  date={formatDate(item.playedAt)}
                />
              ))}
            </div>
          ) : (
            <div className="text-slate-400">Aucun mouvement de credits pour le moment.</div>
          )}
        </div>

        <div className="mt-6">
          <Button className="w-full" onClick={() => navigate("/lobby")}>
            Jouer pour gagner des credits
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function Transaction({
  type,
  description,
  amount,
  date,
}: {
  type: "win" | "loss";
  description: string;
  amount: number;
  date: string;
}) {
  const isWin = type === "win";

  return (
    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
      <div className="flex items-center gap-3">
        {isWin ? (
          <ArrowDownLeft className="w-5 h-5 text-green-400" />
        ) : (
          <ArrowUpRight className="w-5 h-5 text-red-400" />
        )}
        <div>
          <div className="text-white font-medium">{description}</div>
          <div className="text-sm text-slate-500">{date}</div>
        </div>
      </div>
      <div className={`font-bold ${isWin ? "text-green-400" : "text-red-400"}`}>
        {amount > 0 ? "+" : ""}
        {amount} credits
      </div>
    </div>
  );
}
