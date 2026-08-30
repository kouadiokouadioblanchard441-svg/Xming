/**
 * Popup carte blanche — s'affiche quand on clique sur "+"
 * Texte configurable depuis le panel admin (spinWheelInviteText)
 */
interface WheelInviteModalProps {
  open: boolean;
  onClose: () => void;
  text: string;
  highlight?: string; // highlighted portion (bold red)
}

export default function WheelInviteModal({
  open,
  onClose,
  text,
  highlight,
}: WheelInviteModalProps) {
  if (!open) return null;

  // Split text around the highlight so we can style it
  let before = text;
  let after = "";
  if (highlight && text.includes(highlight)) {
    const idx = text.indexOf(highlight);
    before = text.slice(0, idx);
    after  = text.slice(idx + highlight.length);
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "rgba(0,0,0,0.35)" }}
      onClick={onClose}
    >
      {/* Card — stop propagation so clicking inside doesn't close */}
      <div
        className="w-full rounded-2xl overflow-hidden shadow-2xl"
        style={{ maxWidth: 380, background: "#fff" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Body */}
        <div className="px-6 py-7">
          <p className="text-[15px] leading-relaxed text-gray-800">
            {highlight ? (
              <>
                {before}
                <span className="font-extrabold" style={{ color: "#E63946" }}>
                  {highlight}
                </span>
                {after}
              </>
            ) : (
              text
            )}
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#e5e7eb" }} />

        {/* OK button */}
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
