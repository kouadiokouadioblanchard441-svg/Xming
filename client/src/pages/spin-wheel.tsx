import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import WheelRulesModal from "@/components/wheel-rules-modal";
import WheelInviteModal from "@/components/wheel-invite-modal";
import WheelNoToursModal from "@/components/wheel-no-tours-modal";
import WheelResultModal from "@/components/wheel-result-modal";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { ChevronLeft, ChevronDown, ChevronUp, Trophy } from "lucide-react";
import {
  DEFAULT_SPIN_WHEEL_SEGMENTS,
  type SpinWheelSegment,
} from "@shared/spin-wheel";

/* ── Fake winners ticker ────────────────────────────────────── */
const FAKE_WINNERS = [
  { phone: "0546******846", amount: "200F",   avatar: "/avatars/winner-1.jpg" },
  { phone: "0707******231", amount: "500F",   avatar: "/avatars/winner-2.jpg" },
  { phone: "0102******978", amount: "1 000F", avatar: "/avatars/winner-3.jpg" },
  { phone: "0503******412", amount: "200F",   avatar: "/avatars/winner-4.jpg" },
  { phone: "0749******065", amount: "2 000F", avatar: "/avatars/winner-5.jpg" },
  { phone: "0101******339", amount: "500F",   avatar: "/avatars/winner-6.jpg" },
  { phone: "0564******187", amount: "200F",   avatar: "/avatars/winner-7.jpg" },
  { phone: "0767******824", amount: "1 000F", avatar: "/avatars/winner-8.jpg" },
  { phone: "0505******553", amount: "200F",   avatar: "/avatars/winner-1.jpg" },
  { phone: "0103******710", amount: "5 000F", avatar: "/avatars/winner-2.jpg" },
  { phone: "0748******293", amount: "500F",   avatar: "/avatars/winner-3.jpg" },
  { phone: "0546******001", amount: "200F",   avatar: "/avatars/winner-4.jpg" },
  { phone: "0707******668", amount: "1 000F", avatar: "/avatars/winner-5.jpg" },
  { phone: "0101******452", amount: "200F",   avatar: "/avatars/winner-6.jpg" },
  { phone: "0505******317", amount: "2 000F", avatar: "/avatars/winner-7.jpg" },
];

function WinnersTicker() {
  const items = [...FAKE_WINNERS, ...FAKE_WINNERS];
  return (
    <div
      className="mx-4 mb-4 rounded-2xl overflow-hidden shadow-md"
      style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
    >
      {/* Title row */}
      <div
        className="flex items-center gap-2 px-4 py-2 border-b"
        style={{ borderColor: "#f3f4f6", background: "#f9fafb" }}
      >
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "#b45309" }}>
          🏆 Derniers gagnants
        </span>
      </div>

      {/* Scrolling ticker */}
      <div className="relative h-[220px] overflow-hidden">
        <style>{`
          @keyframes tickerScroll {
            0%   { transform: translateY(0); }
            100% { transform: translateY(-50%); }
          }
          .ticker-track {
            animation: tickerScroll ${FAKE_WINNERS.length * 1.8}s linear infinite;
          }
          .ticker-track:hover { animation-play-state: paused; }
        `}</style>
        <div className="ticker-track">
          {items.map((w, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between px-4"
              style={{ borderBottom: "1px solid #f3f4f6", height: "44px" }}
            >
              <div className="flex items-center gap-2">
                <img
                  src={w.avatar}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                  style={{ border: "2px solid #fbbf24" }}
                />
                <span className="text-sm font-medium tracking-wide font-mono text-gray-700">
                  {w.phone}
                </span>
              </div>
              <span className="text-sm font-extrabold" style={{ color: "#d97706" }}>
                + {w.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Palette ────────────────────────────────────────────────── */
const BG_TOP    = "#3b0b12";
const BG_MID    = "#000000";
const BG_BOT    = "#160407";

/* ── Segments ──────────────────────────────────────────────── */
const N   = DEFAULT_SPIN_WHEEL_SEGMENTS.length;
const ARC = (2 * Math.PI) / N;

/* ── Coin stack helper (draws 3 stacked coin circles) ─────── */
function drawCoinStack(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
) {
  for (let i = 2; i >= 0; i--) {
    const oy = -i * r * 0.55;
    // Jeton rouge/noir, assorti à la nouvelle roue
    ctx.beginPath();
    ctx.ellipse(x, y - oy + r * 0.28, r, r * 0.28, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#530812";
    ctx.fill();
    // Face du jeton avec effet glossy
    const g = ctx.createRadialGradient(x - r * 0.3, y - oy - r * 0.3, 0, x, y - oy, r);
    g.addColorStop(0, "#ff6b78");
    g.addColorStop(0.45, "#E8192C");
    g.addColorStop(1, "#650713");
    ctx.beginPath();
    ctx.arc(x, y - oy, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "#ffb0b7";
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
}

/* ── Draw wheel ─────────────────────────────────────────────── */
function drawWheel(
  canvas: HTMLCanvasElement,
  rotation: number,
  segments: SpinWheelSegment[],
  images: Record<number, HTMLImageElement | null> = {},
) {
  const ctx = canvas.getContext("2d")!;
  const W   = canvas.width;
  const cx  = W / 2;
  const cy  = W / 2;

  const outerR  = cx - 5;          // outer metallic ring edge
  const segR    = outerR - 26;     // segment outer radius
  const sepR    = segR * 0.30;     // inner separator ring radius
  const centerR = sepR * 0.82;     // GO button radius

  ctx.clearRect(0, 0, W, W);

  /* ── Drop shadow ── */
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy + 10, outerR - 2, 0, 2 * Math.PI);
  ctx.fillStyle = "rgba(0,0,0,0.30)";
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 10;
  ctx.fill();
  ctx.restore();

  /* ── Outer metallic black ring ── */
  const ringGrad = ctx.createLinearGradient(cx - outerR, cy - outerR, cx + outerR, cy + outerR);
  ringGrad.addColorStop(0,    "#555555");
  ringGrad.addColorStop(0.25, "#111111");
  ringGrad.addColorStop(0.50, "#343434");
  ringGrad.addColorStop(0.75, "#080808");
  ringGrad.addColorStop(1,    "#000000");
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, 2 * Math.PI);
  ctx.fillStyle = ringGrad;
  ctx.fill();
  ctx.strokeStyle = "#777777";
  ctx.lineWidth = 2;
  ctx.stroke();

  /* ── Draw 8 segments ── */
  for (let i = 0; i < N; i++) {
    const seg   = segments[i];
    const start = rotation + i * ARC - Math.PI / 2;
    const end   = start + ARC;
    const midA  = start + ARC / 2;

    // Palette XPENG : rouge, noir et blanc, tout en gardant la structure admin
    const DEFAULT_FILLS = ["#E8192C", "#111111", "#f7f7f7", "#8f101d"];
    const fillColor = DEFAULT_FILLS[i % DEFAULT_FILLS.length];
    const textColor = fillColor === "#f7f7f7" ? "#222222" : "#ffffff";

    /* Segment fill */
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, segR, start, end);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = "#292929";
    ctx.lineWidth = 2;
    ctx.stroke();

    /* ── Image or coin stack — at ~40% from center (inner icon zone) ── */
    const coinDist = segR * 0.40;
    const coinR    = segR * 0.085;
    const coinCx   = cx + Math.cos(midA) * coinDist;
    const coinCy   = cy + Math.sin(midA) * coinDist;

    const img = (images as Record<number, HTMLImageElement | null>)[seg.id];
    if (img && img.complete && img.naturalWidth > 0) {
      const imgSize = segR * 0.20;
      ctx.save();
      ctx.beginPath();
      ctx.arc(coinCx, coinCy, imgSize * 0.85, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, coinCx - imgSize, coinCy - imgSize, imgSize * 2, imgSize * 2);
      ctx.restore();
    } else {
      drawCoinStack(ctx, coinCx, coinCy, coinR);
    }

    /* ── Amount / label text — outer zone at ~68% from center ── */
    const textDist = segR * 0.68;
    ctx.save();
    ctx.translate(
      cx + Math.cos(midA) * textDist,
      cy + Math.sin(midA) * textDist,
    );
    let tRot = midA + Math.PI / 2;
    if (tRot > Math.PI / 2 && tRot < Math.PI * 1.5) tRot += Math.PI;
    ctx.rotate(tRot);
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle    = textColor;
    ctx.shadowColor  = "rgba(255,255,255,0.8)";
    ctx.shadowBlur   = 4;

    // Format: "100f", "1 000f", "😊" for non-winnable
    let displayText: string;
    if (!seg.canWin) {
      displayText = "😊";
    } else if (seg.amount > 0) {
      displayText = seg.amount >= 1000
        ? `${(seg.amount / 1000).toLocaleString("fr-FR")}kf`
        : `${seg.amount}f`;
    } else {
      displayText = seg.label;
    }

    const fontSize = Math.max(10, Math.min(15, segR * 0.118));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillText(displayText, 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  /* ── Inner metallic separator ring ── */
  const sepGrad = ctx.createRadialGradient(cx, cy, centerR, cx, cy, sepR);
  sepGrad.addColorStop(0,    "#626262");
  sepGrad.addColorStop(0.45, "#1e1e1e");
  sepGrad.addColorStop(1,    "#050505");
  ctx.beginPath();
  ctx.arc(cx, cy, sepR, 0, 2 * Math.PI);
  ctx.fillStyle = sepGrad;
  ctx.fill();
  ctx.strokeStyle = "#d9a83e";
  ctx.lineWidth = 2;
  ctx.stroke();

  /* ── Flame / teardrop pointer (fixed at 12-o'clock) ── */
  const flameBase = cy - sepR + 2;
  const flameTop  = flameBase - sepR * 0.70;
  const flameW    = sepR * 0.38;
  const flameG    = ctx.createLinearGradient(cx, flameTop, cx, flameBase);
  flameG.addColorStop(0,   "#ff6673");
  flameG.addColorStop(0.6, "#E8192C");
  flameG.addColorStop(1,   "#8f101d");
  ctx.beginPath();
  ctx.moveTo(cx, flameTop);
  ctx.bezierCurveTo(
    cx + flameW * 1.1, flameTop + (flameBase - flameTop) * 0.45,
    cx + flameW * 0.9, flameBase,
    cx, flameBase,
  );
  ctx.bezierCurveTo(
    cx - flameW * 0.9, flameBase,
    cx - flameW * 1.1, flameTop + (flameBase - flameTop) * 0.45,
    cx, flameTop,
  );
  ctx.fillStyle = flameG;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth   = 1;
  ctx.stroke();

  /* ── Center GO button ── */
  const btnG = ctx.createRadialGradient(
    cx - centerR * 0.3, cy - centerR * 0.3, 0,
    cx, cy, centerR,
  );
  btnG.addColorStop(0,   "#ff6673");
  btnG.addColorStop(0.4, "#E8192C");
  btnG.addColorStop(1,   "#650713");
  ctx.beginPath();
  ctx.arc(cx, cy, centerR, 0, 2 * Math.PI);
  ctx.fillStyle = btnG;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth   = 2.5;
  ctx.stroke();

  /* GO text */
  ctx.fillStyle    = "#FFF";
  ctx.font         = `bold ${Math.round(centerR * 0.62)}px sans-serif`;
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor  = "rgba(0,0,0,0.6)";
  ctx.shadowBlur   = 5;
  ctx.fillText("GO", cx, cy);
  ctx.shadowBlur = 0;
}

/* ── Recent spin entry type ──────────────────────────────── */
interface RecentSpin {
  phone: string;
  amount: string;
  description: string;
}

/* ── Page ───────────────────────────────────────────────────── */
export default function SpinWheelPage() {
  const { user, refreshUser } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();

  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const rotRef     = useRef(0);
  const animRef    = useRef<number | null>(null);
  const rafRef     = useRef<number | null>(null);
  const spinning   = useRef(false);

  const [rotation,    setRotation]   = useState(0);
  const [spinning2,   setSpinning2]  = useState(false);
  const [spinTokens,  setSpinTokens] = useState(() => user?.spinTokens ?? 0);
  const [showRules,   setShowRules]  = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showNoTours, setShowNoTours] = useState(false);
  const [spinResult,  setSpinResult]  = useState<{ won: boolean; amount: number; label: string } | null>(null);

  /* Personal spin history — for "Balance" + historique détaillé */
  const { data: spinHistory = [] } = useQuery<{ amount: string; description: string; createdAt: string }[]>({
    queryKey: ["/api/spin-wheel/history"],
  });
  const [showBalanceHistory, setShowBalanceHistory] = useState(false);

  /* Platform settings — for popup texts */
  const { data: platformSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });
  const inviteText = platformSettings?.spinWheelInviteText
    ?? "Invitez vos amis à s'inscrire et vous aurez plus de chances de gagner des prix, jusqu'à 50 fois par jour.";
  const inviteHighlight = platformSettings?.spinWheelInviteHighlight ?? "50";
  const rulesText = platformSettings?.spinWheelRulesText
    ?? "Achetez un produit pour obtenir des tours gratuits. Chaque tour vous donne une chance de remporter un gain en FCFA crédité directement sur votre solde.";
  const rulesHighlight = platformSettings?.spinWheelRulesHighlight ?? "";
  const wheelTotalWon = useMemo(
    () => spinHistory.reduce((sum, tx) => sum + parseFloat(tx.amount || "0"), 0),
    [spinHistory],
  );

  const [segments, setSegments] = useState<SpinWheelSegment[]>(DEFAULT_SPIN_WHEEL_SEGMENTS);
  const rotDrawRef   = useRef(rotation);
  const segDrawRef   = useRef(segments);
  const imagesRef    = useRef<Record<number, HTMLImageElement | null>>({});

  /* Sync spinTokens when user refreshes */
  useEffect(() => { setSpinTokens(user?.spinTokens ?? 0); }, [user?.spinTokens]);

  /* Load admin-configured segments */
  const { data: configuredSegments } = useQuery<SpinWheelSegment[]>({
    queryKey: ["/api/spin-wheel/config"],
  });
  useEffect(() => {
    if (configuredSegments?.length === N) setSegments(configuredSegments);
  }, [configuredSegments]);

  /* Pre-load segment images whenever segments change */
  useEffect(() => {
    const cache: Record<number, HTMLImageElement | null> = {};
    segments.forEach((seg) => {
      if (seg.imageUrl) {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.src = seg.imageUrl;
        cache[seg.id] = img;
      } else {
        cache[seg.id] = null;
      }
    });
    imagesRef.current = cache;
  }, [segments]);

  /* Recent global spins */
  const { data: recentSpins } = useQuery<RecentSpin[]>({
    queryKey: ["/api/spin-wheel/recent"],
    refetchInterval: 15000,
  });

  /* Keep draw refs in sync */
  useEffect(() => {
    rotDrawRef.current = rotation;
    segDrawRef.current = segments;
  }, [rotation, segments]);

  /* Animate wheel on canvas every frame */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const loop = () => {
      drawWheel(canvas, rotDrawRef.current, segDrawRef.current, imagesRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  /* Spin mutation */
  const spinMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/spin-wheel/spin", {});
      return r.json() as Promise<{ segmentId: number; amount: number; label: string }>;
    },
  });

  const handleSpin = useCallback(() => {
    if (spinning.current || spinMutation.isPending) return;

    /* No tours available → white-card popup */
    if (spinTokens <= 0) {
      setShowNoTours(true);
      return;
    }

    spinning.current = true;
    setSpinning2(true);

    spinMutation.mutate(undefined, {
      onSuccess: (result) => {
        const winIdx   = Math.max(0, segments.findIndex((s) => s.id === result.segmentId));
        const extra    = Math.PI * 2 * (6 + Math.random() * 4);
        const targetRot = rotRef.current + extra + (Math.PI * 2 - winIdx * ARC);
        const duration  = 3500;
        const startTime = performance.now();
        const startRot  = rotRef.current;

        function ease(p: number) {
          return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        }
        function tick(now: number) {
          const p = Math.min((now - startTime) / duration, 1);
          const c = startRot + (targetRot - startRot) * ease(p);
          rotRef.current = c;
          setRotation(c);
          if (p < 1) {
            animRef.current = requestAnimationFrame(tick);
          } else {
            spinning.current = false;
            setSpinning2(false);
            setSpinTokens((prev) => Math.max(0, prev - 1));
            refreshUser();
            /* Show result popup (win / loss) */
            const won = result.amount > 0;
            setSpinResult({ won, amount: result.amount, label: result.label });
          }
        }
        animRef.current = requestAnimationFrame(tick);
      },
      onError: (error: Error) => {
        spinning.current = false;
        setSpinning2(false);
        toast({ title: error.message || t.wheelErrUnavailable, variant: "destructive" });
      },
    });
  }, [spinTokens, segments, spinMutation, toast, t, refreshUser]);

  /* Cleanup */
  useEffect(() => () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (rafRef.current)  cancelAnimationFrame(rafRef.current);
  }, []);

  // balance kept for reference but we display wheelTotalWon in the UI

  /* Masked display list — prefer API data, fall back to demo rows */
  const historyRows: RecentSpin[] = useMemo(() => {
    if (recentSpins && recentSpins.length > 0) return recentSpins;
    return [];
  }, [recentSpins]);

  return (
    <>
      <div
        className="min-h-screen flex flex-col overflow-x-hidden pb-20"
        style={{
          background: `linear-gradient(180deg, ${BG_TOP} 0%, ${BG_MID} 45%, ${BG_BOT} 100%)`,
        }}
      >
          {/* ── Header with back button ── */}
        <header className="flex items-center px-4 pt-4 pb-2">
          <Link href="/account">
            <button
              className="w-9 h-9 rounded-full flex items-center justify-center transition active:scale-90"
              style={{ background: "rgba(255,255,255,0.15)" }}
              data-testid="button-back"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          </Link>
          <span
            className="ml-3 font-bold text-base"
            style={{ color: "#FFD700" }}
          >
            Roue de la fortune
          </span>
        </header>

        {/* ── Wheel ── */}
        <div className="flex flex-col items-center pt-2 px-4 mb-5">
          <div
            style={{
              borderRadius: "50%",
              boxShadow: "0 0 32px rgba(255,215,0,0.25), 0 10px 36px rgba(0,0,0,0.5)",
            }}
          >
            <canvas
              ref={canvasRef}
              width={340}
              height={340}
              style={{
                display: "block",
                width:  "min(88vw, 340px)",
                height: "min(88vw, 340px)",
                borderRadius: "50%",
                cursor: spinning2 ? "not-allowed" : "pointer",
              }}
              onClick={(e) => {
                /* Only spin when clicking the centre GO button */
                const canvas = canvasRef.current;
                if (!canvas) return;
                const rect   = canvas.getBoundingClientRect();
                const scaleX = canvas.width  / rect.width;
                const scaleY = canvas.height / rect.height;
                const x = (e.clientX - rect.left) * scaleX;
                const y = (e.clientY - rect.top)  * scaleY;
                const cx = canvas.width  / 2;
                const cy = canvas.height / 2;
                const outerR  = cx - 5;
                const segR    = outerR - 26;
                const centerR = segR * 0.30 * 0.82;
                const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
                if (dist <= centerR) handleSpin();
              }}
            />
          </div>
        </div>

        {/* ── Rules bar ── */}
        <div className="mx-4 mb-3">
          <div
            className="flex items-center justify-between rounded-2xl px-4 py-3"
            style={{
              background: "rgba(255,255,255,0.97)",
              boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
            }}
          >
            <span className="text-sm text-gray-600">
              Consultez les règles du jeu
            </span>
            <button
              onClick={() => setShowRules(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-base font-bold shrink-0 active:scale-90 transition-transform"
              style={{ background: "#E63946" }}
            >
              ?
            </button>
          </div>
        </div>

        {/* ── Balance / Gratuit row ── */}
        <div className="mx-4 mb-3">
          <div
            className="rounded-2xl overflow-hidden shadow-md"
            style={{ background: "rgba(255,255,255,0.97)" }}
          >
            {/* Top row */}
            <div className="flex items-center justify-between px-4 py-3">
              {/* Total gagné — cliquable pour voir l'historique */}
              <button
                className="flex items-center gap-2 active:opacity-70 transition-opacity"
                onClick={() => setShowBalanceHistory(v => !v)}
              >
                <Trophy className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-gray-700 font-medium">Balance</span>
                <span
                  className="px-3 py-0.5 rounded-full text-sm font-bold text-white"
                  style={{ background: "#3d8a40" }}
                >
                  {wheelTotalWon.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} FCFA
                </span>
                {showBalanceHistory
                  ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                  : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
              </button>

              {/* Gratuit */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 font-medium">Gratuit</span>
                <span
                  className="px-3 py-0.5 rounded-full text-sm font-bold text-white"
                  style={{ background: "#3d8a40" }}
                >
                  {spinTokens}
                </span>
                <button
                  onClick={() => setShowHistory(true)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-base font-bold shrink-0 active:scale-90 transition-transform"
                  style={{ background: "#E63946" }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Historique déroulant */}
            {showBalanceHistory && (
              <div className="border-t" style={{ borderColor: "#f3f4f6" }}>
                {spinHistory.length === 0 ? (
                  <p className="text-center text-gray-400 text-xs py-4">Aucun gain pour l'instant</p>
                ) : (
                  <div className="max-h-52 overflow-y-auto divide-y divide-gray-100">
                    {spinHistory.slice().reverse().map((tx, i) => {
                      const d = tx.createdAt ? new Date(tx.createdAt) : null;
                      const dateStr = d
                        ? `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`
                        : "";
                      return (
                        <div key={i} className="flex items-center justify-between px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🎰</span>
                            <div>
                              <p className="text-xs font-semibold text-gray-800">{tx.description || "Gain roue"}</p>
                              <p className="text-[10px] text-gray-400">{dateStr}</p>
                            </div>
                          </div>
                          <span className="text-sm font-extrabold" style={{ color: "#16a34a" }}>
                            +{Number(tx.amount).toLocaleString("fr-FR")} FCFA
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Winners ticker ── */}
        <WinnersTicker />
      </div>

      {/* ── Modals ── */}
      <WheelRulesModal
        open={showRules}
        onClose={() => setShowRules(false)}
        text={rulesText}
        highlight={rulesHighlight}
      />
      <WheelInviteModal
        open={showHistory}
        onClose={() => setShowHistory(false)}
        text={inviteText}
        highlight={inviteHighlight}
      />
      <WheelNoToursModal
        open={showNoTours}
        onClose={() => setShowNoTours(false)}
        referralCode={user?.referralCode ?? ""}
      />
      <WheelResultModal
        open={spinResult !== null}
        onClose={() => setSpinResult(null)}
        won={spinResult?.won ?? false}
        amount={spinResult?.amount}
        label={spinResult?.label}
      />
    </>
  );
}
