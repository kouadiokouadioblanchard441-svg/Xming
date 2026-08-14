import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";

interface Withdrawal {
  id: number;
  amount: string;
  netAmount?: string;
  fees?: string;
  status: string;
  createdAt: string;
  paymentMethod?: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  approved:    { label: "Arrivé",      color: "#00cc00" },
  pending:     { label: "En attente",  color: "#d97706" },
  pending_2fa: { label: "2FA requis",  color: "#d97706" },
  processing:  { label: "En cours",   color: "#2563eb" },
  rejected:    { label: "Rejeté",     color: "#ff0000" },
  failed:      { label: "Échoué",     color: "#ff0000" },
};

export default function WithdrawalHistoryPage() {
  const { t } = useI18n();
  const currency = "FCFA";

  const { data: withdrawals = [], isLoading } = useQuery<Withdrawal[]>({
    queryKey: ["/api/withdrawals/history"],
  });

  return (
    <div className="flex flex-col min-h-screen bg-white">

      {/* ── Header ── */}
      <header className="flex items-center px-4 py-4 bg-white">
        <Link href="/withdrawal">
          <button className="p-1" data-testid="button-back">
            <ChevronLeft className="w-6 h-6 text-gray-800" strokeWidth={2.5} />
          </button>
        </Link>
        <h1
          className="flex-1 text-center font-bold text-gray-900 pr-8"
          style={{ fontSize: 20, fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          Retirer
        </h1>
      </header>

      {/* ── Content ── */}
      <div className="flex-1">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-sm">{t.noWithdrawals}</p>
          </div>
        ) : (
          withdrawals.map((w, idx) => {
            const st = STATUS_MAP[w.status] || { label: w.status, color: "#6b7280" };
            const amountNum = parseFloat(w.amount);
            const feesNum   = w.fees ? parseFloat(w.fees) : null;

            return (
              <div
                key={w.id}
                className="px-5 py-5"
                style={{
                  borderTop: idx === 0 ? "1px solid #e5e7eb" : undefined,
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                {/* Row 1 : date + statut */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="text-gray-900"
                    style={{ fontSize: 15, fontFamily: "monospace" }}
                  >
                    {formatDate(w.createdAt)}
                  </span>

                  {/* Badge pill */}
                  <span
                    className="px-4 py-1 rounded-full text-sm font-semibold"
                    style={{
                      border: `1.5px solid ${st.color}`,
                      color: st.color,
                      background: "transparent",
                    }}
                  >
                    {st.label}
                  </span>
                </div>

                {/* Row 2 : Withdraw amount */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Withdraw amount :</span>
                  <span className="font-bold text-gray-900 text-sm">
                    {currency} {amountNum.toLocaleString()}
                  </span>
                </div>

                {/* Row 3 : Frais */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Frais :</span>
                  <span className="font-bold text-gray-900 text-sm">
                    {feesNum !== null
                      ? `${currency} ${feesNum.toLocaleString()}`
                      : "—"}
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
