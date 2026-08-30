import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { getCountryByCode } from "@/lib/countries";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";

interface Deposit {
  id: number;
  amount: string;
  status: string;
  createdAt: string;
}

function generateTxId(id: number, createdAt: string) {
  const d = new Date(createdAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  const datePart = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  const hexPart = (id * 0x9e3779b9 + 0xdeadbeef).toString(16).toUpperCase().padStart(8, "0").slice(0, 8);
  return `T${datePart}${hexPart}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function DepositHistoryRealPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const countryInfo = user ? getCountryByCode(user.country) : null;
  const currency = "FCFA";

  const STATUS = {
    approved: { label: t.statusApproved, color: "#16a34a" },
    pending:  { label: t.statusPending,  color: "#f59e0b" },
    rejected: { label: t.statusRejected, color: "#dc2626" },
  } as Record<string, { label: string; color: string }>;

  const { data: deposits = [], isLoading } = useQuery<Deposit[]>({
    queryKey: ["/api/deposits/history"],
  });

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center px-4 py-3 bg-white border-b border-gray-200">
        <Link href="/deposit">
          <button className="p-1 mr-2" data-testid="button-back">
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
        </Link>
        <h1 className="flex-1 text-center text-sm font-bold text-gray-900 pr-8 tracking-wide uppercase">
          {t.depositHistory}
        </h1>
      </header>

      <div className="flex-1">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : deposits.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-sm">{t.noDeposits}</p>
          </div>
        ) : (
          <div className="bg-white">
            {deposits.map((dep) => {
              const st = STATUS[dep.status] || { label: dep.status.toUpperCase(), color: "#6b7280" };
              const txId = generateTxId(dep.id, dep.createdAt);
              const amountNum = parseFloat(dep.amount);

              return (
                <div
                  key={dep.id}
                  className="px-4 py-4"
                  style={{ borderBottom: "1px solid #f0f0f0" }}
                >
                  <p className="text-gray-400 text-xs mb-1 font-mono">{txId}</p>

                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-sm" style={{ color: "#16a34a" }}>
                        {t.depositLabel} {currency} {amountNum.toLocaleString()}
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5">{formatDate(dep.createdAt)}</p>
                    </div>
                    <span className="font-bold text-sm ml-4 shrink-0" style={{ color: st.color }}>
                      {st.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
