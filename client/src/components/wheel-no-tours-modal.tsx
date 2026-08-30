/**
 * Popup carte blanche — affiché quand GO est pressé sans tour disponible.
 * Rappelle à l'utilisateur de partager son lien ou d'acheter un produit.
 */
interface Props {
  open: boolean;
  onClose: () => void;
  referralCode?: string;
}

export default function WheelNoToursModal({ open, onClose, referralCode }: Props) {
  if (!open) return null;

  const link = referralCode
    ? `${window.location.origin}/register?ref=${referralCode}`
    : `${window.location.origin}/register`;

  function copyLink() {
    navigator.clipboard.writeText(link).catch(() => {});
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "rgba(0,0,0,0.40)" }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-2xl overflow-hidden shadow-2xl"
        style={{ maxWidth: 380, background: "#fff" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Body */}
        <div className="px-6 py-7 space-y-4">
          {/* Icon */}
          <div className="flex justify-center">
            <span className="text-5xl">🎡</span>
          </div>

          <p className="text-[15px] leading-relaxed text-gray-800 text-center font-semibold">
            Vous n'avez aucun tour disponible.
          </p>

          <p className="text-[14px] leading-relaxed text-gray-600 text-center">
            Invitez vos amis à s'inscrire grâce à votre lien. Lorsqu'ils achètent un produit, vous obtenez des tours gratuits. Vous pouvez aussi{" "}
            <span className="font-bold text-gray-800">acheter un produit</span>{" "}
            vous-même pour gagner des tours.
          </p>

          {/* Referral link box */}
          {referralCode && (
            <div
              className="flex items-center gap-2 rounded-xl border px-3 py-2"
              style={{ background: "#f9fafb", borderColor: "#e5e7eb" }}
            >
              <span
                className="flex-1 text-xs text-gray-500 truncate font-mono select-all"
              >
                {link}
              </span>
              <button
                onClick={copyLink}
                className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-95"
                style={{ background: "#3B82F6", color: "#fff" }}
              >
                Copier
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#e5e7eb" }} />

        {/* Actions */}
        <div className="flex">
          <button
            onClick={onClose}
            className="flex-1 py-4 text-center text-base font-semibold transition active:opacity-70 border-r"
            style={{ color: "#6B7280", borderColor: "#e5e7eb" }}
          >
            Fermer
          </button>
          <a
            href="/invest"
            className="flex-1 py-4 text-center text-base font-semibold transition active:opacity-70"
            style={{ color: "#3B82F6" }}
          >
            Acheter
          </a>
        </div>
      </div>
    </div>
  );
}
