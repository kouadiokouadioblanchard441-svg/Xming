import { useRef, useEffect } from "react";
import { getFlagEmoji } from "@/lib/world-countries";
import { FALLBACK_COUNTRIES } from "@/lib/countries";

interface CountrySelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (countryCode: string) => void;
  selectedCode?: string;
  apiCountries?: { code: string; name: string; phonePrefix: string; isActive: boolean }[];
}

export function CountrySelector({
  open,
  onClose,
  onSelect,
  selectedCode,
  apiCountries,
}: CountrySelectorProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  // Ferme le popup au clic en dehors
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const sourceList =
    apiCountries && apiCountries.length > 0
      ? apiCountries
          .filter((c) => c.isActive)
          .map((c) => ({ code: c.code, name: c.name, phonePrefix: c.phonePrefix }))
      : FALLBACK_COUNTRIES.map((c) => ({
          code: c.code,
          name: c.name,
          phonePrefix: c.phonePrefix,
        }));

  return (
    <>
      {/* Overlay transparent cliquable */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Popup compact centré */}
      <div
        ref={popupRef}
        className="fixed z-50"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 8px 40px rgba(0,0,0,0.22)",
          minWidth: 140,
          maxWidth: 200,
          overflow: "hidden",
          padding: "8px 0",
        }}
      >
        {sourceList.map((country, index) => {
          const isSelected = country.code === selectedCode;
          return (
            <button
              key={country.code}
              type="button"
              onClick={() => {
                onSelect(country.code);
                onClose();
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                height: 48,
                background: isSelected ? "#f4f4f4" : "transparent",
                border: "none",
                cursor: "pointer",
                borderBottom:
                  index < sourceList.length - 1
                    ? "1px solid #f0f0f0"
                    : "none",
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>
                {getFlagEmoji(country.code)}
              </span>
              <span
                style={{
                  fontSize: 17,
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? "#000" : "#222",
                  letterSpacing: "0.03em",
                  fontFamily: "monospace",
                }}
              >
                +{country.phonePrefix}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
