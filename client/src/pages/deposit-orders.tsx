import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { getCountryByCode } from "@/lib/countries";
import { Skeleton } from "@/components/ui/skeleton";
import landscapeImg from "@assets/portable-charger-power-banks_480x480_d6b67d82-6118-4295-be02-e_1784966597898.jpg";
import { useI18n } from "@/lib/i18n";

interface Deposit {
  id: number;
  amount: string;
  status: string;
  paymentMethod?: string;
  createdAt: string;
}

// STATUS_CONFIG is built inside the component using i18n

function formatDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function DepositOrdersPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const countryInfo = user ? getCountryByCode(user.country) : null;
  const currency = "FCFA";

  const STATUS_CONFIG = {
    approved: { label: t.statusApproved, bg: "bg-gray-900",   text: "text-white" },
    pending:  { label: t.statusPending,  bg: "bg-green-500",  text: "text-white" },
    rejected: { label: t.statusRejected, bg: "bg-red-600",    text: "text-white" },
  } as Record<string, { label: string; bg: string; text: string }>;

  const { data: deposits = [], isLoading } = useQuery<Deposit[]>({
    queryKey: ["/api/deposits/history"],
  });

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#0d0d0d" }}>
      {/* Header */}
      <header className="flex items-center px-4 py-3 bg-white border-b border-gray-200">
        <Link href="/account">
          <button className="p-1 mr-2" data-testid="button-back">
            <ChevronLeft className="w-5 h-5 text-[#E8192C]" />
          </button>
        </Link>
        <h1 className="flex-1 text-center text-base font-bold text-gray-900 pr-8">
          {t.depositOrders}
        </h1>
      </header>

      <div className="p-4 space-y-3">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))
        ) : deposits.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">{t.noDeposits}</p>
          </div>
        ) : (
          deposits.map((d) => {
            const cfg = STATUS_CONFIG[d.status] || { label: d.status, bg: "bg-gray-500", text: "text-white" };
            return (
              <div key={d.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                {/* Red top bar */}
                <div className="h-3 rounded-t-2xl" style={{ backgroundColor: "#E8192C" }} />

                <div className="px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm">{t.amountLabel}</span>
                    <span className="text-[#E8192C] font-bold text-base">
                      {parseFloat(d.amount).toLocaleString()}
                    </span>
                  </div>

                  {d.paymentMethod && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">{t.methodLabel}</span>
                      <span className="text-gray-700 text-sm font-medium">{d.paymentMethod}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm">{t.statusLabel}</span>
                    <span className={`${cfg.bg} ${cfg.text} text-xs font-semibold px-4 py-1.5 rounded-full`}>
                      {cfg.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm">{t.dateLabel}</span>
                    <span className="text-gray-400 text-sm">{formatDate(d.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <img src={landscapeImg} alt="ASUS" className="w-full object-cover object-top" style={{ maxHeight: 220 }} />
    </div>
  );
}
