import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { getCountryByCode } from "@/lib/countries";
import { Skeleton } from "@/components/ui/skeleton";
import landscapeImg from "@assets/portable-charger-power-banks_480x480_d6b67d82-6118-4295-be02-e_1784966597898.jpg";
import { useI18n } from "@/lib/i18n";

interface Withdrawal {
  id: number;
  userId: number;
  amount: string;
  status: string;
  createdAt: string;
}

export default function DepositHistoryPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const countryInfo = user ? getCountryByCode(user.country) : null;
  const currency = "FCFA";

  const { data: withdrawals = [], isLoading } = useQuery<Withdrawal[]>({
    queryKey: ["/api/withdrawals/history"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-gray-600 bg-green-100";
      case "pending":
        return "text-gray-600 bg-green-100";
      case "rejected":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved": return t.statusApproved;
      case "pending":  return t.statusPending;
      case "rejected": return t.statusRejected;
      default:         return status;
    }
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#0d0d0d" }}>
      <header className="flex items-center px-4 py-3 border-b bg-white">
        <Link href="/deposit">
          <button className="p-2" data-testid="button-back">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
        </Link>
        <h1 className="flex-1 text-center text-lg font-semibold text-gray-800 pr-8">{t.withdrawalHistory}</h1>
      </header>

      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/70">{t.noWithdrawals}</p>
          </div>
        ) : (
          withdrawals.map((withdrawal) => {
            const date = new Date(withdrawal.createdAt);
            return (
              <div
                key={withdrawal.id}
                className="bg-white rounded-lg p-4 border"
                data-testid={`withdrawal-item-${withdrawal.id}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {parseFloat(withdrawal.amount).toLocaleString()} {currency}
                    </p>
                    <p className="text-sm text-gray-500">
                      {date.toLocaleDateString()} {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(withdrawal.status)}`}>
                    {getStatusText(withdrawal.status)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
      <img src={landscapeImg} alt="XPENG" className="w-full object-cover object-top" style={{ maxHeight: 220 }} />
    </div>
  );
}
