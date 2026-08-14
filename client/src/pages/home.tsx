import { useAuth } from "@/lib/auth";
import { SiTelegram } from "react-icons/si";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getContent } from "@/lib/content";
import { Bell, DollarSign, ArrowUp, CalendarCheck, ClipboardList } from "lucide-react";
import { FloatingSupport } from "@/components/floating-support";
import { FloatingWheel } from "@/components/floating-wheel";
import BannerCarousel from "@/components/banner-carousel";
import { useI18n } from "@/lib/i18n";
import popupMascot from "@assets/popup-mascot.png";

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
  const { user }     = useAuth();
  const { t }        = useI18n();
  const [, navigate] = useLocation();
  const [showPopup, setShowPopup] = useState(false);

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

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

        {/* ── Bannière 2 ── */}
        <BannerCarousel images={banner2Images} height={200} rounded />

      </div>

      <FloatingWheel   bottomOffset={80} />
      <FloatingSupport bottomOffset={80} />
    </div>
  );
}
