import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";

interface Withdrawal {
  id: number;
  amount: string;
  netAmount?: string | null;
  fees?: string | null;
  status: string;
  paymentMethod?: string | null;
  accountNumber?: string | null;
  createdAt: string;
}

function generateOrderId(id: number, createdAt: string) {
  const d = new Date(createdAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  const datePart = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `R${datePart}${String(id).padStart(6, "0")}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  approved:    { label: "Retrait réussi",   color: "#16a34a" },
  pending:     { label: "En attente",       color: "#f59e0b" },
  pending_2fa: { label: "2FA requis",       color: "#f59e0b" },
  processing:  { label: "En cours",        color: "#f59e0b" },
  rejected:    { label: "Retrait refusé",  color: "#dc2626" },
  failed:      { label: "Échoué",          color: "#dc2626" },
};

/* ── Ligne de tableau ─────────────────────────────────────────────── */
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

/* ── Carte retrait ────────────────────────────────────────────────── */
function WithdrawalCard({ w }: { w: Withdrawal }) {
  const st = STATUS_MAP[w.status] ?? { label: w.status, color: "#6b7280" };
  const amt = parseFloat(w.amount);
  const fees = w.fees ? parseFloat(w.fees) : null;

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
      <Row label="Montant du retrait" value={`FCFA ${amt.toLocaleString("fr-FR")}`} valueColor="#111" bold />
      <Row label="Commande" value={generateOrderId(w.id, w.createdAt)} />
      <Row label="Canal" value={w.paymentMethod || "Mobile Money"} />
      {fees !== null && (
        <Row label="Frais" value={`FCFA ${fees.toLocaleString("fr-FR")}`} valueColor="#dc2626" />
      )}
      <Row label="État" value={st.label} valueColor={st.color} />
      <Row label="Temps" value={formatDate(w.createdAt)} last />
    </div>
  );
}

/* ── Page principale ─────────────────────────────────────────────── */
export default function WithdrawalHistoryPage() {
  const { data: withdrawals = [], isLoading } = useQuery<Withdrawal[]>({
    queryKey: ["/api/withdrawals/history"],
  });

  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column" }}>

      {/* ── Header ── */}
      <header style={{ background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "14px 16px 12px" }}>
          <Link href="/withdrawal">
            <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }} data-testid="button-back">
              <ChevronLeft size={24} color="#111" strokeWidth={2.5} />
            </button>
          </Link>
          <h1 style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 17, color: "#111", margin: 0, paddingRight: 32 }}>
            Registres de retrait
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
        ) : withdrawals.length === 0 ? (
          <p style={{ textAlign: "center", color: "#aaa", fontSize: 14, marginTop: 80 }}>
            No more data
          </p>
        ) : (
          <>
            {withdrawals.map((w) => (
              <WithdrawalCard key={w.id} w={w} />
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
