import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/Button";
import { motion } from "motion/react";
import { Trophy, TrendingUp, Wallet as WalletIcon, Play, History, BarChart3, LogOut } from "lucide-react";
import { getApiErrorMessage } from "../api/client";
import { getHistory, getProfileStats } from "../api/garameApi";
import type { HistoryResponse, ProfileStatsResponse } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { getWinTypeLabel } from "../game/cards";

type DashboardData = {
  stats: ProfileStatsResponse["stats"];
  history: HistoryResponse["items"];
};

export function Dashboard() {
  const navigate = useNavigate();
  const { token, user, logout, refreshUser } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    setIsLoading(true);
    Promise.all([getProfileStats(token), getHistory(token, 1, 10), refreshUser()])
      .then(([statsResponse, historyResponse]) => {
        if (!isMounted) return;
        setData({
          stats: statsResponse.stats,
          history: historyResponse.items,
        });
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

  const summary = data?.stats.summary;
  const recent = data?.stats.recent ?? [];
  const streak = data?.stats.streak;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
            GARAME
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/wallet")}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors"
            >
              <WalletIcon className="w-5 h-5 text-amber-500" />
              <span className="text-white font-semibold">{user?.credits ?? 0} credits</span>
            </button>
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              title="Deconnexion"
            >
              <LogOut className="w-5 h-5 text-slate-300" />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold">
              {getInitials(user?.username ?? "Vous")}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-slate-300">Chargement du tableau de bord...</div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <StatCard
                icon={<Trophy className="w-6 h-6" />}
                title="Victoires"
                value={`${summary?.wins ?? 0}`}
                subtitle={`${summary?.totalGames ?? 0} parties jouees`}
                trend="up"
              />
              <StatCard
                icon={<TrendingUp className="w-6 h-6" />}
                title="Winrate"
                value={`${summary?.winRate ?? 0}%`}
                subtitle={streak?.type === "none" ? "Aucune serie" : `${streak?.count ?? 0} ${streak?.type === "win" ? "victoire(s)" : "defaite(s)"} de suite`}
                trend={streak?.type === "loss" ? "down" : "up"}
              />
              <StatCard
                icon={<WalletIcon className="w-6 h-6" />}
                title="Credits"
                value={`${summary?.credits ?? user?.credits ?? 0}`}
                subtitle="Solde de classement"
                trend="up"
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-8 mb-8 text-center"
            >
              <h2 className="text-3xl font-bold text-white mb-4">Pret a jouer ?</h2>
              <p className="text-amber-50 mb-6">
                Lancez une partie Garame en matchmaking ou rejoignez une table ouverte.
              </p>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate("/lobby")}
                className="bg-white text-amber-600 hover:bg-amber-50"
              >
                <Play className="w-5 h-5 mr-2 inline" />
                Lancer une partie
              </Button>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-5 h-5 text-amber-500" />
                  <h3 className="text-xl font-bold text-white">Historique recent</h3>
                </div>
                <div className="space-y-3">
                  {recent.length === 0 ? (
                    <div className="text-slate-400">Aucune partie terminee pour le moment.</div>
                  ) : (
                    recent.slice(0, 6).map((item) => (
                      <GameHistoryItem
                        key={item.resultId}
                        opponent={item.opponent.username}
                        result={item.didWin ? "win" : "loss"}
                        amount={item.creditsDelta}
                        time={formatDate(item.playedAt)}
                        winType={item.winType}
                      />
                    ))
                  )}
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-amber-500" />
                  <h3 className="text-xl font-bold text-white">Statistiques</h3>
                </div>
                <div className="space-y-4">
                  <StatRow label="Parties jouees" value={`${summary?.gamesPlayed ?? 0}`} />
                  <StatRow label="Victoires Korat" value={`${data?.stats.byWinType.korat.wins ?? 0}`} />
                  <StatRow label="Three 7 reussis" value={`${data?.stats.byWinType.three_seven.wins ?? 0}`} />
                  <StatRow label="Moins de 21 reussis" value={`${data?.stats.byWinType.moins_21.wins ?? 0}`} />
                  <StatRow label="Defaites" value={`${summary?.losses ?? 0}`} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function getInitials(username: string) {
  return username.slice(0, 2).toUpperCase();
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
  trend,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  trend: "up" | "down";
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">{icon}</div>
        <span className="text-slate-400">{title}</span>
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className={`text-sm ${trend === "up" ? "text-green-400" : "text-red-400"}`}>
        {subtitle}
      </div>
    </motion.div>
  );
}

function GameHistoryItem({
  opponent,
  result,
  amount,
  time,
  winType,
}: {
  opponent: string;
  result: "win" | "loss";
  amount: number;
  time: string;
  winType: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
      <div>
        <div className="text-white font-medium">
          vs {opponent}
          <span className="ml-2 text-xs bg-amber-500 text-slate-900 px-2 py-0.5 rounded font-bold">
            {getWinTypeLabel(winType)}
          </span>
        </div>
        <div className="text-sm text-slate-500">{time}</div>
      </div>
      <div
        className={`font-bold ${result === "win" ? "text-green-400" : "text-red-400"}`}
      >
        {amount > 0 ? "+" : ""}
        {amount} credits
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-400">{label}</span>
      <span className="text-white font-semibold">{value}</span>
    </div>
  );
}
