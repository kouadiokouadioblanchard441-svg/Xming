import { useRef, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import wheelAvatar from "@assets/xpeng-spin-wheel-3d.png";

interface FloatingWheelProps {
  bottomOffset?: number;
}

const SPIN_KEYFRAMES = `
@keyframes floatWheelSpin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
`;

export function FloatingWheel({ bottomOffset = 24 }: FloatingWheelProps) {
  const [, navigate] = useLocation();
  const { t }        = useI18n();
  const btnRef       = useRef<HTMLButtonElement>(null);
  const dragging     = useRef(false);
  const didDrag      = useRef(false);
  const startPos     = useRef({ x: 0, y: 0 });
  const startOffset  = useRef({ x: 0, y: 0 });

  const [pos, setPos] = useState<{ right: number; bottom: number } | null>(null);

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
      <style>{SPIN_KEYFRAMES}</style>
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
          animation:       "floatWheelSpin 4s linear infinite",
          transformOrigin: "center",
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "center",
          width:           "100%",
          height:          "100%",
        }}>
          <img
            src={wheelAvatar}
            alt={t.wheelTitle}
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
              pointerEvents: "none",
            }}
          />
        </div>
      </button>
    </>
  );
}
