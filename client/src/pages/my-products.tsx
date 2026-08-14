import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getCountryByCode } from "@/lib/countries";
import { Loader2, Wind, Lock, CheckCircle2, Settings } from "lucide-react";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

import bannerImg          from "@assets/xpeng-my-products-banner.jpg";
import productImgFallback from "@assets/vestas_112v_closeup_1783210181172.jpg";

const RED   = "#E8192C";
const BLACK = "#000000";

export default function MyProductsPage() {
  const { user, refreshUser } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();

  const { data: userProducts, isLoading } = useQuery<any[]>({
    queryKey: ["/api/user/products"],
  });

  /* collectAtEnd uniquement — collecte manuelle en fin de cycle */
  const collectFinalMutation = useMutation({
    mutationFn: async (userProductId: number) => {
      const res = await apiRequest("POST", `/api/user/collect-final/${userProductId}`, {});
      if (!res.ok) { const r = await res.json(); throw new Error(r.message || "Erreur"); }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/products"] });
      refreshUser();
      toast({ title: "✅ Gains collectés !", description: `${Number(data.collected).toLocaleString()} FCFA ajoutés à votre solde.` });
    },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
  };

  if (!user) return null;
  const country  = getCountryByCode(user.country);
  const currency = country?.currency || "FCFA";
  const allProducts = userProducts || [];

  /* Revenu journalier total des produits actifs */
  const totalDailyIncome = allProducts.reduce((sum: number, p: any) => {
    return (p.daysRemaining ?? 0) > 0 ? sum + Number(p.product?.dailyEarnings || 0) : sum;
  }, 0);

  const totalEarned = allProducts.reduce((sum: number, p: any) =>
    sum + parseFloat(p.totalEarned || "0"), 0);

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#f5f5f5" }}>
      <div className="flex-1 overflow-y-auto pb-20">

        {/* ══ BANNER ══ */}
        <div style={{ position: "relative", width: "100%", height: 190, overflow: "hidden" }}>
          <img src={bannerImg} alt="XPENG" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", top: 16, left: 16 }}>
            <img src="/xpeng-logo-white.svg" alt="XPENG" style={{ height: 22, filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))" }} />
          </div>
        </div>

        {/* ══ BARRE REVENU JOURNALIER ══ */}
        <div style={{ background: `linear-gradient(90deg, ${RED} 0%, #a01020 50%, ${BLACK} 100%)`, padding: "14px 16px 12px", textAlign: "center" }}>
          <p style={{ fontSize: 26, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
            {totalDailyIncome.toLocaleString()}
          </p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 5 }}>
            Le revenu journalier que mes équipements génèrent
          </p>
        </div>

        {/* ══ 2 CARTES STATS ══ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "12px 12px 0" }}>
          <div style={{ background: "linear-gradient(135deg, #0d1b3e 0%, #1a2f6e 100%)", borderRadius: 12, padding: "16px" }}>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginBottom: 8 }}>Nombre d'appareils</p>
            <p style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{allProducts.length}</p>
          </div>
          <div style={{ background: "linear-gradient(135deg, #1a0d3e 0%, #4a1a6e 100%)", borderRadius: 12, padding: "16px" }}>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginBottom: 8 }}>Mes revenus</p>
            <p style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>{currency} {totalEarned.toLocaleString()}</p>
          </div>
        </div>

        {/* ══ GRILLE PRODUITS — même format que la page Produits ══ */}
        <div style={{ padding: "12px 8px 0" }}>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: RED }} />
            </div>
          ) : allProducts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 rounded-2xl mx-2"
              style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <Settings className="w-12 h-12" style={{ color: "#ddd" }} />
              <p style={{ color: "#666", fontWeight: 600 }}>{t.myProductsNone}</p>
              <p style={{ color: "#aaa", fontSize: 13 }}>{t.myProductsNoneDesc}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {allProducts.map((up: any) => {
                const product       = up.product || {};
                const img           = product.imageUrl || productImgFallback;
                const cycleDays     = product.cycleDays || 60;
                const daysRemaining = up.daysRemaining ?? 0;
                const daysCompleted = Math.max(0, cycleDays - daysRemaining);
                const dailyEarnings = Number(product.dailyEarnings || 0);
                const totalReturn   = Number(product.totalReturn || 0);
                const price         = Number(product.price || 0);
                const earnedSoFar   = parseFloat(up.totalEarned || "0");
                const progress      = cycleDays > 0 ? Math.round((daysCompleted / cycleDays) * 100) : 0;
                const isCollectAtEnd = !!product.collectAtEnd;
                const cycleComplete  = daysRemaining <= 0;
                const canCollectFinal = isCollectAtEnd && cycleComplete && earnedSoFar > 0;

                return (
                  <div
                    key={up.id}
                    className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col"
                    data-testid={`product-card-${up.id}`}
                  >
                    {/* Nom */}
                    <div className="text-center pt-3 pb-1 px-2">
                      <p className="font-bold text-gray-800 text-sm truncate">{product.name}</p>
                    </div>

                    {/* Image */}
                    <div className="mx-3 my-2 rounded-xl overflow-hidden" style={{ height: 110 }}>
                      <img src={img} alt={product.name} className="w-full h-full object-cover" />
                    </div>

                    {/* Stats — même format que invest.tsx */}
                    <div className="px-3 pb-1 space-y-0.5">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-[11px]">{t.price}</span>
                        <span className="font-bold text-[11px]" style={{ color: RED }}>
                          {currency} {price.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-[11px]">{t.dailyRevenue}</span>
                        <span className="font-bold text-[11px]" style={{ color: RED }}>
                          {currency} {dailyEarnings.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-[11px]">{t.totalRevenue}</span>
                        <span className="font-bold text-[11px]" style={{ color: RED }}>
                          {currency} {totalReturn.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-[11px]">{t.period}</span>
                        <span className="font-bold text-[11px]" style={{ color: RED }}>
                          {cycleDays} {t.ordersDaysLbl}
                        </span>
                      </div>
                    </div>

                    {/* Barre de progression */}
                    <div className="px-3 pt-2 pb-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-400 text-[10px]">{daysCompleted}/{cycleDays}j</span>
                        <span className="text-[10px] font-bold" style={{ color: RED }}>{progress}%</span>
                      </div>
                      <div style={{ width: "100%", height: 5, borderRadius: 999, background: "#eee" }}>
                        <div style={{
                          height: 5, borderRadius: 999,
                          width: `${progress}%`,
                          background: `linear-gradient(90deg, ${RED}, #a01020)`,
                          transition: "width 0.4s",
                        }} />
                      </div>
                    </div>

                    {/* Bas de carte — statut ou bouton collecter */}
                    <div className="mt-auto px-3 pb-3 pt-2">
                      {canCollectFinal ? (
                        <button
                          onClick={() => collectFinalMutation.mutate(up.id)}
                          disabled={collectFinalMutation.isPending && collectFinalMutation.variables === up.id}
                          className="w-full py-2 rounded-lg text-white text-xs font-bold flex items-center justify-center gap-1 active:opacity-80 disabled:opacity-60"
                          style={{ background: `linear-gradient(90deg, ${RED}, #a01020)` }}
                          data-testid={`button-collect-final-${up.id}`}
                        >
                          {collectFinalMutation.isPending && collectFinalMutation.variables === up.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <><CheckCircle2 className="w-3 h-3" /> Collecter {currency} {earnedSoFar.toLocaleString()}</>}
                        </button>
                      ) : isCollectAtEnd && !cycleComplete ? (
                        <div className="w-full py-2 rounded-lg text-white text-xs font-semibold text-center flex items-center justify-center gap-1"
                          style={{ background: "#6b7280" }}>
                          <Lock className="w-3 h-3" /> Fin de cycle J+{cycleDays}
                        </div>
                      ) : (
                        /* Gains auto — affichage gains reçus */
                        <div className="text-center">
                          <p className="text-gray-800 font-black text-base">
                            {currency} {earnedSoFar.toLocaleString()}
                          </p>
                          <p className="text-gray-400 text-[10px]">Gains reçus automatiquement</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
