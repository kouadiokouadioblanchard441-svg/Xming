export interface SpinWheelSegment {
  id: number;
  label: string;
  amount: number;
  color: string;      // segment background color
  dark: string;       // darker shade for stroke / text
  canWin: boolean;
  imageUrl?: string;  // optional image drawn on the segment
  weight?: number;    // relative probability weight (default 1)
}

export const DEFAULT_SPIN_WHEEL_SEGMENTS: SpinWheelSegment[] = [
  { id: 1, label: "Petit gain",       amount: 10,  color: "#F5C518", dark: "#5C3D00", canWin: true,  weight: 30 },
  { id: 2, label: "Tirage bonus",     amount: 0,   color: "#FFFDE7", dark: "#7C5200", canWin: false, weight: 10 },
  { id: 3, label: "Bonus spécial",    amount: 0,   color: "#F5C518", dark: "#5C3D00", canWin: false, weight: 10 },
  { id: 4, label: "Belle récompense", amount: 50,  color: "#FFFDE7", dark: "#7C5200", canWin: true,  weight: 20 },
  { id: 5, label: "Grand prix",       amount: 100, color: "#F5C518", dark: "#5C3D00", canWin: true,  weight: 5  },
  { id: 6, label: "Tirages bonus",    amount: 0,   color: "#FFFDE7", dark: "#7C5200", canWin: false, weight: 10 },
  { id: 7, label: "Petit gain",       amount: 10,  color: "#F5C518", dark: "#5C3D00", canWin: true,  weight: 30 },
  { id: 8, label: "Récompense",       amount: 20,  color: "#FFFDE7", dark: "#7C5200", canWin: true,  weight: 25 },
];

export const SPIN_WHEEL_SETTING_KEY = "spinWheelConfig";

export function parseSpinWheelSegments(value: string | null | undefined): SpinWheelSegment[] {
  if (!value) return DEFAULT_SPIN_WHEEL_SEGMENTS;

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.length !== DEFAULT_SPIN_WHEEL_SEGMENTS.length) {
      return DEFAULT_SPIN_WHEEL_SEGMENTS;
    }

    return parsed.map((segment, index) => ({
      ...DEFAULT_SPIN_WHEEL_SEGMENTS[index],
      ...segment,
      id: index + 1,
      label: typeof segment.label === "string" && segment.label.trim()
        ? segment.label.trim()
        : DEFAULT_SPIN_WHEEL_SEGMENTS[index].label,
      amount: Number.isFinite(Number(segment.amount)) && Number(segment.amount) >= 0
        ? Number(segment.amount)
        : DEFAULT_SPIN_WHEEL_SEGMENTS[index].amount,
      canWin: Boolean(segment.canWin),
      color: typeof segment.color === "string" && /^#[0-9a-f]{6}$/i.test(segment.color)
        ? segment.color
        : DEFAULT_SPIN_WHEEL_SEGMENTS[index].color,
      dark: typeof segment.dark === "string" && /^#[0-9a-f]{6}$/i.test(segment.dark)
        ? segment.dark
        : DEFAULT_SPIN_WHEEL_SEGMENTS[index].dark,
      imageUrl: typeof segment.imageUrl === "string" && segment.imageUrl.trim()
        ? segment.imageUrl.trim()
        : undefined,
      weight: Number.isFinite(Number(segment.weight)) && Number(segment.weight) > 0
        ? Number(segment.weight)
        : 1,
    }));
  } catch {
    return DEFAULT_SPIN_WHEEL_SEGMENTS;
  }
}

/** Weighted random pick among winnable segments */
export function pickWinningSegment(segments: SpinWheelSegment[]): SpinWheelSegment {
  const winnable = segments.filter((s) => s.canWin);
  if (winnable.length === 0) throw new Error("Aucune section gagnable configurée");

  const totalWeight = winnable.reduce((sum, s) => sum + (s.weight ?? 1), 0);
  const rand = Math.random() * totalWeight;
  let cumulative = 0;
  for (const seg of winnable) {
    cumulative += seg.weight ?? 1;
    if (rand < cumulative) return seg;
  }
  return winnable[winnable.length - 1];
}
