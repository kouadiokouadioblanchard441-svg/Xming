/**
 * BannerCarousel — défilement automatique d'images avec indicateurs de points.
 * Utilisé sur la page d'accueil pour la bannière du haut et celle du milieu.
 */
import { useEffect, useRef, useState } from "react";

interface BannerCarouselProps {
  images: string[];
  height?: number;
  autoPlayMs?: number;
  rounded?: boolean;
  overlay?: React.ReactNode; // ex: logo en overlay
}

export default function BannerCarousel({
  images,
  height = 200,
  autoPlayMs = 3500,
  rounded = false,
  overlay,
}: BannerCarouselProps) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);

  const count = images.length;

  const next = () => setCurrent(c => (c + 1) % count);
  const prev = () => setCurrent(c => (c - 1 + count) % count);

  // Auto-play
  useEffect(() => {
    if (count <= 1) return;
    timerRef.current = setInterval(next, autoPlayMs);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [count, autoPlayMs]);

  // Reset timer on manual change
  const go = (idx: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrent(idx);
    if (count > 1) timerRef.current = setInterval(next, autoPlayMs);
  };

  // Touch swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -40) { if (timerRef.current) clearInterval(timerRef.current); next(); }
    if (dx >  40) { if (timerRef.current) clearInterval(timerRef.current); prev(); }
    touchStartX.current = null;
  };

  if (!images || images.length === 0) return null;

  return (
    <div
      className={`relative w-full overflow-hidden${rounded ? " rounded-2xl" : ""}`}
      style={{ height }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides */}
      <div
        className="flex h-full transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)`, width: `${count * 100}%` }}
      >
        {images.map((src, i) => (
          <div key={i} style={{ width: `${100 / count}%`, height: "100%", flexShrink: 0 }}>
            <img
              src={src}
              alt={`banner-${i + 1}`}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* Optional overlay (logo, etc.) */}
      {overlay && (
        <div className="absolute inset-0 pointer-events-none">
          {overlay}
        </div>
      )}

      {/* Dot indicators */}
      {count > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className="pointer-events-auto transition-all duration-200"
              style={{
                width:  i === current ? 18 : 6,
                height: 6,
                borderRadius: 3,
                background: i === current ? "#fff" : "rgba(255,255,255,0.5)",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
