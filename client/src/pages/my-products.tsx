import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getCountryByCode } from "@/lib/countries";
import { ChevronLeft, Loader2, Wind, Lock, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

import productImgFallback from "@assets/vestas_112v_closeup_1783210181172.jpg";

export default function MyProductsPage() {
  const { user, refreshUser } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();

  const { data: userProducts, isLoading } = useQuery<any[]>({
    queryKey: ["/api/user/products"],
  });

  const collectFinalMutation = useMutation({
    mutationFn: async (userProductId: number) => {
      const res = await apiRequest("POST", `/api/user/collect-final/${userProductId}`, {});
      if (!res.ok) { const r = await res.json(); throw new Error(r.message || "Erreur"); }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/products"] });
      refreshUser();
      toast({
        title: "✅ Gains collectés !",
        description: `${Number(data.collected).toLocaleString()} FCFA ajoutés à votre solde.`,
      });
    },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const collectDailyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/user/collect-earnings", {});
      if (!res.ok) { const r = await res.json(); throw new Error(r.message || "Erreur"); }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/products"] });
      refreshUser();
      if (data.collected > 0) {
        toast({
          title: "✅ Gains collectés !",
          description: `${Number(data.collected).toLocaleString()} FCFA ajoutés à votre solde.`,
        });
      } else {
        toast({ title: "Aucun gain disponible pour le moment." });
      }
    },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  // Vérifie si 24h se sont écoulées depuis la dernière collecte
  function canCollectDaily(up: any): boolean {
    if (!up.lastEarningDate) {
      // Jamais collecté : disponible 24h après l'achat
      const purchaseTime = up.purchasedAt ? new Date(up.purchasedAt).getTime() : 0;
      return Date.now() - purchaseTime >= 24 * 60 * 60 * 1000;
    }
    return Date.now() - new Date(up.lastEarningDate).getTime() >= 24 * 60 * 60 * 1000;
  }

  // Temps restant avant prochaine collecte (en hh:mm)
  function nextCollectIn(up: any): string {
    const ref = up.lastEarningDate
      ? new Date(up.lastEarningDate).getTime()
      : (up.purchasedAt ? new Date(up.purchasedAt).getTime() : Date.now());
    const msLeft = Math.max(0, ref + 24 * 60 * 60 * 1000 - Date.now());
    const h = Math.floor(msLeft / 3600000);
    const m = Math.floor((msLeft % 3600000) / 60000);
    return `${String(h).padStart(2, "0")}h${String(m).padStart(2, "0")}`;
  }

  if (!user) return null;

  const currency = "FCFA";

  const allProducts = userProducts || [];

  const totalEarned = allProducts.reduce((sum: number, p: any) => {
    return sum + parseFloat(p.totalEarned || "0");
  }, 0);

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#000000" }}>
      <div className="flex-1 overflow-y-auto pb-16">

        {/* Header */}
        <div className="flex items-center px-3 pt-4 pb-3">
          <Link href="/account">
            <button className="p-2 bg-white/20 rounded-full backdrop-blur-sm" data-testid="button-back">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          </Link>
          <p className="text-white text-xl font-black tracking-tight ml-3 flex-1">{t.myProductsTitle}</p>
          <Link href="/expired-products">
            <button
              className="px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: "rgba(220,38,38,0.85)", color: "white" }}
            >
              Expirés
            </button>
          </Link>
        </div>

        {/* Stats cards */}
        <div className="mx-3 mt-3 rounded-2xl shadow-md overflow-hidden relative" style={{ background: "#000000" }}>
          <div className="grid grid-cols-2 divide-x divide-white/20">
            <div className="px-4 py-4">
              <p className="text-white/80 text-xs mb-1">{t.myProductsDevice}</p>
              <p className="text-white font-black text-2xl">{allProducts.length}</p>
            </div>
            <div className="px-4 py-4">
              <p className="text-white/80 text-xs mb-1">{t.myProductsEarnings}</p>
              <p className="text-white font-black text-lg leading-tight">
                {currency} {totalEarned.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Product cards */}
        <div className="px-3 mt-3 space-y-3">
          {isLoading ? null : allProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm flex flex-col items-center gap-3">
              <Wind className="w-12 h-12 text-gray-200" />
              <p className="text-gray-500 font-medium">{t.myProductsNone}</p>
              <p className="text-gray-400 text-sm">{t.myProductsNoneDesc}</p>
            </div>
          ) : (
            allProducts.map((up: any) => {
              const cycleDays = up.product?.cycleDays || 60;
              const daysRemaining = up.daysRemaining ?? 0;
              const daysCompleted = Math.max(0, cycleDays - daysRemaining);
              const dailyEarnings = Number(up.product?.dailyEarnings || 0);
              const earnedSoFar = parseFloat(up.totalEarned || "0");
              const progress = cycleDays > 0 ? Math.round((daysCompleted / cycleDays) * 100) : 0;

              const isCollectAtEnd = !!up.product?.collectAtEnd;
              const cycleComplete = daysRemaining <= 0;
              // Can collect if collectAtEnd mode AND cycle finished AND gains not yet collected
              const canCollectFinal = isCollectAtEnd && cycleComplete && earnedSoFar > 0;
              const alreadyCollected = isCollectAtEnd && cycleComplete && earnedSoFar === 0;

              return (
                <div
                  key={up.id}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden"
                  data-testid={`product-card-${up.id}`}
                >
                  {/* Top header */}
                  <div
                    className="flex items-center justify-between px-4 py-2.5"
                    style={{
                      background: isCollectAtEnd
                        ? "linear-gradient(135deg, #d97706, #92400e)"
                        : "linear-gradient(135deg, #d4a017, #a07010)"
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-white font-bold text-sm">{up.product?.name || t.adminTabProducts}</p>
                      {isCollectAtEnd && (
                        <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded-full flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Fin de cycle
                        </span>
                      )}
                    </div>
                    <span className="text-white/70 text-xs">{formatDateTime(up.purchasedAt)}</span>
                  </div>

                  {/* Content */}
                  <div className="flex items-center gap-3 p-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                      <img
                        src={up.product?.imageUrl || productImgFallback}
                        alt={up.product?.name || t.adminTabProducts}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-xs">{t.myProductsDailyRevenue}</span>
                        <span className="font-bold text-sm text-gray-900">
                          {currency} {dailyEarnings.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-xs">
                          {isCollectAtEnd ? "Gains accumulés" : t.myProductsEarned}
                        </span>
                        <span className="font-bold text-sm" style={{ color: isCollectAtEnd ? "#d97706" : "#111" }}>
                          {currency} {earnedSoFar.toLocaleString()}
                          {isCollectAtEnd && !cycleComplete && (
                            <span className="text-[10px] text-gray-400 font-normal ml-1">(bloqués)</span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-xs">{t.myProductsDuration}</span>
                        <span className="font-bold text-xs text-gray-700">
                          {daysCompleted}/{cycleDays} {t.myProductsDays}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="px-4 pb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-400 text-xs">{t.myProductsProgress}</span>
                      <span className="text-xs font-bold text-gray-900">{progress}%</span>
                    </div>
                    <div className="w-full rounded-full h-2" style={{ background: "#e5e5e5" }}>
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${progress}%`,
                          background: isCollectAtEnd ? "#d97706" : "#00A651",
                        }}
                      />
                    </div>
                  </div>

                  {/* Bottom bar */}
                  {canCollectFinal ? (
                    /* 🔓 Cycle terminé — bouton collecter */
                    <button
                      onClick={() => collectFinalMutation.mutate(up.id)}
                      disabled={collectFinalMutation.isPending && collectFinalMutation.variables === up.id}
                      className="w-full py-3 text-white font-extrabold text-sm tracking-wide flex items-center justify-center gap-2 active:opacity-80 transition-opacity disabled:opacity-60"
                      style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
                      data-testid={`button-collect-final-${up.id}`}
                    >
                      {collectFinalMutation.isPending && collectFinalMutation.variables === up.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Collecter {currency} {earnedSoFar.toLocaleString()}
                        </>
                      )}
                    </button>
                  ) : alreadyCollected ? (
                    /* Déjà collecté */
                    <div
                      className="px-4 py-2.5 text-center text-white text-xs font-semibold flex items-center justify-center gap-1.5"
                      style={{ background: "#6b7280" }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Gains collectés
                    </div>
                  ) : isCollectAtEnd ? (
                    /* En cours — collecte bloquée */
                    <div
                      className="px-4 py-2.5 text-center text-white text-xs font-semibold flex items-center justify-center gap-1.5"
                      style={{ background: "linear-gradient(135deg, #d97706, #92400e)" }}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Disponible à J+{cycleDays} — encore {daysRemaining}j
                    </div>
                  ) : (
                    /* Produit classique — collecte manuelle toutes les 24h */
                    canCollectDaily(up) ? (
                      <button
                        onClick={() => collectDailyMutation.mutate()}
                        disabled={collectDailyMutation.isPending}
                        className="w-full py-3 text-white font-extrabold text-sm tracking-wide flex items-center justify-center gap-2 active:opacity-80 transition-opacity disabled:opacity-60"
                        style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
                        data-testid={`button-collect-daily-${up.id}`}
                      >
                        {collectDailyMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Collecter {currency} {Number(up.product?.dailyEarnings || 0).toLocaleString()}
                          </>
                        )}
                      </button>
                    ) : (
                      <div
                        className="px-4 py-2.5 text-center text-white text-xs font-semibold"
                        style={{ background: "linear-gradient(135deg, #d4a017, #a07010)" }}
                      >
                        {t.myProductsRevenueReceived} : {currency} {earnedSoFar.toLocaleString()}
                      </div>
                    )
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
