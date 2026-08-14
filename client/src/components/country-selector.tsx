import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { getFlagEmoji } from "@/lib/world-countries";
import { FALLBACK_COUNTRIES } from "@/lib/countries";
import { useI18n } from "@/lib/i18n";

interface CountrySelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (countryCode: string) => void;
  selectedCode?: string;
  /** Pass API countries when available; falls back to the 4 hardcoded African countries */
  apiCountries?: { code: string; name: string; phonePrefix: string; isActive: boolean }[];
}

export function CountrySelector({ open, onClose, onSelect, selectedCode, apiCountries }: CountrySelectorProps) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSearch("");
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open]);

  // Use API countries if loaded, otherwise fall back to the 4 hardcoded countries only
  const sourceList = (apiCountries && apiCountries.length > 0)
    ? apiCountries.filter(c => c.isActive).map(c => ({ code: c.code, name: c.name, phonePrefix: c.phonePrefix }))
    : FALLBACK_COUNTRIES.map(c => ({ code: c.code, name: c.name, phonePrefix: c.phonePrefix }));

  const filtered = sourceList.filter((c) => {
    const q = search.toLowerCase().replace(/^\+/, "");
    return (
      c.name.toLowerCase().includes(q) ||
      c.phonePrefix.includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  });

  if (!open) return null;

  return (
    <>
      {/* Dark overlay behind the sheet */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.50)" }}
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div
        className="fixed bottom-0 inset-x-0 z-50 bg-white flex flex-col"
        style={{
          borderRadius: "20px 20px 0 0",
          maxHeight: "70vh",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
        }}
      >
        {/* Search bar */}
        <div className="shrink-0 px-4 pt-5 pb-3">
          <div
            className="flex items-center gap-3 px-4"
            style={{
              height: 48,
              background: "#F2F2F2",
              borderRadius: 999,
            }}
          >
            <Search style={{ width: 18, height: 18, color: "#9CA3AF", flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchCountryPlaceholder}
              className="flex-1 bg-transparent outline-none"
              style={{ fontSize: 15, color: "#1a1a1a", letterSpacing: "0.03em" }}
            />
          </div>
        </div>

        {/* Country list — scrollable */}
        <div className="flex-1 overflow-y-auto">
          {filtered.map((country, index) => {
            const isSelected = country.code === selectedCode;
            return (
              <button
                key={country.code}
                type="button"
                onClick={() => {
                  onSelect(country.code);
                  onClose();
                }}
                className="w-full flex items-center justify-between px-4"
                style={{
                  height: 56,
                  borderBottom:
                    index < filtered.length - 1
                      ? "1px dashed #BFDBFE"
                      : "none",
                  background: "transparent",
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                    color: isSelected ? "#E8A020" : "#1a1a1a",
                  }}
                >
                  {country.name} {getFlagEmoji(country.code)} (+{country.phonePrefix})
                </span>

                {isSelected && (
                  <span
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "#E8A020",
                    }}
                  >
                    <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                      <path
                        d="M1.5 5L5 8.5L11.5 1.5"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
