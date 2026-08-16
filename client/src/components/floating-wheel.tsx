import { useRef, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { DEFAULT_SPIN_WHEEL_SEGMENTS, type SpinWheelSegment } from "@shared/spin-wheel";

interface FloatingWheelProps {
  bottomOffset?: number;
}

function MiniWheel({ size = 64, segments }: { size?: number; segments: SpinWheelSegment[] }) {
  const cx = size / 2;
  const cy = size / 2;
  const outer = size / 2 - 1;
  const inner = outer - 9;
  const hub = size / 8;
  const n = segments.length;
  const arc = (2 * Math.PI) / n;
  const fills = ["#E8192C", "#111111", "#f7f7f7", "#8f101d"];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <defs>
        <radialGradient id="miniWheelHub" cx="32%" cy="28%">
          <stop offset="0%" stopColor="#fff4d1" />
          <stop offset="45%" stopColor="#d9a83e" />
          <stop offset="100%" stopColor="#7a4b10" />
        </radialGradient>
        <linearGradient id="miniWheelRim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#555" />
          <stop offset="35%" stopColor="#111" />
          <stop offset="70%" stopColor="#2d2d2d" />
          <stop offset="100%" stopColor="#050505" />
        </linearGradient>
      </defs>

      <circle cx={cx} cy={cy} r={outer} fill="url(#miniWheelRim)" stroke="#000" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={outer - 3} fill="none" stroke="#777" strokeWidth="0.8" opacity="0.8" />

      {segments.map((segment, i) => {
        const start = i * arc - Math.PI / 2;
        const end = start + arc;
        const x1 = cx + Math.cos(start) * inner;
        const y1 = cy + Math.sin(start) * inner;
        const x2 = cx + Math.cos(end) * inner;
        const y2 = cy + Math.sin(end) * inner;
        const mid = start + arc / 2;
        const labelRadius = inner * 0.69;
        const label = segment.canWin
          ? segment.amount >= 1000
            ? `${segment.amount / 1000}k`
            : `${segment.amount}`
          : "•";
        return (
          <g key={segment.id}>
            <path
              d={`M ${cx} ${cy} L ${x1} ${y1} A ${inner} ${inner} 0 0 1 ${x2} ${y2} Z`}
              fill={fills[i % fills.length]}
              stroke="#292929"
              strokeWidth="0.8"
            />
            <text
              x={cx + Math.cos(mid) * labelRadius}
              y={cy + Math.sin(mid) * labelRadius}
              fill={fills[i % fills.length] === "#f7f7f7" ? "#222" : "#fff"}
              fontSize={size / 13}
              fontWeight="800"
              textAnchor="middle"
              dominantBaseline="central"
              transform={`rotate(${(mid * 180) / Math.PI + 90} ${cx + Math.cos(mid) * labelRadius} ${cy + Math.sin(mid) * labelRadius})`}
            >
              {label}
            </text>
          </g>
        );
      })}

      <circle cx={cx} cy={cy} r={hub + 2} fill="#3a3a3a" stroke="#d9a83e" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={hub} fill="url(#miniWheelHub)" stroke="#fff0c2" strokeWidth="0.7" />
      <text x={cx} y={cy} fill="#fff" fontSize={size / 16} fontWeight="900" textAnchor="middle" dominantBaseline="central">
        GO
      </text>
      <path d={`M ${cx} 1 L ${cx - 3} 8 L ${cx + 3} 8 Z`} fill="#E8192C" stroke="#fff" strokeWidth="0.6" />
    </svg>
  );
}

export function FloatingWheel({ bottomOffset = 24 }: FloatingWheelProps) {
  const [, navigate] = useLocation();
  const { t }        = useI18n();
  const btnRef       = useRef<HTMLButtonElement>(null);
  const dragging     = useRef(false);
  const didDrag      = useRef(false);
  const startPos     = useRef({ x: 0, y: 0 });
  const startOffset  = useRef({ x: 0, y: 0 });

  const [pos, setPos] = useState<{ right: number; bottom: number } | null>(null);

  const { data: configuredSegments } = useQuery<SpinWheelSegment[]>({
    queryKey: ["/api/spin-wheel/config"],
  });
  const segments = configuredSegments?.length ? configuredSegments : DEFAULT_SPIN_WHEEL_SEGMENTS;

  useEffect(() => {
    setPos({ right: 18, bottom: bottomOffset + 120 });
  }, [bottomOffset]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!btnRef.current || pos === null) return;
    dragging.current  = true;
    didDrag.current   = false;
    btnRef.current.setPointerCapture(e.pointerId);
    startPos.current    = { x: e.clientX, y: e.clientY };
    const rect = btnRef.current.getBoundingClientRect();
    startOffset.current = { x: rect.left, y: rect.top };
    e.preventDefault();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || pos === null) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) didDrag.current = true;
    const newLeft = startOffset.current.x + dx;
    const newTop  = startOffset.current.y + dy;
    const btnSize = 64;
    const clampedLeft = Math.max(0, Math.min(window.innerWidth  - btnSize, newLeft));
    const clampedTop  = Math.max(0, Math.min(window.innerHeight - btnSize, newTop));
    setPos({
      right:  window.innerWidth  - clampedLeft - btnSize,
      bottom: window.innerHeight - clampedTop  - btnSize,
    });
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (!didDrag.current) navigate("/spin-wheel");
  };

  if (pos === null) return null;

  return (
    <>
      <button
        ref={btnRef}
        aria-label={t.wheelTitle}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          position:    "fixed",
          right:       pos.right,
          bottom:      pos.bottom,
          zIndex:      200,
          width:       64,
          height:      64,
          borderRadius:"50%",
          border:      "none",
          padding:     0,
          cursor:      "grab",
          background:  "transparent",
          boxShadow:   "0 4px 20px rgba(0,0,0,0.30)",
          overflow:    "hidden",
          touchAction: "none",
          userSelect:  "none",
          display:     "flex",
          alignItems:  "center",
          justifyContent: "center",
        }}
      >
        <div style={{
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "center",
          width:           "100%",
          height:          "100%",
        }}>
          <MiniWheel size={64} segments={segments} />
        </div>
      </button>
    </>
  );
}
