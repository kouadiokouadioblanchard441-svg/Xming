/**
 * Popup carte blanche — résultat d'un tour de roue.
 * Victoire : "Félicitations vous avez gagné X FCFA"
 * Défaite  : "Pas de chance !"
 */
interface Props {
  open: boolean;
  onClose: () => void;
  won: boolean;
  amount?: number;
  label?: string;
}

export default function WheelResultModal({ open, onClose, won, amount, label }: Props) {
  if (!open) return null;

  const displayAmount =
    amount && amount > 0
      ? amount >= 1000
        ? `${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)} 000 FCFA`
        : `${amount} FCFA`
      : label ?? "0 FCFA";

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
        <div className="px-6 py-8 space-y-3 text-center">
          {won ? (
            <>
              <div className="text-5xl mb-1">🎉</div>
              <p className="text-lg font-bold text-gray-900">
                Félicitations !
              </p>
              <p className="text-[15px] leading-relaxed text-gray-700">
                Vous avez gagné{" "}
                <span className="font-extrabold" style={{ color: "#E63946" }}>
                  {displayAmount}
                </span>
                {" "}crédité directement sur votre solde.
              </p>
            </>
          ) : (
            <>
              <div className="text-5xl mb-1">😔</div>
              <p className="text-lg font-bold text-gray-900">
                Pas de chance !
              </p>
              <p className="text-[14px] leading-relaxed text-gray-500">
                Réessayez lors de votre prochain tour.
              </p>
            </>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#e5e7eb" }} />

        {/* OK */}
        <button
          onClick={onClose}
          className="w-full py-4 text-center text-base font-semibold transition active:opacity-70"
          style={{ color: "#3B82F6" }}
        >
          OK
        </button>
      </div>
    </div>
  );
}
