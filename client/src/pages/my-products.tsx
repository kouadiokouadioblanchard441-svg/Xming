import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getCountryByCode } from "@/lib/countries";
import { Loader2, Wind, Lock, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

import bannerImg         from "@assets/xpeng-my-products-banner.jpg";
import productImgFallback from "@assets/vestas_112v_closeup_1783210181172.jpg";

/* ── Palette plateforme ───────────────────────── */
const RED   = "#E8192C";
const BLACK = "#000000";

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

  function canCollectDaily(up: any): boolean {
    if (!up.lastEarningDate) {
      const purchaseTime = up.purchasedAt ? new Date(up.purchasedAt).getTime() : 0;
      return Date.now() - purchaseTime >= 24 * 60 * 60 * 1000;
    }
    return Date.now() - new Date(up.lastEarningDate).getTime() >= 24 * 60 * 60 * 1000;
  }

  function nextCollectIn(up: any): string {
    const ref = up.lastEarningDate
      ? new Date(up.lastEarningDate).getTime()
      : (up.purchasedAt ? new Date(up.purchasedAt).getTime() : Date.now());
    const msLeft = Math.max(0, ref + 24 * 60 * 60 * 1000 - Date.now());
    const h = Math.floor(msLeft / 3600000);
    const m = Math.floor((msLeft % 3600000) / 60000);
    return `${String(h).padStart(2, "0")}h${String(m).padStart(2, "0")}`;
  }

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  };

  if (!user) return null;

  const country  = getCountryByCode(user.country);
  const currency = country?.currency || "FCFA";

  const allProducts = userProducts || [];

  /* Revenu journalier total (somme des dailyEarnings actifs) */
  const totalDailyIncome = allProducts.reduce((sum: number, p: any) => {
    if ((p.daysRemaining ?? 0) > 0) {
      return sum + Number(p.product?.dailyEarnings || 0);
    }
    return sum;
  }, 0);

  const totalEarned = allProducts.reduce((sum: number, p: any) => {
    return sum + parseFloat(p.totalEarned || "0");
  }, 0);

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#f5f5f5" }}>
      <div className="flex-1 overflow-y-auto pb-20">

        {/* ══ BANNER pleine largeur ══ */}
        <div style={{ position: "relative", width: "100%", height: 190, overflow: "hidden" }}>
          <img
            src={bannerImg}
            alt="XPENG"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          {/* Logo XPENG en overlay haut-gauche */}
          <div
            style={{
              position: "absolute",
              top: 16,
              left: 16,
            }}
          >
            <img src="/xpeng-logo-white.svg" alt="XPENG" style={{ height: 22, filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))" }} />
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", marginTop: 2, textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>
              Daily needs Redefined
            </p>
          </div>

        </div>

        {/* ══ BARRE REVENU JOURNALIER ══ */}
        <div
          style={{
            background: `linear-gradient(90deg, ${RED} 0%, #a01020 50%, ${BLACK} 100%)`,
            padding: "14px 16px 12px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 26, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
            {totalDailyIncome.toLocaleString()}
          </p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 5 }}>
            Le revenu journalier que mes équipements génèrent
          </p>
        </div>

        {/* ══ 2 CARTES STATS ══ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "12px 12px 0" }}>
          {/* Nombre d'appareils */}
          <div
            style={{
              background: `linear-gradient(135deg, #0d1b3e 0%, #1a2f6e 100%)`,
              borderRadius: 12,
              padding: "16px 16px",
            }}
          >
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginBottom: 8 }}>
              Nombre d'appareils
            </p>
            <p style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>
              {allProducts.length}
            </p>
          </div>

          {/* Mes revenus */}
          <div
            style={{
              background: `linear-gradient(135deg, #1a0d3e 0%, #4a1a6e 100%)`,
              borderRadius: 12,
              padding: "16px 16px",
            }}
          >
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginBottom: 8 }}>
              Mes revenus
            </p>
            <p style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>
              {currency} {totalEarned.toLocaleString()}
            </p>
          </div>
        </div>

        {/* ══ CARTES PRODUITS ══ */}
        <div style={{ padding: "12px 12px 0" }} className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: RED }} />
            </div>
          ) : allProducts.length === 0 ? (
            <div
              className="flex flex-col items-center gap-3 py-16 rounded-2xl"
              style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
            >
              <Wind className="w-12 h-12" style={{ color: "#ddd" }} />
              <p style={{ color: "#666", fontWeight: 600 }}>{t.myProductsNone}</p>
              <p style={{ color: "#aaa", fontSize: 13 }}>{t.myProductsNoneDesc}</p>
            </div>
          ) : (
            allProducts.map((up: any) => {
              const cycleDays      = up.product?.cycleDays || 60;
              const daysRemaining  = up.daysRemaining ?? 0;
              const daysCompleted  = Math.max(0, cycleDays - daysRemaining);
              const dailyEarnings  = Number(up.product?.dailyEarnings || 0);
              const earnedSoFar    = parseFloat(up.totalEarned || "0");
              const progress       = cycleDays > 0 ? Math.round((daysCompleted / cycleDays) * 100) : 0;

              const isCollectAtEnd  = !!up.product?.collectAtEnd;
              const cycleComplete   = daysRemaining <= 0;
              const canCollectFinal = isCollectAtEnd && cycleComplete && earnedSoFar > 0;
              const alreadyCollected = isCollectAtEnd && cycleComplete && earnedSoFar === 0;

              return (
                <div
                  key={up.id}
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    overflow: "hidden",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.10)",
                  }}
                  data-testid={`product-card-${up.id}`}
                >
                  {/* Header carte */}
                  <div
                    style={{
                      background: isCollectAtEnd
                        ? `linear-gradient(135deg, ${RED}, #a01020)`
                        : `linear-gradient(135deg, ${BLACK}, #333)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <p style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>
                        {up.product?.name || t.adminTabProducts}
                      </p>
                      {isCollectAtEnd && (
                        <span style={{
                          fontSize: 10, background: "rgba(255,255,255,0.2)", color: "#fff",
                          padding: "2px 8px", borderRadius: 999,
                          display: "flex", alignItems: "center", gap: 3,
                        }}>
                          <Lock style={{ width: 10, height: 10 }} /> Fin de cycle
                        </span>
                      )}
                    </div>
                    <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>
                      {formatDateTime(up.purchasedAt)}
                    </span>
                  </div>

                  {/* Contenu */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 14px 10px" }}>
                    <div style={{ width: 64, height: 64, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
                      <img
                        src={up.product?.imageUrl || productImgFallback}
                        alt={up.product?.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      {[
                        { label: t.myProductsDailyRevenue, value: `${currency} ${dailyEarnings.toLocaleString()}`, bold: true },
                        {
                          label: isCollectAtEnd ? "Gains accumulés" : t.myProductsEarned,
                          value: `${currency} ${earnedSoFar.toLocaleString()}`,
                          accent: isCollectAtEnd,
                        },
                        {
                          label: t.myProductsDuration,
                          value: `${daysCompleted}/${cycleDays} ${t.myProductsDays}`,
                        },
                      ].map((row, ri) => (
                        <div key={ri} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <span style={{ color: "#999", fontSize: 12 }}>{row.label}</span>
                          <span style={{
                            fontWeight: 700, fontSize: 13,
                            color: row.accent ? RED : "#111",
                          }}>
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Barre de progression */}
                  <div style={{ padding: "0 14px 12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ color: "#999", fontSize: 11 }}>{t.myProductsProgress}</span>
                      <span style={{ fontWeight: 700, fontSize: 11, color: "#111" }}>{progress}%</span>
                    </div>
                    <div style={{ width: "100%", height: 6, borderRadius: 999, background: "#eee" }}>
                      <div style={{
                        height: 6, borderRadius: 999,
                        width: `${progress}%`,
                        background: isCollectAtEnd
                          ? `linear-gradient(90deg, ${RED}, #a01020)`
                          : `linear-gradient(90deg, ${BLACK}, #555)`,
                        transition: "width 0.4s",
                      }} />
                    </div>
                  </div>

                  {/* Bouton bas */}
                  {canCollectFinal ? (
                    <button
                      onClick={() => collectFinalMutation.mutate(up.id)}
                      disabled={collectFinalMutation.isPending && collectFinalMutation.variables === up.id}
                      style={{
                        width: "100%", padding: "13px 0",
                        background: `linear-gradient(90deg, ${RED}, #a01020)`,
                        color: "#fff", fontWeight: 800, fontSize: 14,
                        border: "none", display: "flex", alignItems: "center",
                        justifyContent: "center", gap: 6, cursor: "pointer",
                      }}
                      className="active:opacity-80 transition-opacity disabled:opacity-60"
                      data-testid={`button-collect-final-${up.id}`}
                    >
                      {collectFinalMutation.isPending && collectFinalMutation.variables === up.id ? (
                        <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
                      ) : (
                        <><CheckCircle2 style={{ width: 16, height: 16 }} /> Collecter {currency} {earnedSoFar.toLocaleString()}</>
                      )}
                    </button>
                  ) : alreadyCollected ? (
                    <div style={{
                      padding: "10px 0", textAlign: "center", background: "#6b7280",
                      color: "#fff", fontSize: 12, fontWeight: 600,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}>
                      <CheckCircle2 style={{ width: 14, height: 14 }} /> Gains collectés
                    </div>
                  ) : isCollectAtEnd ? (
                    <div style={{
                      padding: "10px 0", textAlign: "center",
                      background: `linear-gradient(90deg, ${RED}, #a01020)`,
                      color: "#fff", fontSize: 12, fontWeight: 600,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}>
                      <Lock style={{ width: 12, height: 12 }} />
                      Disponible à J+{cycleDays} — encore {daysRemaining}j
                    </div>
                  ) : canCollectDaily(up) ? (
                    <button
                      onClick={() => collectDailyMutation.mutate()}
                      disabled={collectDailyMutation.isPending}
                      style={{
                        width: "100%", padding: "13px 0",
                        background: `linear-gradient(90deg, ${BLACK}, #333)`,
                        color: "#fff", fontWeight: 800, fontSize: 14,
                        border: "none", display: "flex", alignItems: "center",
                        justifyContent: "center", gap: 6, cursor: "pointer",
                      }}
                      className="active:opacity-80 transition-opacity disabled:opacity-60"
                      data-testid={`button-collect-daily-${up.id}`}
                    >
                      {collectDailyMutation.isPending ? (
                        <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
                      ) : (
                        <><CheckCircle2 style={{ width: 16, height: 16 }} /> Collecter {currency} {dailyEarnings.toLocaleString()}</>
                      )}
                    </button>
                  ) : (
                    <div style={{
                      padding: "10px 14px", textAlign: "center",
                      background: "#f5f5f5", color: "#666", fontSize: 12, fontWeight: 600,
                    }}>
                      {t.myProductsRevenueReceived} · Prochaine collecte dans {nextCollectIn(up)}
                    </div>
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
