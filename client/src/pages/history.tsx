import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import img3dDeposit    from "@assets/3d-deposit.png";
import img3dWithdrawal from "@assets/3d-withdrawal.png";
import img3dEarning    from "@assets/3d-earning.png";
import img3dCommission from "@assets/3d-commission.png";
import img3dBonus      from "@assets/3d-bonus.png";
import img3dGiftCode   from "@assets/3d-gift-code.png";
import img3dTask       from "@assets/3d-task.png";
import img3dSpin       from "@assets/3d-spin.png";
import imgAsus3d       from "@assets/asus-3d-text.png";

// ── Types ────────────────────────────────────────────────────────────────────
interface HistoryItem {
  id: string;
  category: string;
  amount: string;
  status: string;
  description: string;
  createdAt: string;
  extra: {
    fees?: string | null;
    netAmount?: string | null;
    paymentMethod?: string | null;
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}  ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatRef(id: string) {
  return `TXN-${String(id).padStart(8, "0")}`;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  completed:   { label: "COMPLÉTÉ",   color: "#00b300" },
  approved:    { label: "ARRIVÉ",     color: "#00b300" },
  pending:     { label: "EN ATTENTE", color: "#ff8c00" },
  pending_2fa: { label: "2FA REQUIS", color: "#ff8c00" },
  processing:  { label: "EN COURS",  color: "#0055ff" },
  rejected:    { label: "REJETÉ",    color: "#ff0000" },
  failed:      { label: "ÉCHOUÉ",    color: "#ff0000" },
};

const CATEGORY_META: Record<string, { label: string; color: string; sign: "+" | "-"; img: string }> = {
  deposit:     { label: "DÉPÔT",              color: "#0055ff", sign: "+", img: img3dDeposit    },
  withdrawal:  { label: "RETRAIT",            color: "#ff0000", sign: "-", img: img3dWithdrawal },
  earning:     { label: "GAIN PRODUIT",       color: "#00b300", sign: "+", img: img3dEarning    },
  commission:  { label: "BONUS PARRAINAGE",   color: "#00b300", sign: "+", img: img3dCommission },
  bonus:       { label: "BONUS",              color: "#00b300", sign: "+", img: img3dBonus      },
  gift_code:   { label: "CODE CADEAU",        color: "#00b300", sign: "+", img: img3dGiftCode   },
  task_reward: { label: "RÉCOMPENSE TÂCHE",   color: "#00b300", sign: "+", img: img3dTask       },
  spin_reward: { label: "RÉCOMPENSE SPIN",    color: "#9900cc", sign: "+", img: img3dSpin       },
};

function getCategoryMeta(category: string) {
  return CATEGORY_META[category] ?? { label: category.toUpperCase(), color: "#333333", sign: "+" as const, img: img3dBonus };
}

// ── Ligne de détail ──────────────────────────────────────────────────────────
function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1" style={{ borderBottom: "1px dotted #e5e7eb" }}>
      <span style={{ color: "#888888", fontSize: 11, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1, whiteSpace: "nowrap" }}>
        {label}
      </span>
      <span style={{ color: valueColor ?? "#111111", fontSize: 12, fontFamily: "monospace", fontWeight: 700, textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const { data: items = [], isLoading } = useQuery<HistoryItem[]>({
    queryKey: ["/api/history/all"],
    staleTime: 0,
    refetchOnMount: true,
  });

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#ececec" }}>

      {/* Header */}
      <header className="flex items-center px-4 py-4 bg-white border-b border-gray-200 sticky top-0 z-10">
        <Link href="/account">
          <button className="p-1" data-testid="button-back">
            <ChevronLeft className="w-6 h-6 text-gray-800" strokeWidth={2.5} />
          </button>
        </Link>
        <h1 className="flex-1 text-center font-extrabold text-gray-900 pr-8 text-lg tracking-widest uppercase" style={{ fontFamily: "monospace" }}>
          Historique
        </h1>
      </header>

      {/* List */}
      <div className="flex-1 px-3 py-4 space-y-4 pb-10">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-3">🧾</p>
            <p className="text-gray-400 text-sm font-semibold">Aucune transaction</p>
          </div>
        ) : (
          items.map((item) => {
            const cat = getCategoryMeta(item.category);
            const st  = STATUS_MAP[item.status] ?? { label: item.status.toUpperCase(), color: "#888888" };
            const amt = parseFloat(item.amount);
            const fees = item.extra.fees ? parseFloat(item.extra.fees) : null;
            const net  = item.extra.netAmount ? parseFloat(item.extra.netAmount) : null;
            const amtColor = cat.sign === "+" ? "#00b300" : "#ff0000";

            return (
              <div
                key={item.id}
                data-testid={`history-item-${item.id}`}
                style={{
                  background: "#ffffff",
                  border: "1px solid #cccccc",
                  borderRadius: 0,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                  position: "relative",
                  overflow: "visible",
                  fontFamily: "monospace",
                }}
              >

                {/* ══ EN-TÊTE ══════════════════════════════════════════ */}
                <div style={{ background: "#111111", padding: "10px 16px" }}>
                  {/* Logo 3D ASUS */}
                  <div style={{ textAlign: "center", marginBottom: 6 }}>
                    <img
                      src={imgAsus3d}
                      alt="ASUS"
                      style={{ height: 36, maxWidth: "100%", objectFit: "contain", display: "inline-block" }}
                    />
                  </div>
                  <div style={{ borderTop: "1px solid #444444", marginBottom: 6 }} />
                  {/* Catégorie + Statut */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8, color: cat.color, fontWeight: 900, fontSize: 13, letterSpacing: 1 }}>
                      <img src={cat.img} alt={cat.label} style={{ width: 28, height: 28, objectFit: "contain", flexShrink: 0 }} />
                      {cat.label}
                    </span>
                    <span style={{ color: st.color, fontWeight: 900, fontSize: 11, letterSpacing: 1 }}>
                      ● {st.label}
                    </span>
                  </div>
                </div>

                {/* ══ CORPS ════════════════════════════════════════════ */}
                <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 0 }}>
                  <Row label="Réf"    value={formatRef(item.id)}         valueColor="#111111" />
                  <Row label="Date"   value={formatDate(item.createdAt)} valueColor="#333333" />
                  {item.description && (
                    <Row label="Détail" value={item.description}         valueColor="#333333" />
                  )}
                  {item.extra.paymentMethod && (
                    <Row label="Méthode" value={item.extra.paymentMethod} valueColor="#333333" />
                  )}
                </div>

                {/* ══ SÉPARATEUR PERFORÉ ═══════════════════════════════ */}
                <div style={{ position: "relative", margin: "0 0" }}>
                  <div style={{ borderTop: "2px dashed #cccccc" }} />
                  {/* demi-cercles */}
                  <div style={{
                    position: "absolute", left: -10, top: -10,
                    width: 20, height: 20, borderRadius: "50%",
                    background: "#ececec", border: "1px solid #cccccc",
                  }} />
                  <div style={{
                    position: "absolute", right: -10, top: -10,
                    width: 20, height: 20, borderRadius: "50%",
                    background: "#ececec", border: "1px solid #cccccc",
                  }} />
                </div>

                {/* ══ MONTANT ══════════════════════════════════════════ */}
                <div style={{ padding: "14px 16px 10px" }}>
                  {/* Total principal */}
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "#888888", fontSize: 10, letterSpacing: 2, textTransform: "uppercase" }}>
                      Montant total
                    </span>
                    <span style={{ color: amtColor, fontWeight: 900, fontSize: 22, letterSpacing: -0.5 }}>
                      {cat.sign}{amt.toLocaleString("fr-FR")} <span style={{ fontSize: 13 }}>FCFA</span>
                    </span>
                  </div>

                  {fees !== null && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                      <span style={{ color: "#888888", fontSize: 11 }}>Frais bancaires</span>
                      <span style={{ color: "#ff0000", fontWeight: 700, fontSize: 12 }}>−{fees.toLocaleString("fr-FR")} FCFA</span>
                    </div>
                  )}
                  {net !== null && fees !== null && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2, borderTop: "1px solid #e5e7eb", paddingTop: 4 }}>
                      <span style={{ color: "#333333", fontSize: 11, fontWeight: 700 }}>Net reçu</span>
                      <span style={{ color: "#00b300", fontWeight: 900, fontSize: 13 }}>{net.toLocaleString("fr-FR")} FCFA</span>
                    </div>
                  )}
                </div>

                {/* ══ PIED ═════════════════════════════════════════════ */}
                <div style={{ background: "#f7f7f7", borderTop: "1px solid #e5e7eb", padding: "6px 16px", textAlign: "center" }}>
                  <span style={{ color: "#bbbbbb", fontSize: 10, letterSpacing: 2 }}>
                    MERCI DE VOTRE CONFIANCE — ASUS
                  </span>
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
