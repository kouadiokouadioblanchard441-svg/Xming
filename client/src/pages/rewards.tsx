import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, HelpCircle, Users } from "lucide-react";
import { getCountryByCode } from "@/lib/countries";
import { useI18n } from "@/lib/i18n";

import globeImg from "@/assets/images/elf-station-2.jpeg";
import landscapeImg from "@assets/portable-charger-power-banks_480x480_d6b67d82-6118-4295-be02-e_1784966597898.jpg";

export default function RewardsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: tasks, isLoading } = useQuery<any[]>({
    queryKey: ["/api/tasks"],
  });

  const claimMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const res = await apiRequest("POST", `/api/tasks/${taskId}/claim`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || t.errorOccurred);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: t.rewardsSuccessTitle,
        description: t.rewardsSuccessDesc,
      });
    },
    onError: (error: Error) => {
      toast({
        title: t.errorOccurred,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!user) return null;

  const country = getCountryByCode(user.country);
  const currency = "FCFA";

  const totalReward = tasks?.reduce((sum, t) => sum + t.reward, 0) || 0;
  const claimedReward = tasks?.filter(t => t.isCompleted).reduce((sum: number, t: any) => sum + t.reward, 0) || 0;
  const currentInvites = tasks?.[0]?.currentInvites || 0;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#000000" }}>
      <div className="flex-1 overflow-y-auto pb-16">

        <div className="relative px-4 pt-4 pb-6" style={{ background: "#000000" }}>
          <button onClick={() => navigate("/account")} className="mb-3" data-testid="button-back">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 mb-4">{t.rewardsTitle}</h1>

          <div className="relative rounded-2xl overflow-hidden" style={{ backgroundColor: "#1a1a1a" }}>
            <img src={globeImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
            <div className="relative z-10 flex items-center justify-between px-5 py-5">
              <div>
                <p className="text-white/80 text-sm">{currency}</p>
                <p className="text-white text-3xl font-black" data-testid="text-claimed-reward">{claimedReward.toLocaleString()}</p>
                <p className="text-white/70 text-xs mt-1">
                  {t.rewardsSubtitle.replace("{0}", totalReward.toLocaleString()).replace("{1}", currency)}
                </p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <HelpCircle className="w-6 h-6 text-white/60" />
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 mt-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#ffffff" }} />
            <h2 className="text-base font-bold text-white">{t.rewardsTaskList}</h2>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-xl p-6 text-center text-gray-400 text-sm">
              {t.loading}
            </div>
          ) : (
            <div className="space-y-1.5">
              {tasks?.map((task) => (
                <div
                  key={task.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-100 flex items-center px-2.5 py-2 gap-2"
                  data-testid={`task-item-${task.id}`}
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#2a2a2a" }}>
                    <Users className="w-3 h-3" style={{ color: "#2196F3" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-gray-800 leading-tight truncate">{task.description}</p>
                    <p className="text-[10px] text-gray-400 leading-tight">{t.rewardsRewardLabel}: <span className="text-blue-500 font-semibold">{task.reward.toLocaleString()} {currency}</span></p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-gray-400">{task.currentInvites}/{task.requiredInvites}</span>
                    {task.isCompleted ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-50 text-gray-600" data-testid={`task-completed-${task.id}`}>
                        {t.rewardsClaimed}
                      </span>
                    ) : task.canClaim ? (
                      <button
                        onClick={() => claimMutation.mutate(task.id)}
                        disabled={claimMutation.isPending}
                        className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: "#2196F3" }}
                        data-testid={`button-claim-${task.id}`}
                      >
                        {t.rewardsClaim}
                      </button>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400" data-testid={`task-locked-${task.id}`}>
                        {t.rewardsReceived}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
      <img src={landscapeImg} alt="XPENG" className="w-full object-cover object-top" style={{ maxHeight: 220 }} />
    </div>
  );
}
