import { useRef, useEffect } from "react";
import { FALLBACK_COUNTRIES } from "@/lib/countries";
import { SUPPORTED_COUNTRY_CODE } from "@shared/country-config";

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

  const apiCountry = apiCountries?.find(
    (country) => country.code === SUPPORTED_COUNTRY_CODE && country.isActive,
  );
  const fallback = FALLBACK_COUNTRIES[0];
  const sourceList = [{
    code: SUPPORTED_COUNTRY_CODE,
    name: apiCountry?.name ?? fallback.name,
    phonePrefix: apiCountry?.phonePrefix ?? fallback.phonePrefix,
  }];

  return (
    <>
      {/* Overlay transparent */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Popup — aligné à gauche sous le bouton indicatif */}
      <div
        ref={popupRef}
        className="fixed z-50"
        style={{
          /* Aligné sur le bord gauche du champ téléphone */
          top: "50%",
          left: "5%",
          transform: "translateY(-50%)",
          background: "#111",
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.40)",
          minWidth: 245,
          overflow: "hidden",
          padding: "6px 0",
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
                 justifyContent: "space-between",
                height: 46,
                 padding: "0 14px",
                background: isSelected ? "rgba(255,255,255,0.12)" : "transparent",
                border: "none",
                cursor: "pointer",
                borderBottom:
                  index < sourceList.length - 1
                    ? "1px solid rgba(255,255,255,0.08)"
                    : "none",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: isSelected ? 700 : 500,
                  color: "#ffffff",
                }}
              >
                {country.name}
              </span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: isSelected ? 700 : 500,
                  color: "#ffffff",
                  letterSpacing: "0.05em",
                  fontFamily: "monospace",
                }}
              >
                🇨🇩 +{country.phonePrefix}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
