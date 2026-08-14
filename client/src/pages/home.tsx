import { useAuth } from "@/lib/auth";
import { SiTelegram } from "react-icons/si";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getContent } from "@/lib/content";
import { Bell, DollarSign, ArrowUp, CalendarCheck, ClipboardList, ChevronRight, Loader2, AlertTriangle } from "lucide-react";
import { FloatingSupport } from "@/components/floating-support";
import { FloatingWheel } from "@/components/floating-wheel";
import BannerCarousel from "@/components/banner-carousel";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/countries";
import popupMascot from "@assets/popup-mascot.png";
import productImgFallback from "@assets/vestas_112v_closeup_1783210181172.jpg";
import type { Product } from "@shared/schema";

/* ─── Palette ─────────────────────────────────────────── */
const BG      = "#000";
const CARD_BG = "#111111";
const ACCENT  = "#E8192C"; // rouge identité app

/* ─── Ticker items (live transactions simulées) ────────── */
const TICKER_ITEMS = [
  "Recharge 10 000  •  78****347",
  "Retrait 15 000  •  62****891",
  "Recharge 25 000  •  07****214",
  "Retrait 5 000  •  05****673",
];

/* ─── Icône circulaire ─────────────────────────────────── */
function CircleIcon({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: 52,
        height: 52,
        borderRadius: "50%",
        border: `2px solid #fff`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
      }}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  const { user, refreshUser } = useAuth();
  const { t }        = useI18n();
  const { toast }    = useToast();
  const [, navigate] = useLocation();
  const [showPopup, setShowPopup]           = useState(false);
  const [confirmProduct, setConfirmProduct] = useState<Product | null>(null);

  const purchaseMutation = useMutation({
    mutationFn: async (productId: number) => {
      const res = await apiRequest("POST", `/api/products/${productId}/purchase`, {});
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || t.errorOccurred); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/products"] });
      refreshUser();
      setConfirmProduct(null);
      toast({ title: t.purchaseSuccess, description: t.purchaseSuccessDescription });
    },
    onError: (e: any) => {
      setConfirmProduct(null);
      toast({ title: e.message || t.errorOccurred, variant: "destructive" });
    },
  });

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const { data: allProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  /* Produits spéciaux : IDs choisis dans l'admin, sinon les 3 premiers */
  const specialIds: number[] = (() => {
    try {
      const parsed = JSON.parse(settings?.specialProductIds || "[]");
      return Array.isArray(parsed) ? parsed.map(Number) : [];
    } catch { return []; }
  })();
  const paidProducts = (allProducts || []).filter(p => !p.isFree);
  const specialProducts = specialIds.length > 0
    ? specialIds.map(id => paidProducts.find(p => p.id === id)).filter(Boolean) as Product[]
    : paidProducts.slice(0, 4);

  useEffect(() => {
    setShowPopup(true);
    const handler = () => setShowPopup(true);
    window.addEventListener("home-tab-clicked", handler);
    return () => window.removeEventListener("home-tab-clicked", handler);
  }, []);

  if (!user) return null;

  const balance       = parseFloat(user.balance       || "0");
  const totalEarnings = parseFloat(user.totalEarnings || "0");
  const currency      = "FCFA";

  const telegramGroupLink = settings?.groupLink || "https://t.me/vestasgroup";
  const popupMascotUrl    = settings?.popupMascotUrl?.trim() || "";

  const minDeposit    = settings?.minDeposit    || "3000";
  const minWithdrawal = settings?.minWithdrawal || "1000";
  const fees          = settings?.withdrawalFees || "10";
  const lvl1          = settings?.level1Commission || "25";
  const lvl2          = settings?.level2Commission || "1";
  const lvl3          = settings?.level3Commission || "1";

  const banner1Images: string[] = (() => {
    try { const p = JSON.parse(settings?.banner1Images || "[]"); return Array.isArray(p) && p.length ? p : ["/banner/banner1.jpg"]; }
    catch { return ["/banner/banner1.jpg"]; }
  })();
  const banner2Images: string[] = (() => {
    try { const p = JSON.parse(settings?.banner2Images || "[]"); return Array.isArray(p) && p.length ? p : ["/banner/banner2.jpg"]; }
    catch { return ["/banner/banner2.jpg"]; }
  })();

  const popupLines: string[] = [
    getContent(settings, "popupLine1", `✨✨ Lancement officiel de la plateforme XPENG ✨✨`),
    getContent(settings, "popupLine2", `🔻 Invitez vos amis à investir et gagnez jusqu'à ${lvl1}% de commissions. Les revenus passifs ne sont plus un simple rêve.`),
    getContent(settings, "popupLine3", `🎁 Bonus de connexion quotidienne disponible chaque jour`),
    getContent(settings, "popupLine4", `🤝 Dépôt minimum : ${parseInt(minDeposit).toLocaleString()} FCFA`),
    getContent(settings, "popupLine5", `💚 Retrait minimum : ${parseInt(minWithdrawal).toLocaleString()} FCFA`),
    getContent(settings, "popupLine6", `⚙️ Frais de retrait : ${fees}%`),
    getContent(settings, "popupLine7", `🍀 Retraits disponibles du Lundi au Vendredi de 10h à 16h ; max 1 retrait/jour.`),
    getContent(settings, "popupLine8", `👥 Commissions : ${lvl1}% – ${lvl2}% – ${lvl3}%`),
    getContent(settings, "popupLine9", `📌 Les gains sont crédités automatiquement chaque jour.`),
  ];

  const quickActions = [
    { icon: <DollarSign size={22} color="#fff" strokeWidth={1.8} />, label: "Recharge",  href: "/deposit"   },
    { icon: <ArrowUp    size={22} color="#fff" strokeWidth={1.8} />, label: "Retrait",   href: "/withdrawal" },
    { icon: <CalendarCheck size={20} color="#fff" strokeWidth={1.8} />, label: "Pointage", href: "/checkin" },
    { icon: <ClipboardList size={20} color="#fff" strokeWidth={1.8} />, label: "Missions", href: "/tasks"   },
  ];

  return (
    <div className="flex flex-col min-h-full" style={{ background: BG }}>

      {/* ══════ POPUP ══════ */}
      {showPopup && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-5"
          style={{ background: "rgba(0,0,0,0.80)" }}
          onClick={() => setShowPopup(false)}
        >
          <div
            className="w-full rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            style={{ background: "#fff", maxWidth: 340, maxHeight: "80vh" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-5 pb-1">
              <img
                src={popupMascotUrl || popupMascot}
                alt="mascot"
                style={{ width: 64, height: 64, objectFit: "contain" }}
              />
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-3 pt-2">
              {popupLines.map((line, i) => (
                <p key={i} className="text-gray-800 leading-relaxed mb-2" style={{ fontSize: 13 }}>
                  {line}
                </p>
              ))}
            </div>
            <div className="shrink-0 flex items-center px-4 py-3 gap-2" style={{ borderTop: "1px solid #f3f4f6" }}>
              <a
                href={telegramGroupLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowPopup(false)}
                className="flex items-center justify-center gap-1.5 font-bold text-white rounded-xl"
                style={{ flex: "1 1 0", height: 44, background: "#0088cc", fontSize: 13.5 }}
                data-testid="button-popup-telegram"
              >
                <SiTelegram style={{ width: 16, height: 16 }} />
                Telegram &gt;
              </a>
              <button
                onClick={() => setShowPopup(false)}
                className="flex items-center justify-center font-extrabold"
                style={{ flex: "1 1 0", height: 44, background: "transparent", color: ACCENT, fontSize: 16 }}
                data-testid="button-popup-agree"
              >
                D'accord
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════ BANNIÈRE 1 — pleine largeur, sans overlay logo ══════ */}
      <BannerCarousel images={banner1Images} height={220} />

      {/* ══════ CORPS ══════ */}
      <div className="flex-1 flex flex-col pb-24" style={{ gap: 12, padding: "14px 12px 0" }}>

        {/* ── Titre "Mon compte" ── */}
        <p
          style={{
            textAlign: "center",
            color: "#fff",
            fontWeight: 600,
            fontSize: 17,
            letterSpacing: "0.01em",
            marginBottom: 2,
          }}
        >
          Mon compte
        </p>

        {/* ── Deux cartes solde côte à côte ── */}
        <div style={{ display: "flex", gap: 10 }}>
          {/* Solde */}
          <div
            style={{
              flex: 1,
              background: CARD_BG,
              border: `1.5px solid ${ACCENT}`,
              borderRadius: 12,
              padding: "16px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <p
              style={{ color: "#fff", fontWeight: 700, fontSize: 18, letterSpacing: "0.02em" }}
              data-testid="text-balance"
            >
              {currency}&nbsp;{balance.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>Solde du compte</p>
          </div>

          {/* Revenus cumulés */}
          <div
            style={{
              flex: 1,
              background: CARD_BG,
              border: `1.5px solid ${ACCENT}`,
              borderRadius: 12,
              padding: "16px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <p
              style={{ color: "#fff", fontWeight: 700, fontSize: 18, letterSpacing: "0.02em" }}
              data-testid="text-earnings"
            >
              {currency}&nbsp;{totalEarnings.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>Revenus cumulés</p>
          </div>
        </div>

        {/* ── Ticker notifications ── */}
        <div
          style={{
            background: CARD_BG,
            borderRadius: 12,
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            overflow: "hidden",
          }}
        >
          <Bell size={16} color="#fff" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div
              className="animate-marquee"
              style={{ whiteSpace: "nowrap", color: "#fff", fontSize: 13, fontWeight: 500 }}
            >
              {TICKER_ITEMS.join("    •    ")}
            </div>
          </div>
        </div>

        {/* ── 4 boutons rapides ── */}
        <div
          style={{
            background: CARD_BG,
            borderRadius: 14,
            padding: "18px 8px",
            display: "flex",
            justifyContent: "space-around",
            alignItems: "flex-start",
          }}
        >
          {quickActions.map((item, idx) => (
            <button
              key={idx}
              onClick={() => navigate(item.href)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                background: "none",
                border: "none",
                cursor: "pointer",
                flex: 1,
              }}
              className="active:scale-95 transition-transform"
              data-testid={`button-action-${idx}`}
            >
              <CircleIcon>{item.icon}</CircleIcon>
              <span style={{ color: "#fff", fontSize: 12, fontWeight: 500, textAlign: "center" }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* ── Produits spéciaux ── */}
        <div>
          {/* Titre */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 4, height: 18, borderRadius: 2, background: ACCENT }} />
              <span style={{ color: "#fff", fontSize: 16, fontWeight: 800, letterSpacing: 0.3 }}>
                Produits spéciaux
              </span>
            </div>
            <button
              onClick={() => navigate("/invest")}
              style={{ display: "flex", alignItems: "center", gap: 2, background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <span style={{ color: ACCENT, fontSize: 12, fontWeight: 600 }}>Voir tout</span>
              <ChevronRight size={14} color={ACCENT} />
            </button>
          </div>

          {/* Grille 2 colonnes — même style exact que la page Produits */}
          <div className="grid grid-cols-2 gap-2">
            {specialProducts.map((product) => {
              const img = product.imageUrl || productImgFallback;
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col"
                >
                  {/* Nom */}
                  <div className="text-center pt-3 pb-1 px-2">
                    <p className="font-bold text-gray-800 text-sm">{product.name}</p>
                  </div>

                  {/* Image */}
                  <div className="mx-3 my-2 rounded-xl overflow-hidden" style={{ height: 110 }}>
                    <img src={img} alt={product.name} className="w-full h-full object-cover" />
                  </div>

                  {/* Stats */}
                  <div className="px-3 pb-1 space-y-0.5">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-[11px]">{t.price}</span>
                      <span className="font-bold text-[11px]" style={{ color: ACCENT }}>
                        FCFA {Number(product.price).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-[11px]">{t.dailyRevenue}</span>
                      <span className="font-bold text-[11px]" style={{ color: ACCENT }}>
                        FCFA {Number(product.dailyEarnings).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-[11px]">{t.totalRevenue}</span>
                      <span className="font-bold text-[11px]" style={{ color: ACCENT }}>
                        FCFA {Number(product.totalReturn).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-[11px]">{t.period}</span>
                      <span className="font-bold text-[11px]" style={{ color: ACCENT }}>
                        {product.cycleDays} {t.ordersDaysLbl}
                      </span>
                    </div>
                  </div>

                  {/* Prix + bouton Acheter */}
                  <div className="mt-auto px-3 pb-3 pt-2">
                    <p className="text-gray-800 font-black text-base text-center mb-2">
                      FCFA {Number(product.price).toLocaleString()}
                    </p>
                    <div className="flex justify-center">
                      <button
                        onClick={() => setConfirmProduct(product)}
                        className="px-6 py-1.5 rounded-lg text-sm font-bold text-white shadow active:scale-95 transition-transform"
                        style={{ background: ACCENT }}
                      >
                        {t.buy}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      <FloatingWheel   bottomOffset={80} />
      <FloatingSupport bottomOffset={80} />

      {/* ══ POPUP CONFIRMATION ACHAT ══ */}
      {confirmProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setConfirmProduct(null)}
        >
          <div
            className="w-full mx-4 rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: "#ffffff", maxWidth: 420 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Image produit */}
            <div className="flex items-center justify-center" style={{ background: "#f8f8f8", height: 200 }}>
              <img
                src={confirmProduct.imageUrl || productImgFallback}
                alt={confirmProduct.name}
                style={{ height: 180, maxWidth: "90%", objectFit: "contain" }}
              />
            </div>

            {/* Prix + nom */}
            <div className="px-5 pt-4 pb-2">
              <p className="font-black" style={{ fontSize: 24, color: ACCENT, lineHeight: 1.2 }}>
                FCFA {Number(confirmProduct.price).toLocaleString()}
              </p>
              <p style={{ fontSize: 14, color: "#555", marginTop: 2 }}>{confirmProduct.name}</p>
            </div>

            <div style={{ height: 1, background: "#f0f0f0", margin: "0 20px" }} />

            {/* Description */}
            <div className="px-5 py-3 text-center">
              <p style={{ fontSize: 13, color: "#333", fontWeight: 600 }}>Revenus crédités toutes les 24 h</p>
              <p style={{ fontSize: 12, color: "#888", marginTop: 3, lineHeight: 1.5 }}>
                Vous pouvez acheter plusieurs appareils pour augmenter vos revenus
              </p>
            </div>

            {/* Alerte solde insuffisant */}
            {user && parseFloat(user.balance || "0") < parseFloat(String(confirmProduct.price)) && (
              <div className="mx-5 mb-2 flex items-center gap-2 p-2.5 rounded-xl"
                style={{ background: "#fff2f2", border: "1px solid #fca5a5" }}>
                <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: ACCENT }} />
                <p className="text-xs" style={{ color: ACCENT }}>
                  {t.investInsufficient.replace("{0}", formatCurrency(
                    parseFloat(String(confirmProduct.price)) - parseFloat(user.balance || "0"), user.country
                  ))}
                </p>
              </div>
            )}

            {/* Stats 3 colonnes */}
            <div className="flex" style={{ margin: "0 20px 16px", border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
              {[
                { value: `${confirmProduct.cycleDays} jours`, label: "Durée" },
                { value: `FCFA ${Number(confirmProduct.dailyEarnings).toLocaleString()}`, label: "Revenu quotidien" },
                { value: `FCFA ${Number(confirmProduct.totalReturn).toLocaleString()}`, label: "Revenu total" },
              ].map((stat, i) => (
                <div key={i} className="flex-1 flex flex-col items-center py-3"
                  style={{ borderRight: i < 2 ? "1px solid #eee" : "none" }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: ACCENT, lineHeight: 1.3 }}>{stat.value}</p>
                  <p style={{ fontSize: 11, color: "#888", marginTop: 2, textAlign: "center", lineHeight: 1.3 }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Boutons */}
            <div className="flex" style={{ borderTop: "1px solid #f0f0f0" }}>
              <button
                onClick={() => setConfirmProduct(null)}
                className="flex-1 font-semibold active:opacity-70"
                style={{ padding: "17px 0", fontSize: 16, color: "#555", background: "#e8e8e8", border: "none", borderBottomLeftRadius: 24 }}
              >
                {t.cancel}
              </button>
              <button
                onClick={() => purchaseMutation.mutate(confirmProduct.id)}
                disabled={purchaseMutation.isPending || (user ? parseFloat(user.balance || "0") < parseFloat(String(confirmProduct.price)) : true)}
                className="flex-1 font-bold text-white flex items-center justify-center gap-2 active:opacity-80 disabled:opacity-50"
                style={{ padding: "17px 0", fontSize: 16, background: ACCENT, border: "none", borderBottomRightRadius: 24 }}
              >
                {purchaseMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
