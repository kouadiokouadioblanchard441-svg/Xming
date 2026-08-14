import { useAuth } from "@/lib/auth";
import { SiTelegram } from "react-icons/si";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getContent } from "@/lib/content";
import { getCountryByCode } from "@/lib/countries";
import { Bell, Gift } from "lucide-react";
import { FloatingSupport } from "@/components/floating-support";
import { FloatingWheel } from "@/components/floating-wheel";
import BannerCarousel from "@/components/banner-carousel";
import { useI18n } from "@/lib/i18n";

import popupBanner  from "@assets/popup-banner.jpg";
import popupMascot  from "@assets/popup-mascot.png";
import iconRecharger from "@assets/recharge_(1)_1786038805921.png";
import iconRetraits  from "@assets/withdraw_1786038805887.png";
import iconService   from "@assets/telegram_(1)_1786038805966.png";
import iconGift      from "@assets/blog_(1)_1786038805944.png";

/* ─── Palette ─────────────────────────────────── */
const BG      = "#000000";   // fond principal olive foncé
const CARD    = "#000000";   // carte verte
const CIRCLE  = "#111a06";   // cercle icône

/* ─── Données ticker (simulées) ──────────────── */
const TICKER_ITEMS = [
  "100,000  ✦✦✦✦✦✦4772  Recharge  25,000  ✦✦✦✦✦",
  "✦✦✦✦✦✦1234  Retrait  15,000  ✦✦✦✦✦",
  "✦✦✦✦✦✦5678  Recharge  50,000  ✦✦✦",
  "✦✦✦✦✦✦9012  Retrait  10,000  ✦✦✦✦",
];

export default function HomePage() {
  const { user }    = useAuth();
  const { t }       = useI18n();
  const [, navigate] = useLocation();
  const [showPopup, setShowPopup] = useState(false);

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  /* popup on mount + home-tab-clicked */
  useEffect(() => {
    setShowPopup(true);
    const handler = () => setShowPopup(true);
    window.addEventListener("home-tab-clicked", handler);
    return () => window.removeEventListener("home-tab-clicked", handler);
  }, []);

  if (!user) return null;

  const balance       = parseFloat(user.balance       || "0");
  const totalEarnings = parseFloat(user.totalEarnings || "0");
  const country       = getCountryByCode(user.country);
  const currency      = "FCFA";

  const telegramGroupLink = settings?.groupLink || "https://t.me/vestasgroup";

  const minDeposit    = settings?.minDeposit    || "3000";
  const minWithdrawal = settings?.minWithdrawal || "1000";
  const fees          = settings?.withdrawalFees || "10";
  const lvl1          = settings?.level1Commission || "25";
  const lvl2          = settings?.level2Commission || "1";
  const lvl3          = settings?.level3Commission || "1";

  const popupMascotUrl = settings?.popupMascotUrl?.trim() || "";

  /* ── Bannières configurables ── */
  const banner1Images: string[] = (() => {
    try { const p = JSON.parse(settings?.banner1Images || "[]"); return Array.isArray(p) && p.length ? p : ["/banner/banner1.jpg"]; }
    catch { return ["/banner/banner1.jpg"]; }
  })();
  const banner2Images: string[] = (() => {
    try { const p = JSON.parse(settings?.banner2Images || "[]"); return Array.isArray(p) && p.length ? p : ["/banner/banner2.jpg"]; }
    catch { return ["/banner/banner2.jpg"]; }
  })();

  const popupLines: string[] = [
    getContent(settings, "popupLine1", `✨✨ Lancement officiel de la plateforme ASUS (4 août 2026) ✨✨`),
    getContent(settings, "popupLine2", `🔻 Invitez vos amis à investir et gagnez jusqu'à ${lvl1}% de commissions sur les investissements. Les revenus passifs ne sont plus un simple rêve.`),
    getContent(settings, "popupLine3", `🎁 Bonus de connexion quotidienne disponible chaque jour`),
    getContent(settings, "popupLine4", `🤝 Dépôt minimum : ${parseInt(minDeposit).toLocaleString()} FCFA`),
    getContent(settings, "popupLine5", `💚 Retrait minimum : ${parseInt(minWithdrawal).toLocaleString()} FCFA`),
    getContent(settings, "popupLine6", `⚙️ Frais de retrait : ${fees}%`),
    getContent(settings, "popupLine7", `🍀 Retraits disponibles du Lundi au Vendredi de 10h à 16h ; maximum 1 retrait par jour.`),
    getContent(settings, "popupLine8", `👥 Commissions de parrainage : ${lvl1}% – ${lvl2}% – ${lvl3}%`),
    getContent(settings, "popupLine9", `📌 Remarque : Les gains issus des investissements sont automatiquement crédités sur votre compte chaque jour.`),
  ];

  const quickActions = [
    { icon: iconRecharger, label: t.deposit,         href: "/deposit",     white: true  },
    { icon: iconRetraits,  label: t.withdraw,         href: "/withdrawal",  white: true  },
    { icon: iconService,   label: t.customerService,  href: "/service",     white: false },
    { icon: iconGift,      label: "Informations", href: "/company", white: false },
  ];

  return (
    <div className="flex flex-col min-h-full" style={{ background: BG }}>

      {/* ══════════════ POPUP ══════════════ */}
      {showPopup && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-5"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={() => setShowPopup(false)}
        >
          <div
            className="w-full rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            style={{ background: "#fff", maxWidth: 340, maxHeight: "80vh" }}
            onClick={e => e.stopPropagation()}
          >

            {/* ── Mascote centrée en haut ── */}
            <div className="flex justify-center pt-5 pb-1">
              <img
                src={popupMascotUrl || popupMascot}
                alt="mascot"
                style={{ width: 64, height: 64, objectFit: "contain", filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.25))" }}
              />
            </div>

            {/* ── Contenu scrollable ── */}
            <div className="flex-1 overflow-y-auto px-4 pb-3 pt-2">
              {popupLines.map((line, i) => (
                <p key={i} className="text-gray-800 leading-relaxed mb-2" style={{ fontSize: 13 }}>
                  {line}
                </p>
              ))}
            </div>

            {/* ── Boutons bas (fixes) ── */}
            <div className="shrink-0 flex items-center px-4 py-3 gap-2" style={{ borderTop: "1px solid #f3f4f6" }}>
              <a
                href={telegramGroupLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowPopup(false)}
                className="flex items-center justify-center gap-1.5 font-bold text-white rounded-xl"
                style={{ flex: "1 1 0", height: 44, background: "#0088cc", fontSize: 13.5, boxShadow: "0 2px 6px rgba(0,136,204,0.3)" }}
                data-testid="button-popup-telegram"
              >
                <SiTelegram style={{ width: 16, height: 16 }} />
                Telegram &gt;
              </a>
              <button
                onClick={() => setShowPopup(false)}
                className="flex items-center justify-center font-extrabold"
                style={{ flex: "1 1 0", height: 44, background: "transparent", color: "#22c55e", fontSize: 16 }}
                data-testid="button-popup-agree"
              >
                D'accord
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ══════════════ BANNIÈRE PLEINE LARGEUR ══════════════ */}
      <BannerCarousel
        images={banner1Images}
        height={200}
        overlay={
          <div className="flex items-end pb-4 pl-4 h-full">
            <img
              src="/asus-logo-white.svg"
              alt="ASUS"
              className="h-10 object-contain drop-shadow-lg"
            />
          </div>
        }
      />

      {/* ══════════════ CORPS ══════════════ */}
      <div className="flex-1 flex flex-col gap-3 px-3 pt-3 pb-20">

        {/* ── Carte solde ── */}
        <div
          className="w-full rounded-2xl px-5 py-4 flex justify-between items-center shadow-md"
          style={{ background: CARD }}
        >
          <div>
            <p className="text-white font-extrabold text-xl leading-tight" data-testid="text-balance">
              {currency} {balance.toFixed(2)}
            </p>
            <p className="text-white/70 text-xs mt-1">{t.accountBalanceLabel}</p>
          </div>
          <div className="w-px self-stretch mx-2" style={{ background: "rgba(255,255,255,0.2)" }} />
          <div className="text-right">
            <p className="text-white font-extrabold text-xl leading-tight" data-testid="text-earnings">
              {currency} {totalEarnings.toFixed(2)}
            </p>
            <p className="text-white/70 text-xs mt-1">{t.revenueLabel || "Revenu total"}</p>
          </div>
        </div>

        {/* ── Ticker notifications ── */}
        <div
          className="w-full rounded-xl px-3 py-2 flex items-center gap-2 overflow-hidden shadow"
          style={{ background: CARD }}
        >
          <Bell className="w-4 h-4 text-white shrink-0" />
          <div className="flex-1 overflow-hidden">
            <div className="whitespace-nowrap animate-marquee text-white text-xs font-medium">
              {TICKER_ITEMS.join("    •    ")}
            </div>
          </div>
        </div>

        {/* ── 4 boutons rapides ── */}
        <div
          className="w-full rounded-2xl px-4 py-4 shadow-md"
          style={{ background: CARD }}
        >
          <div className="flex justify-around items-start">
            {quickActions.map((item, idx) => (
              <button
                key={idx}
                onClick={() => navigate(item.href)}
                className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
                data-testid={`button-action-${idx}`}
              >
                <img
                  src={item.icon}
                  alt={item.label}
                  className="w-14 h-14 object-contain rounded-2xl shadow-md"
                />
                <span className="text-white text-[11px] font-semibold text-center leading-tight max-w-[64px]">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Grande image (carousel) ── */}
        <BannerCarousel
          images={banner2Images}
          height={200}
          rounded
        />

      </div>

      {/* Floating buttons */}
      <FloatingWheel    bottomOffset={80} />
      <FloatingSupport  bottomOffset={80} />
    </div>
  );
}
