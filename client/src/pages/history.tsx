import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";

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
function generateOrderId(id: string, createdAt: string, prefix = "T") {
  const d = new Date(createdAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  const datePart = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `${prefix}${datePart}${String(id).padStart(6, "0")}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  completed:   { label: "Complété",    color: "#16a34a" },
  approved:    { label: "Réussi",      color: "#16a34a" },
  pending:     { label: "En attente",  color: "#f59e0b" },
  pending_2fa: { label: "2FA requis",  color: "#f59e0b" },
  processing:  { label: "En cours",   color: "#f59e0b" },
  rejected:    { label: "Refusé",     color: "#dc2626" },
  failed:      { label: "Échoué",     color: "#dc2626" },
};

const CATEGORY_META: Record<string, { label: string; sign: "+" | "-"; prefix: string }> = {
  deposit:     { label: "Dépôt",              sign: "+", prefix: "A" },
  withdrawal:  { label: "Retrait",            sign: "-", prefix: "R" },
  earning:     { label: "Gain produit",       sign: "+", prefix: "E" },
  commission:  { label: "Bonus parrainage",   sign: "+", prefix: "C" },
  bonus:       { label: "Bonus",              sign: "+", prefix: "B" },
  gift_code:   { label: "Code cadeau",        sign: "+", prefix: "G" },
  task_reward: { label: "Récompense tâche",   sign: "+", prefix: "T" },
  spin_reward: { label: "Récompense spin",    sign: "+", prefix: "S" },
};

function getCategoryMeta(category: string) {
  return CATEGORY_META[category] ?? { label: category, sign: "+" as const, prefix: "T" };
}

// ── Ligne de tableau ─────────────────────────────────────────────────────────
function Row({
  label,
  value,
  valueColor = "#555",
  bold = false,
  last = false,
}: {
  label: string;
  value: string;
  valueColor?: string;
  bold?: boolean;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "11px 0",
        borderBottom: last ? "none" : "1px solid #f0f0f0",
      }}
    >
      <span style={{ fontSize: 14, color: "#111", fontWeight: bold ? 700 : 400, flexShrink: 0 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: bold ? 15 : 13,
          color: valueColor,
          fontWeight: bold ? 700 : 400,
          textAlign: "right",
          maxWidth: "62%",
          wordBreak: "break-all",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Carte transaction ────────────────────────────────────────────────────────
function HistoryCard({ item }: { item: HistoryItem }) {
  const cat = getCategoryMeta(item.category);
  const st  = STATUS_MAP[item.status] ?? { label: item.status, color: "#6b7280" };
  const amt = parseFloat(item.amount);
  const fees = item.extra.fees ? parseFloat(item.extra.fees) : null;
  const amtColor = item.category === "withdrawal" ? "#dc2626" : "#16a34a";

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e0e0e0",
        borderRadius: 8,
        margin: "0 16px 14px",
        padding: "0 16px",
        overflow: "hidden",
      }}
    >
      <Row
        label="Montant du paiement"
        value={`${cat.sign}${amt.toLocaleString("fr-FR")} FCFA`}
        valueColor={amtColor}
        bold
      />
      <Row label="Commande" value={generateOrderId(item.id, item.createdAt, cat.prefix)} />
      <Row label="Canal" value={cat.label} />
      {item.extra.paymentMethod && (
        <Row label="Méthode" value={item.extra.paymentMethod} />
      )}
      {fees !== null && (
        <Row label="Frais" value={`${fees.toLocaleString("fr-FR")} FCFA`} valueColor="#dc2626" />
      )}
      <Row label="État" value={st.label} valueColor={st.color} />
      <Row label="Temps" value={formatDate(item.createdAt)} last />
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────
export default function HistoryPage() {
  const { data: items = [], isLoading } = useQuery<HistoryItem[]>({
    queryKey: ["/api/history/all"],
    staleTime: 0,
    refetchOnMount: true,
  });

  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column" }}>

      {/* ── Header ── */}
      <header style={{ background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "14px 16px 12px" }}>
          <Link href="/account">
            <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }} data-testid="button-back">
              <ChevronLeft size={24} color="#111" strokeWidth={2.5} />
            </button>
          </Link>
          <h1 style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 17, color: "#111", margin: 0, paddingRight: 32 }}>
            Historique
          </h1>
        </div>
        {/* Red separator line */}
        <div style={{ height: 2, background: "#E8192C", margin: "0 16px" }} />
      </header>

      {/* ── Liste ── */}
      <div style={{ flex: 1, paddingTop: 16 }}>
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
            <div style={{
              width: 24, height: 24, border: "2.5px solid #e0e0e0",
              borderTopColor: "#E8192C", borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : items.length === 0 ? (
          <p style={{ textAlign: "center", color: "#aaa", fontSize: 14, marginTop: 80 }}>
            No more data
          </p>
        ) : (
          <>
            {items.map((item) => (
              <HistoryCard key={item.id} item={item} />
            ))}
            <p style={{ textAlign: "center", color: "#aaa", fontSize: 13, margin: "8px 0 24px" }}>
              No more data
            </p>
          </>
        )}
      </div>
    </div>
  );
}
