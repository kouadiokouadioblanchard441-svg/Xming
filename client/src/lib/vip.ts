// ── Système VIP XPENG ───────────────────────────────────────────────────────

export interface TeamStats {
  level1Count: number;
  level2Count: number;
  level3Count: number;
}

export interface VipLevelConfig {
  level: number;
  label: string;
  description: string;
  advantages: string;
  minDirectA: number | null;
  minLevelB: number | null;
  minTotalTeam: number | null;
  requiresInvestment: boolean;
  reward: number;
}

/** Conditions par défaut — toutes remplaçables depuis l'admin */
export const DEFAULT_VIP_CONFIGS: VipLevelConfig[] = [
  {
    level: 0, label: "VIP 0",
    description: "Membre inscrit n'ayant pas encore investi.",
    advantages: "Accès à la plateforme. Possibilité de déposer et d'investir.",
    minDirectA: null, minLevelB: null, minTotalTeam: null,
    requiresInvestment: false, reward: 0,
  },
  {
    level: 1, label: "VIP 1",
    description: "Nouveau membre ayant réalisé son premier investissement.",
    advantages: "Accès complet à la plateforme. Gains quotidiens. Commissions de parrainage actives.",
    minDirectA: null, minLevelB: null, minTotalTeam: null,
    requiresInvestment: true, reward: 0,
  },
  {
    level: 2, label: "VIP 2",
    description: "Membre actif avec 3 filleuls directs (niveau A).",
    advantages: "Statut VIP 2. Reconnaissance de votre activité de recrutement.",
    minDirectA: 3, minLevelB: null, minTotalTeam: null,
    requiresInvestment: true, reward: 500,
  },
  {
    level: 3, label: "VIP 3",
    description: "Minimum 3 membres directs (A) ayant commencé à construire leur propre réseau (niveau B).",
    advantages: "Statut VIP 3. Équipe structurée sur 2 niveaux.",
    minDirectA: 3, minLevelB: 1, minTotalTeam: null,
    requiresInvestment: true, reward: 1000,
  },
  {
    level: 4, label: "VIP 4",
    description: "Minimum 100 membres dans l'équipe totale (niveaux A + B + C).",
    advantages: "Statut VIP 4. Leader d'équipe confirmé.",
    minDirectA: null, minLevelB: null, minTotalTeam: 100,
    requiresInvestment: true, reward: 2000,
  },
  {
    level: 5, label: "VIP 5",
    description: "Minimum 300 membres dans l'équipe totale.",
    advantages: "Statut VIP 5. Ambassadeur de la plateforme.",
    minDirectA: null, minLevelB: null, minTotalTeam: 300,
    requiresInvestment: true, reward: 3500,
  },
  {
    level: 6, label: "VIP 6",
    description: "Minimum 600 membres dans l'équipe totale.",
    advantages: "Statut VIP 6. Partenaire élite.",
    minDirectA: null, minLevelB: null, minTotalTeam: 600,
    requiresInvestment: true, reward: 5000,
  },
  {
    level: 7, label: "VIP 7",
    description: "Minimum 1 000 membres dans l'équipe totale.",
    advantages: "Statut VIP 7. Rang suprême. Reconnaissance maximale.",
    minDirectA: null, minLevelB: null, minTotalTeam: 1000,
    requiresInvestment: true, reward: 7500,
  },
];

/** Fusionne TOUTES les valeurs admin (textes + conditions + récompenses) */
export function mergeAdminVipConfig(
  defaults: VipLevelConfig[],
  settings: Record<string, string>,
): VipLevelConfig[] {
  return defaults.map((cfg) => {
    const n = (key: string, fallback: number | null): number | null => {
      const v = settings[key];
      if (v === undefined || v === "") return fallback;
      const parsed = parseInt(v, 10);
      return isNaN(parsed) ? fallback : parsed;
    };
    return {
      ...cfg,
      label:         settings[`vip${cfg.level}Label`]       || cfg.label,
      description:   settings[`vip${cfg.level}Description`] || cfg.description,
      advantages:    settings[`vip${cfg.level}Advantages`]  || cfg.advantages,
      minDirectA:    n(`vip${cfg.level}MinDirectA`,  cfg.minDirectA),
      minLevelB:     n(`vip${cfg.level}MinLevelB`,   cfg.minLevelB),
      minTotalTeam:  n(`vip${cfg.level}MinTotalTeam`, cfg.minTotalTeam),
      reward:        n(`vip${cfg.level}Reward`,       cfg.reward) ?? cfg.reward,
    };
  });
}

/** Calcule le niveau VIP à partir des configs (potentiellement modifiées par l'admin) */
export function computeVipLevel(
  productCount: number,
  stats: TeamStats,
  configs: VipLevelConfig[] = DEFAULT_VIP_CONFIGS,
): number {
  const total = stats.level1Count + stats.level2Count + stats.level3Count;

  // Parcourt les niveaux du plus élevé au plus bas
  for (let lvl = 7; lvl >= 1; lvl--) {
    const cfg = configs[lvl];
    if (!cfg) continue;

    if (cfg.requiresInvestment && productCount < 1) continue;
    if (cfg.minTotalTeam !== null && total < cfg.minTotalTeam) continue;
    if (cfg.minDirectA  !== null && stats.level1Count < cfg.minDirectA) continue;
    if (cfg.minLevelB   !== null && stats.level2Count < cfg.minLevelB) continue;

    return lvl;
  }
  return productCount >= 1 ? 1 : 0;
}

/**
 * Calcule le niveau VIP basé sur le produit acheté.
 * VIP 0 = aucun produit actif.
 * VIP N = sortOrder du produit actif le plus élevé (plafonné à 7).
 */
export function computeVipLevelFromProduct(userProducts: any[]): number {
  if (!userProducts || userProducts.length === 0) return 0;
  const active = userProducts.filter(
    (p: any) => p.status === "active" || (p.daysRemaining && p.daysRemaining > 0),
  );
  if (active.length === 0) return 0;
  const maxSort = Math.max(...active.map((p: any) => p.product?.sortOrder ?? 0));
  return Math.min(maxSort, 7);
}

/** Couleur / style du badge selon le niveau */
export const VIP_BADGE_STYLE: Record<number, { bg: string; text: string; border: string }> = {
  0: { bg: "rgba(255,255,255,0.15)", text: "#ffffff", border: "rgba(255,255,255,0.3)" },
  1: { bg: "linear-gradient(90deg,#333333,#000000)",  text: "#fff", border: "transparent" },
  2: { bg: "linear-gradient(90deg,#b8860b,#8b6508)",  text: "#fff", border: "transparent" },
  3: { bg: "linear-gradient(90deg,#cd7f32,#a0522d)",  text: "#fff", border: "transparent" },
  4: { bg: "linear-gradient(90deg,#c0c0c0,#808080)",  text: "#fff", border: "transparent" },
  5: { bg: "linear-gradient(90deg,#ffd700,#ffa500)",  text: "#fff", border: "transparent" },
  6: { bg: "linear-gradient(90deg,#00bcd4,#0097a7)",  text: "#fff", border: "transparent" },
  7: { bg: "linear-gradient(90deg,#e91e63,#9c27b0)",  text: "#fff", border: "transparent" },
};
