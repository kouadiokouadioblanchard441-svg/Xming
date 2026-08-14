import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getCountryByCode } from "@/lib/countries";
import { getContent } from "@/lib/content";
import { useI18n } from "@/lib/i18n";
import { ChevronLeft, Loader2, Trophy, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import type { Task } from "@shared/schema";
const poweraddLogo = "/poweradd/poweradd-logo-official.png";
import trophyImg from "@assets/piedestal-realiste-trophees-gobelets-metal-composition-rubans-_1785098538437.jpg";
import iconBronze from "@assets/344464_1773318022355.png";
import iconArgent from "@assets/817729_1773318022328.png";
import iconOr from "@assets/sac-argent-gros-tas-illustration-icone-argent-comptant-icone-p_1773318022388.jpg";
import iconPlatine from "@assets/1751761_1773318022264.png";
import iconDiamant from "@assets/3275655_1773318022415.png";

interface TaskWithStatus extends Task {
  isCompleted: boolean;
  canClaim: boolean;
  currentInvites: number;
}

const TIER_COLORS = [
  { bg: "from-red-700 to-red-500" },
  { bg: "from-gray-500 to-gray-400" },
  { bg: "from-red-600 to-red-400" },
  { bg: "from-cyan-600 to-cyan-400" },
  { bg: "from-red-700 to-red-500" },
  { bg: "from-purple-700 to-purple-500" },
];

const TIER_ICONS = [iconBronze, iconArgent, iconOr, iconPlatine, iconDiamant, iconBronze];

export default function TasksPage() {
  const { user, refreshUser } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();

  const { data: tasks, isLoading } = useQuery<TaskWithStatus[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const TIER_LABELS = [
    t.taskTierBronze,
    t.taskTierSilver,
    t.taskTierGold,
    t.taskTierPlatinum,
    t.taskTierDiamond,
    t.taskTierElite,
  ];

  const claimMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await apiRequest("POST", `/api/tasks/${taskId}/claim`, {});
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Error");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      refreshUser();
      toast({ title: t.tasksRewardClaimed, description: t.tasksRewardClaimedDesc });
    },
    onError: (error: any) => {
      toast({ title: error.message || t.errorOccurred, variant: "destructive" });
    },
  });

  if (!user) return null;

  const countryInfo = getCountryByCode(user.country);
  const currency = "FCFA";
  const totalTaskRewards = tasks?.filter(tk => tk.isCompleted).reduce((sum, tk) => sum + tk.reward, 0) || 0;
  const completedCount = tasks?.filter(tk => tk.isCompleted).length || 0;
  const claimableCount = tasks?.filter(tk => tk.canClaim && !tk.isCompleted).length || 0;

  const headerTitle = getContent(settings, "content_tasks_headerTitle", t.taskTierBronze ? t.team : "Programme de parrainage");
  const headerSubtitle = getContent(settings, "content_tasks_headerSubtitle", t.taskTierBronze ? t.salaryInviteDesc.replace("{0}", "") : "Invitez des amis et gagnez des récompenses");
  const tiersTitle = getContent(settings, "content_tasks_tiersTitle", t.taskTierBronze ? t.taskTierBronze.split(" ")[0] : "Niveaux de parrainage");
  const claimAllButton = getContent(settings, "content_tasks_claimAllButton", t.taskClaim);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#f5f7fb" }}>

      {/* Hero Section */}
      <div className="relative overflow-hidden" style={{ height: "260px" }}>
        <img
          src={trophyImg}
          alt={t.rewardsTitle}
          className="w-full h-full object-cover object-center"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.85) 100%)" }}
        />

        {/* Header nav */}
        <div className="absolute top-0 left-0 right-0 flex items-center px-4 pt-4">
          <Link href="/">
            <button
              className="w-9 h-9 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center"
              data-testid="button-back"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          </Link>
          <div className="flex-1 flex justify-center">
            <img src={poweraddLogo} alt="Power Add" className="h-8 object-contain" />
          </div>
          <div className="w-9" />
        </div>

        <div className="absolute left-4 right-4" style={{ bottom: "60px" }}>
          <h1 className="text-white font-bold text-xl leading-tight" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
            {headerTitle}
          </h1>
          <p className="text-white text-xs mt-1" style={{ opacity: 0.92, textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
            {headerSubtitle}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mx-4 -mt-10 z-10 relative">
        <div className="bg-white rounded-2xl shadow-lg p-3 flex items-center justify-between">
          <div className="flex-1 text-center border-r border-gray-100">
            <p className="text-[#E8320A] text-lg font-bold" data-testid="text-total-rewards">
              {totalTaskRewards.toLocaleString()}
            </p>
            <p className="text-gray-500 text-[11px] mt-0.5">{t.taskEarned} ({currency})</p>
          </div>
          <div className="flex-1 text-center border-r border-gray-100">
            <p className="text-[#E8320A] text-lg font-bold">{completedCount}</p>
            <p className="text-gray-500 text-[11px] mt-0.5">{t.taskCompleted}</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-[#E8320A] text-lg font-bold">{claimableCount}</p>
            <p className="text-gray-500 text-[11px] mt-0.5">{t.taskClaimable}</p>
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="mx-4 mt-4 mb-16">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#E8320A]" />
            <h2 className="text-gray-800 font-bold text-sm">{tiersTitle}</h2>
          </div>
          {claimableCount > 0 && (
            <button
              onClick={async () => {
                const claimable = tasks?.filter(tk => tk.canClaim && !tk.isCompleted) || [];
                for (const task of claimable) {
                  try { await claimMutation.mutateAsync(task.id); } catch {}
                }
              }}
              disabled={claimMutation.isPending}
              className="text-xs text-[#E8320A] font-semibold bg-red-50 px-3 py-1.5 rounded-full"
              data-testid="button-claim-rewards"
            >
              {claimAllButton} ({claimableCount})
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : tasks && tasks.length > 0 ? (
          <div className="space-y-2">
            {tasks.map((task, index) => {
              const tier = TIER_COLORS[index] || TIER_COLORS[0];
              const label = TIER_LABELS[index] || `${t.tasksTierFallback} ${index + 1}`;
              const icon = TIER_ICONS[index] || TIER_ICONS[0];
              const progress = Math.min(
                (task.currentInvites / Math.max(task.requiredInvites, 1)) * 100,
                100,
              );
              const progressComplete = task.currentInvites >= task.requiredInvites;

              return (
                <div
                  key={task.id}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-row"
                  data-testid={`task-item-${task.id}`}
                >
                  {/* Icon area — same width as product image */}
                  <div className={`shrink-0 w-20 flex items-center justify-center bg-gradient-to-br ${tier.bg}`} style={{ minHeight: 90 }}>
                    <img src={icon} alt={label} className="w-12 h-12 object-contain drop-shadow" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 px-3 py-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white bg-gradient-to-r ${tier.bg}`}>
                          {label}
                        </span>
                        {task.isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-gray-800" />}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-xs">{t.taskInviteDesc.replace("{0}", String(task.requiredInvites))}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-xs">{t.taskEarned}</span>
                          <span className="font-bold text-xs text-[#E8192C]">+{task.reward.toLocaleString()} {currency}</span>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${progressComplete ? "bg-green-500" : "bg-[#E8192C]"}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-gray-400 text-[10px] shrink-0">{task.currentInvites}/{task.requiredInvites}</span>
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="mt-2">
                      {task.isCompleted ? (
                        <span className="bg-red-50 text-[#E8192C] text-[10px] font-semibold px-3 py-1 rounded-lg block text-center">
                          {t.taskDone}
                        </span>
                      ) : task.canClaim ? (
                        <button
                          onClick={() => !claimMutation.isPending && claimMutation.mutate(task.id)}
                          disabled={claimMutation.isPending}
                          className="w-full bg-[#E8192C] text-white text-xs font-bold py-1.5 rounded-lg active:scale-95 transition-transform shadow-sm flex items-center justify-center gap-1"
                          data-testid={`button-claim-${task.id}`}
                        >
                          {claimMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : t.taskClaim}
                        </button>
                      ) : (
                        <span className="bg-gray-100 text-gray-400 text-[10px] font-semibold px-3 py-1 rounded-lg block text-center">
                          {t.taskWaiting}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-white/40 mx-auto mb-3" />
            <p className="text-white/70">{t.taskNone}</p>
          </div>
        )}
      </div>
    </div>
  );
}
