import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getCountryByCode } from "@/lib/countries";
import { getContent } from "@/lib/content";
import { useI18n } from "@/lib/i18n";
import { ChevronLeft, Loader2, Gift } from "lucide-react";
import { Link } from "wouter";
import robotGift from "@assets/file_00000000168c7246a166e7a2da1eb7ba_1773319220043.png";
import landscapeImg from "@assets/portable-charger-power-banks_480x480_d6b67d82-6118-4295-be02-e_1784966597898.jpg";

interface BonusStatus {
  canClaim: boolean;
  hoursRemaining: number;
  totalBonusClaimed: number;
  daysPointed: number;
}

export default function CheckinPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();

  const { data: bonusStatus } = useQuery<BonusStatus>({
    queryKey: ["/api/daily-bonus-status"],
    refetchInterval: 60000,
  });

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const claimMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/claim-daily-bonus", {});
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || t.errorOccurred);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-bonus-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: t.checkinBonusTitle, description: t.checkinBonusDesc });
    },
    onError: (error: Error) => {
      toast({ title: error.message || t.errorOccurred, variant: "destructive" });
    },
  });

  if (!user) return null;

  const country = getCountryByCode(user.country);
  const currency = "FCFA";
  const totalBonusClaimed = bonusStatus?.totalBonusClaimed || 0;
  const daysPointed = bonusStatus?.daysPointed || 0;

  const headerTitle = getContent(settings, "content_checkin_headerTitle", t.checkinBtn);
  const cardTitle = getContent(settings, "content_checkin_cardTitle", t.checkinBtn);
  const cardSubtitle = getContent(settings, "content_checkin_cardSubtitle", "");
  const dailyRewardLabel = getContent(settings, "content_checkin_dailyRewardLabel", t.dailyRevenue);
  const streakLabel = getContent(settings, "content_checkin_streakLabel", t.myProductsDays);
  const totalLabel = getContent(settings, "content_checkin_totalLabel", t.salaryTotalRewards);
  const rule1 = getContent(settings, "content_checkin_rule1", "");
  const rule2 = getContent(settings, "content_checkin_rule2", "");

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#0d0d0d" }}>
      <div className="flex-1 overflow-y-auto pb-16">

        {/* Header */}
        <header className="flex items-center px-4 py-3 bg-white border-b border-gray-100">
          <Link href="/">
            <button className="p-1" data-testid="button-back">
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
          </Link>
          <h1 className="flex-1 text-center text-base font-semibold text-gray-800 pr-7">{headerTitle}</h1>
        </header>

        {/* Robot image — centered, overhangs the red card */}
        <div className="flex justify-center mt-6 mb-[-56px] relative z-10">
          <img
            src={robotGift}
            alt="Robot"
            className="w-36 h-36 object-contain drop-shadow-lg"
            style={{ mixBlendMode: "multiply" }}
          />
        </div>

        {/* Red card */}
        <div className="mx-4">
          <div className="bg-[#E8192C] rounded-3xl pt-16 pb-6 px-5 shadow-lg">
            <h2 className="text-white text-2xl font-bold text-center">{cardTitle}</h2>
            <p className="text-white/80 text-sm text-center mt-1 mb-5">
              {cardSubtitle}
            </p>

            {/* Two columns */}
            <div className="flex items-stretch gap-0">
              {/* Left col — daily reward */}
              <div className="flex-1 flex flex-col items-center gap-1 border-r border-white/30 pr-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-1">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <p className="text-white text-xl font-bold">{currency} 50</p>
                <p className="text-white/75 text-xs text-center">{dailyRewardLabel}</p>
              </div>

              {/* Right col — consecutive days */}
              <div className="flex-1 flex flex-col items-center gap-1 pl-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-1">
                  <span className="text-white font-bold text-base">$</span>
                </div>
                <p className="text-white text-xl font-bold">{daysPointed}</p>
                <p className="text-white/75 text-xs text-center">{streakLabel}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cumulated rewards card */}
        <div className="mx-4 mt-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-5 px-6 text-center">
            <p className="text-[#E8192C] text-2xl font-bold">{currency} {totalBonusClaimed}</p>
            <p className="text-gray-500 text-sm mt-1">{totalLabel}</p>
          </div>
        </div>

        {/* Pointer button */}
        <div className="mx-4 mt-5">
          {bonusStatus?.canClaim ? (
            <button
              onClick={() => claimMutation.mutate()}
              disabled={claimMutation.isPending}
              className="w-full py-4 rounded-full text-white font-bold text-lg shadow-md disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #E8192C, #E8192C)" }}
              data-testid="button-pointer"
            >
              {claimMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t.loading}
                </span>
              ) : (
                t.checkinBtn
              )}
            </button>
          ) : (
            <button
              disabled
              className="w-full py-4 rounded-full font-bold text-lg"
              style={{ background: "#e0e0e0", color: "#9e9e9e" }}
              data-testid="button-pointer-disabled"
            >
               {t.checkinComeBack.replace("{0}", String(bonusStatus?.hoursRemaining || 0))}
            </button>
          )}
        </div>

        {/* Rules */}
        <div className="mx-4 mt-5 space-y-1.5">
          <p className="text-white/60 text-xs">{rule1}</p>
          <p className="text-white/60 text-xs">{rule2}</p>
        </div>

      </div>
      <img src={landscapeImg} alt="ASUS" className="w-full object-cover object-top" style={{ maxHeight: 220 }} />
    </div>
  );
}
