import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ChevronLeft, Star, Users, TrendingUp, Gift } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  computeVipLevel,
  DEFAULT_VIP_CONFIGS,
  VIP_BADGE_STYLE,
  mergeAdminVipConfig,
} from "@/lib/vip";

interface TeamStats {
  level1Count: number;
  level2Count: number;
  level3Count: number;
}

export default function VipPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: products = [] } = useQuery<any[]>({ queryKey: ["/api/user/products"] });
  const { data: stats } = useQuery<TeamStats>({ queryKey: ["/api/team/stats"] });
  const { data: settings = {} } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });

  const productCount = products.length;
  const teamStats = stats ?? { level1Count: 0, level2Count: 0, level3Count: 0 };
  const totalTeam = teamStats.level1Count + teamStats.level2Count + teamStats.level3Count;

  const configs = mergeAdminVipConfig(DEFAULT_VIP_CONFIGS, settings);
  const vipLevel = computeVipLevel(productCount, teamStats, configs);
  const currentCfg = configs[vipLevel];
  const nextCfg = vipLevel < 7 ? configs[vipLevel + 1] : null;
  const badgeStyle = VIP_BADGE_STYLE[vipLevel];

  // Progression vers le prochain niveau
  function progressToNext(): { label: string; value: number; max: number; pct: number } | null {
    if (!nextCfg) return null;
    if (nextCfg.minTotalTeam !== null) {
      const prev = currentCfg.minTotalTeam ?? 0;
      return {
        label: "Membres dans l'équipe",
        value: totalTeam,
        max: nextCfg.minTotalTeam,
        pct: Math.min(100, Math.round((totalTeam / nextCfg.minTotalTeam) * 100)),
      };
    }
    if (nextCfg.minLevelB !== null) {
      return {
        label: "Membres niveau B (filleuls de vos filleuls)",
        value: teamStats.level2Count,
        max: nextCfg.minLevelB,
        pct: Math.min(100, Math.round((teamStats.level2Count / nextCfg.minLevelB) * 100)),
      };
    }
    if (nextCfg.minDirectA !== null) {
      return {
        label: "Filleuls directs (niveau A)",
        value: teamStats.level1Count,
        max: nextCfg.minDirectA,
        pct: Math.min(100, Math.round((teamStats.level1Count / nextCfg.minDirectA) * 100)),
      };
    }
    if (nextCfg.requiresInvestment && productCount === 0) {
      return { label: "Premier investissement requis", value: 0, max: 1, pct: 0 };
    }
    return null;
  }

  const progress = progressToNext();

  return (
    <div className="min-h-screen pb-20" style={{ background: "#000000" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={() => navigate("/account")} className="p-2 rounded-full bg-white/10 active:opacity-70">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-white font-black text-lg">Niveaux VIP</h1>
      </div>

      <div className="px-4 space-y-4">
        {/* ── Carte niveau actuel ── */}
        <div
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{ background: badgeStyle.bg }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(120deg,rgba(255,255,255,0.12) 0%,transparent 60%)" }} />
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/80 text-xs font-semibold uppercase tracking-wider">Votre niveau actuel</span>
            {vipLevel === 7 && <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">MAX</span>}
          </div>
          <div className="flex items-center gap-3 mb-3">
            <Star className="w-7 h-7 text-white" fill="white" />
            <span className="text-white font-black text-3xl">{currentCfg.label}</span>
          </div>
          <p className="text-white/80 text-sm">{currentCfg.description}</p>

          {/* Stats équipe rapides */}
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-white/60" />
              <span className="text-white/60 text-xs">{teamStats.level1Count} A</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-white/60" />
              <span className="text-white/60 text-xs">{teamStats.level2Count} B</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-white/60" />
              <span className="text-white/60 text-xs">{teamStats.level3Count} C</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-white/60" />
              <span className="text-white/60 text-xs">{totalTeam} total</span>
            </div>
          </div>
        </div>

        {/* ── Avantages du niveau actuel ── */}
        <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.08)" }}>
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Avantages {currentCfg.label}</p>
          <p className="text-white text-sm leading-relaxed">{currentCfg.advantages}</p>
        </div>

        {/* ── Progression vers le prochain niveau ── */}
        {nextCfg && progress && (
          <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Progression</p>
                <p className="text-white font-bold text-sm mt-0.5">
                  {currentCfg.label} → {nextCfg.label}
                </p>
              </div>
              <span className="text-white font-black text-xl">{progress.pct}%</span>
            </div>

            <div className="w-full h-2.5 rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.15)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress.pct}%`,
                  background: "linear-gradient(90deg,#ffd700,#ffa500)",
                }}
              />
            </div>

            <p className="text-white/60 text-xs">
              {progress.label} : <span className="text-white font-bold">{progress.value}</span> / {progress.max}
            </p>
          </div>
        )}

        {vipLevel === 7 && (
          <div className="rounded-2xl p-4 text-center" style={{ background: "rgba(255,255,255,0.08)" }}>
            <p className="text-white font-bold">🏆 Félicitations !</p>
            <p className="text-white/70 text-sm mt-1">Vous avez atteint le niveau VIP maximum.</p>
          </div>
        )}

        {/* ── Tous les niveaux VIP ── */}
        <div>
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3 px-1">Tous les grades</p>
          <div className="space-y-3">
            {configs.map((cfg) => {
              const bs = VIP_BADGE_STYLE[cfg.level];
              const isActive = cfg.level === vipLevel;
              const isDone = cfg.level < vipLevel;
              return (
                <div
                  key={cfg.level}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: isActive ? bs.bg : "rgba(255,255,255,0.06)",
                    border: isActive ? "2px solid rgba(255,255,255,0.3)" : "2px solid transparent",
                    opacity: cfg.level > vipLevel + 1 ? 0.6 : 1,
                  }}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Star
                          className="w-4 h-4"
                          style={{ color: isActive || isDone ? "#ffd700" : "rgba(255,255,255,0.4)" }}
                          fill={isDone ? "#ffd700" : "none"}
                        />
                        <span className={`font-black text-sm ${isActive ? "text-white" : "text-white/70"}`}>
                          {cfg.label}
                        </span>
                        {isActive && (
                          <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded-full font-bold">
                            Actuel
                          </span>
                        )}
                        {isDone && (
                          <span className="text-[10px] bg-black/30 text-gray-300 px-1.5 py-0.5 rounded-full font-bold">
                            ✓ Atteint
                          </span>
                        )}
                      </div>
                    </div>

                    <p className={`text-xs mb-2 leading-relaxed ${isActive ? "text-white/90" : "text-white/50"}`}>
                      {cfg.description}
                    </p>

                    {/* Conditions */}
                    <div className="text-[11px] space-y-0.5">
                      {cfg.requiresInvestment && (
                        <p className="text-white/40">✦ Premier investissement requis</p>
                      )}
                      {cfg.minDirectA !== null && (
                        <p className="text-white/40">✦ {cfg.minDirectA} filleuls directs (A)</p>
                      )}
                      {cfg.minLevelB !== null && (
                        <p className="text-white/40">✦ {cfg.minLevelB} membre(s) niveau B</p>
                      )}
                      {cfg.minTotalTeam !== null && (
                        <p className="text-white/40">✦ {cfg.minTotalTeam.toLocaleString()} membres au total</p>
                      )}
                    </div>

                    {/* Avantages */}
                    <div className="mt-2 pt-2 border-t border-white/10">
                      <p className={`text-[11px] leading-relaxed ${isActive ? "text-white/80" : "text-white/40"}`}>
                        🎁 {cfg.advantages}
                      </p>
                    </div>

                    {/* Récompense de passage */}
                    {cfg.reward > 0 && (
                      <div
                        className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-1.5">
                          <Gift className={`w-3.5 h-3.5 ${isActive || isDone ? "text-yellow-300" : "text-white/30"}`} />
                          <span className={`text-[11px] font-bold ${isActive || isDone ? "text-yellow-300" : "text-white/30"}`}>
                            Récompense : {cfg.reward.toLocaleString()} FCFA
                          </span>
                        </div>
                        {isDone && (
                          <span className="text-[10px] bg-yellow-400/20 text-yellow-300 px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                            Contacter le responsable
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
