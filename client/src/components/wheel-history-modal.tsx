import { ChevronLeft, Loader2, XCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import type { Transaction } from "@shared/schema";

interface WheelHistoryModalProps {
  open: boolean;
  onClose: () => void;
}

function formatDate(dateStr: string | Date) {
  const d = new Date(dateStr);
  return (
    d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) +
    " · " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
  img,
  imgPosition = "center",
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
  img: string;
  imgPosition?: string;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: "linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)",
        border: `1.5px solid ${accent}55`,
        boxShadow: `0 4px 18px rgba(0,0,0,0.35)`,
      }}
    >
      {/* Image */}
      <div className="w-full h-20 overflow-hidden relative">
        <img
          src={img}
          alt={label}
          className="w-full h-full object-cover"
          style={{ objectPosition: imgPosition, filter: "brightness(0.85)" }}
        />
        {/* bottom fade into card */}
        <div
          className="absolute inset-x-0 bottom-0 h-6"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.55))" }}
        />
      </div>

      {/* Text */}
      <div className="px-3 pt-2 pb-3">
        <p
          className="text-xs font-semibold uppercase tracking-wide mb-0.5"
          style={{ color: accent }}
        >
          {label}
        </p>
        <p className="font-extrabold text-xl leading-tight text-white">{value}</p>
        {sub && (
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function HistoryRow({ tx, noGainLabel }: { tx: Transaction; noGainLabel: string }) {
  const amount = parseFloat(tx.amount);
  const won = amount > 0;
  const label = tx.description.replace(/^Gain roue\s*:\s*/i, "").trim() || "—";

  return (
    <div
      className="flex items-center gap-3 py-3 border-b"
      style={{ borderColor: "rgba(255,255,255,0.07)" }}
    >
      {/* Icon */}
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
        style={{
          background: won
            ? "linear-gradient(135deg, #b8860b 0%, #ffd700 100%)"
            : "rgba(255,255,255,0.07)",
          border: won ? "none" : "1px solid rgba(255,255,255,0.12)",
        }}
      >
        {won ? (
          <img
            src="/trophy.jpg"
            alt="Trophée"
            className="w-full h-full rounded-full object-cover object-top"
          />
        ) : (
          <XCircle className="w-5 h-5" style={{ color: "rgba(255,255,255,0.3)" }} />
        )}
      </div>

      {/* Label + date */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold truncate"
          style={{ color: won ? "#ffffff" : "rgba(255,255,255,0.38)" }}
        >
          {won ? label : noGainLabel}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
          {formatDate(tx.createdAt)}
        </p>
      </div>

      {/* Amount */}
      <div className="shrink-0 text-right">
        <p
          className="text-sm font-bold"
          style={{ color: won ? "#ffd700" : "rgba(255,255,255,0.25)" }}
        >
          {won ? `+${amount.toFixed(2)}` : "—"}
        </p>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>USDT</p>
      </div>
    </div>
  );
}

export default function WheelHistoryModal({ open, onClose }: WheelHistoryModalProps) {
  const { t } = useI18n();

  const { data: history, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/spin-wheel/history"],
    enabled: open,
  });

  if (!open) return null;

  const totalWon = (history ?? []).reduce(
    (sum, tx) => sum + Math.max(0, parseFloat(tx.amount)),
    0,
  );
  const spinCount = history?.length ?? 0;
  const winCount = (history ?? []).filter((tx) => parseFloat(tx.amount) > 0).length;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 50% 0%, #cc1010 0%, #8b0000 40%, #5c0000 100%)",
      }}
    >
      {/* Gold rope */}
      <div
        style={{
          height: 5,
          background:
            "repeating-linear-gradient(90deg, #b8860b 0px, #ffd700 6px, #ffec6e 10px, #ffd700 14px, #b8860b 20px)",
          flexShrink: 0,
        }}
      />

      {/* Header */}
      <div
        className="flex items-center px-4 py-3 shrink-0"
        style={{
          background: "rgba(0,0,0,0.25)",
          borderBottom: "1px solid rgba(255,215,0,0.15)",
        }}
      >
        <button
          onClick={onClose}
          className="p-2 rounded-full active:scale-95 transition-transform"
          style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1 text-center">
          <h1
            className="font-extrabold text-lg tracking-wide"
            style={{ color: "#ffd700", textShadow: "0 0 16px rgba(255,215,0,0.5)" }}
          >
            {t.wheelHistoryTitle}
          </h1>
        </div>
        <div className="w-11" />
      </div>

      {/* Stats strip */}
      {!isLoading && spinCount > 0 && (
        <div className="px-4 pt-4 pb-2 grid grid-cols-2 gap-3 shrink-0">
          <StatCard
            label={t.wheelTotalRewardsLabel.replace(":", "")}
            value={`${totalWon.toFixed(2)}`}
            sub="USDT"
            accent="#ffd700"
            img="/trophy.jpg"
            imgPosition="center 20%"
          />
          <StatCard
            label={t.wheelHistoryTitle}
            value={String(spinCount)}
            sub={t.wheelWinnersCount.replace("{0}", String(winCount))}
            accent="#a78bfa"
            img="/vip-badge.png"
            imgPosition="center center"
          />
        </div>
      )}

      {/* Divider */}
      {!isLoading && spinCount > 0 && (
        <div className="mx-4 mt-2 mb-1 flex items-center gap-2 shrink-0">
          <div className="flex-1 h-px" style={{ background: "rgba(255,215,0,0.18)" }} />
          <p className="text-xs font-medium" style={{ color: "rgba(255,215,0,0.55)" }}>
            {t.wheelHistoryDividerLabel}
          </p>
          <div className="flex-1 h-px" style={{ background: "rgba(255,215,0,0.18)" }} />
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#ffd700" }} />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
              {t.loading}
            </p>
          </div>
        ) : !history || history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 gap-4 text-center">
            <span className="text-6xl">🎡</span>
            <div>
              <p className="font-semibold text-white mb-1">{t.wheelHistoryEmpty}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                {t.wheelFirstSpinHint}
              </p>
            </div>
          </div>
        ) : (
          <div>
            {history.map((tx) => (
              <HistoryRow key={tx.id} tx={tx} noGainLabel={t.wheelHistoryNoGain} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
