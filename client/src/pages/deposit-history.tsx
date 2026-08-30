import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";

interface Deposit {
  id: number;
  amount: string;
  status: string;
  paymentMethod?: string | null;
  createdAt: string;
}

function generateOrderId(id: number, createdAt: string) {
  const d = new Date(createdAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  const datePart = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `A${datePart}${String(id).padStart(6, "0")}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  approved:   { label: "Paiement réussi",   color: "#16a34a" },
  pending:    { label: "Paiement en cours", color: "#f59e0b" },
  processing: { label: "Paiement en cours", color: "#f59e0b" },
  rejected:   { label: "Paiement refusé",  color: "#dc2626" },
};

/* ── Ligne de tableau ─────────────────────────────────────────────── */
function Row({
  label,
  value,
  valueColor = "#555",
  bold = false,
}: {
  label: string;
  value: string;
  valueColor?: string;
  bold?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "11px 0",
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      <span style={{ fontSize: 14, color: "#111", fontWeight: bold ? 700 : 400 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: bold ? 15 : 13,
          color: valueColor,
          fontWeight: bold ? 700 : 400,
          textAlign: "right",
          maxWidth: "60%",
          wordBreak: "break-all",
        }}
      >
        {value}
      </span>
    </div>
  );
}

/* ── Carte dépôt ──────────────────────────────────────────────────── */
function DepositCard({ dep }: { dep: Deposit }) {
  const st = STATUS_MAP[dep.status] ?? { label: dep.status, color: "#6b7280" };
  const amt = parseFloat(dep.amount);
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
      <div style={{ borderBottom: "none" }}>
        <Row label="Montant du paiement" value={`FCFA ${amt.toLocaleString("fr-FR")}`} valueColor="#111" bold />
        <Row label="Commande" value={generateOrderId(dep.id, dep.createdAt)} />
        <Row label="Canal" value={dep.paymentMethod || "Mobile Money"} />
        <Row label="État" value={st.label} valueColor={st.color} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "11px 0",
          }}
        >
          <span style={{ fontSize: 14, color: "#111" }}>Temps</span>
          <span style={{ fontSize: 13, color: "#555" }}>{formatDate(dep.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Page principale ─────────────────────────────────────────────── */
export default function DepositHistoryPage() {
  const { data: deposits = [], isLoading } = useQuery<Deposit[]>({
    queryKey: ["/api/deposits/history"],
  });

  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column" }}>

      {/* ── Header ── */}
      <header style={{ background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "14px 16px 12px" }}>
          <Link href="/deposit">
            <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }} data-testid="button-back">
              <ChevronLeft size={24} color="#111" strokeWidth={2.5} />
            </button>
          </Link>
          <h1 style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 17, color: "#111", margin: 0, paddingRight: 32 }}>
            Registres de paiement
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
        ) : deposits.length === 0 ? (
          <p style={{ textAlign: "center", color: "#aaa", fontSize: 14, marginTop: 80 }}>
            No more data
          </p>
        ) : (
          <>
            {deposits.map((dep) => (
              <DepositCard key={dep.id} dep={dep} />
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
