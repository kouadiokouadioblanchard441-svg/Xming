import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getCountryByCode } from "@/lib/countries";
import { Loader2, Shield, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

import iconRecords    from "@assets/mine-mod-records-DgHXSKa1_1782689837747.png";
import iconGift       from "@assets/téléchargement_(66)_1782689859239.png";
import iconAbout      from "@assets/mine-mod-aboutus-xnaBhqOq_1782689895455.png";
import iconCS         from "@assets/mine-mod-cs-DtBQ0Sp0_1782689895410.png";
import iconChangePwd  from "@assets/mine-mod-change-pwd-D4tL_Aft_1782689895436.png";
import iconBankCard   from "@assets/mine-mod-bankcard-CLOhqwHj_1782689182780.png";
import iconRecharger  from "@assets/1-1_1783245823715.png";
import iconRetraits   from "@assets/2-1_1783245823825.png";
import iconRules      from "@assets/mine-mod-records-DgHXSKa1_1782689837747.png";
import checkinBanner  from "@assets/xpeng-checkin-banner.jpg";

/* ── Palette plateforme ──────────────────────────── */
const RED   = "#E8192C";
const BLACK = "#000000";

/* ── Icône de service dans un cercle coloré ──────── */
function ServiceIcon({ src, alt, color = RED }: { src: string; alt: string; color?: string }) {
  return (
    <div
      className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 mx-auto"
      style={{ background: color }}
    >
      <img src={src} alt={alt} className="w-7 h-7 object-contain" style={{ filter: "brightness(0) invert(1)" }} />
    </div>
  );
}

export default function AccountPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [, navigate] = useLocation();
  const [showPinModal, setShowPinModal] = useState(false);
  const [adminPin, setAdminPin]         = useState("");
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled]     = useState(false);
  const [installing, setInstalling]       = useState(false);

  useEffect(() => {
    if ((window as any)._installPrompt) setInstallPrompt((window as any)._installPrompt);
    if ((window as any)._appInstalled)  setIsInstalled(true);
    const onPrompt    = (e: any) => { e.preventDefault(); setInstallPrompt(e); };
    const onInstalled = () => { setIsInstalled(true); setInstallPrompt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    setInstalling(true);
    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
        setInstallPrompt(null);
        toast({ title: "Application installée avec succès !" });
      }
    } finally { setInstalling(false); }
  };

  const { data: products } = useQuery<any[]>({ queryKey: ["/api/user/products"] });
  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });

  const verifyPinMutation = useMutation({
    mutationFn: async (pin: string) => {
      const res = await apiRequest("POST", "/api/admin/verify-pin", { pin });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || t.incorrectPin); }
      return res.json();
    },
    onSuccess: () => { setShowPinModal(false); setAdminPin(""); navigate("/admin"); },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const handleAdminClick = () => {
    if (user?.isAdminPasswordRequired === false) { navigate("/admin"); return; }
    setShowPinModal(true);
  };

  const handleLogout = async () => { await logout(); navigate("/login"); };

  if (!user) return null;

  const balance       = parseFloat(user.balance || "0");
  const totalEarnings = parseFloat(user.totalEarnings || "0");
  const country       = getCountryByCode(user.country);
  const currency      = country?.currency || "FCFA";
  const phonePrefix   = country?.phonePrefix ? `+${country.phonePrefix} ` : "";

  /* VIP level : "Lv1" / "Lv2" … basé sur le produit actif le plus élevé */
  const vipLabel: string = (() => {
    if (!products || products.length === 0) return "Lv1";
    const active = products.filter((p: any) => p.status === "active" || p.daysRemaining > 0);
    if (active.length === 0) return "Lv1";
    const top = [...active].sort((a: any, b: any) => (b.product?.sortOrder ?? 0) - (a.product?.sortOrder ?? 0))[0];
    const name = top?.product?.name ?? "Lv1";
    return name;
  })();

  /* 3 actions rapides en haut */
  const quickItems = [
    { icon: iconRecharger, label: "Recharger", href: "/deposit",    white: true },
    { icon: iconRetraits,  label: "Retirer",   href: "/withdrawal", white: true },
    { icon: iconRecords,   label: "Historique", href: "/history",   white: false },
  ];

  /* grille 4×2 services */
  const services = [
    { icon: iconAbout,     label: "À propos",               href: "/about",           },
    { icon: iconRules,     label: "Réglementation",          href: "/rules",           },
    { icon: iconRecords,   label: "Historique",              href: "/history",         },
    { icon: iconCS,        label: "Service client",          href: "/service",         },
    { icon: iconRecharger, label: "Télécharger l'app",       href: null, install: true },
    { icon: iconBankCard,  label: "Lier une carte bancaire", href: "/wallet",          },
    { icon: iconChangePwd, label: "Changer le mot de passe", href: "/change-password", },
    { icon: iconGift,      label: "Échanger un cadeau",      href: "/gift-code",       },
  ];

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#f0f0f0" }}>
      <div className="flex-1 overflow-y-auto pb-20">

        {/* ══ HEADER avec courbe ══ */}
        <div
          style={{
            background: `linear-gradient(160deg, ${RED} 0%, #a01020 50%, ${BLACK} 100%)`,
            borderBottomLeftRadius: "50% 28px",
            borderBottomRightRadius: "50% 28px",
            paddingBottom: 36,
            position: "relative",
          }}
        >
          {/* Bouton Se déconnecter — haut droite */}
          <div className="flex justify-end px-4 pt-4 pb-2">
            <button
              onClick={handleLogout}
              className="font-semibold active:scale-95 transition-transform"
              style={{
                border: "1.5px solid rgba(255,255,255,0.85)",
                borderRadius: 999,
                color: "#fff",
                fontSize: 13,
                padding: "6px 18px",
                background: "transparent",
              }}
              data-testid="button-logout"
            >
              Se déconnecter
            </button>
          </div>

          {/* Logo XPENG cercle — bas gauche */}
          <div className="px-4">
            <div
              className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center"
              style={{ background: "#fff", border: "2.5px solid rgba(255,255,255,0.9)" }}
            >
              <img src="/xpeng-logo-black.svg" alt="XPENG" style={{ width: 44, height: 28, objectFit: "contain" }} />
            </div>
          </div>
        </div>

        {/* ══ INFOS PROFIL ══ */}
        <div style={{ background: "#fff" }} className="px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Gauche : téléphone + badge */}
            <div>
              <p className="font-bold text-base" style={{ color: "#111" }} data-testid="text-phone">
                {phonePrefix}{user.phone}
              </p>
              <span
                className="inline-block mt-1.5 px-3 py-0.5 rounded-full text-white text-xs font-bold"
                style={{ background: RED }}
              >
                {vipLabel}
              </span>
            </div>

            {/* Droite : 3 actions rapides */}
            <div className="flex items-end gap-5">
              {quickItems.map((item, i) => (
                item.href ? (
                  <Link href={item.href} key={i}>
                    <button
                      className="flex flex-col items-center gap-1.5 active:opacity-70 transition-opacity"
                      data-testid={`button-quick-${i}`}
                    >
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{
                          background: i === 0 ? RED : "#e8e8e8",
                        }}
                      >
                        <img
                          src={item.icon}
                          alt={item.label}
                          className="w-6 h-6 object-contain"
                          style={
                            i === 0
                              ? { filter: "brightness(0) invert(1)" }
                              : { filter: "brightness(0.5)" }
                          }
                        />
                      </div>
                      <span className="text-[11px]" style={{ color: "#555" }}>{item.label}</span>
                    </button>
                  </Link>
                ) : null
              ))}
            </div>
          </div>
        </div>

        {/* ══ BANNER POINTAGE QUOTIDIEN ══ */}
        <div
          className="relative overflow-hidden mx-0"
          style={{ height: 170 }}
        >
          <img
            src={checkinBanner}
            alt="Pointage"
            className="w-full h-full object-cover"
          />
          {/* Overlay gradient gauche */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)" }}
          />
          {/* Texte */}
          <div className="absolute inset-0 flex flex-col justify-center px-5">
            <p className="text-white font-black text-lg leading-tight mb-1">
              Pointage quotidien
            </p>
            <p className="text-white/80 text-xs leading-snug mb-4" style={{ maxWidth: 180 }}>
              Connectez-vous chaque jour pour obtenir des récompenses
            </p>
            <Link href="/checkin">
              <button
                className="font-semibold active:scale-95 transition-transform"
                style={{
                  background: RED,
                  color: "#fff",
                  borderRadius: 999,
                  padding: "7px 20px",
                  fontSize: 13,
                  border: "none",
                  display: "inline-block",
                }}
              >
                Pointer maintenant &gt;
              </button>
            </Link>
          </div>
        </div>

        {/* ══ 2 CARTES SOLDE ══ */}
        <div className="grid grid-cols-2 gap-0" style={{ background: "#fff" }}>
          {/* Solde du compte */}
          <div
            className="flex flex-col px-5 py-5"
            style={{ borderRight: "1px solid #f0f0f0", borderBottom: "1px solid #f0f0f0" }}
          >
            <p className="font-black text-xl mb-1" style={{ color: "#111" }} data-testid="text-balance">
              {currency} {balance.toLocaleString("fr-FR", { minimumFractionDigits: 0 })}
            </p>
            <div style={{ flexGrow: 1 }} />
            <Link href="/deposit">
              <button className="text-sm font-semibold mt-4" style={{ color: "#333" }}>
                Solde du compte &gt;
              </button>
            </Link>
          </div>

          {/* Revenus cumulés */}
          <div
            className="flex flex-col px-5 py-5"
            style={{ borderBottom: "1px solid #f0f0f0" }}
          >
            <p className="font-black text-xl mb-1" style={{ color: "#111" }} data-testid="text-earnings">
              {currency} {totalEarnings.toLocaleString("fr-FR", { minimumFractionDigits: 0 })}
            </p>
            <div style={{ flexGrow: 1 }} />
            <Link href="/team-details">
              <button className="text-sm font-semibold mt-4" style={{ color: "#333" }}>
                Revenus cumulés &gt;
              </button>
            </Link>
          </div>
        </div>

        {/* ══ MES SERVICES ══ */}
        <div className="mt-3" style={{ background: "#fff" }}>
          <p className="px-4 pt-4 pb-3 font-bold text-base" style={{ color: "#111" }}>
            Mes services
          </p>

          <div className="grid grid-cols-4 px-2 pb-4">
            {services.map((item, i) => {
              const content = (
                <button
                  key={i}
                  className="flex flex-col items-center gap-2 py-3 active:opacity-70 transition-opacity w-full"
                  data-testid={`button-service-${i}`}
                  onClick={item.install ? handleInstall : undefined}
                >
                  <ServiceIcon src={item.icon} alt={item.label} color={i % 2 === 0 ? RED : "#555"} />
                  <span
                    className="text-center leading-snug"
                    style={{ fontSize: 11, color: "#444", maxWidth: 72 }}
                  >
                    {item.label}
                  </span>
                </button>
              );

              return item.href ? (
                <Link href={item.href} key={i}>{content}</Link>
              ) : (
                <div key={i}>{content}</div>
              );
            })}
          </div>
        </div>

        {/* ══ ADMIN ══ */}
        {user.isAdmin && (
          <div className="mx-4 mt-3 mb-4">
            <button
              onClick={handleAdminClick}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl active:scale-95 transition-transform"
              style={{ background: RED }}
              data-testid="button-admin"
            >
              <Shield className="w-5 h-5 text-white" />
              <span className="text-white font-bold text-sm">{t.adminPanel}</span>
            </button>
          </div>
        )}

        {/* Install feedback */}
        {installing && (
          <div className="flex justify-center py-2">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        )}
        {isInstalled && (
          <p className="text-center text-xs text-gray-400 pb-2">Application installée ✓</p>
        )}

      </div>

      {/* ══ Admin PIN modal ══ */}
      <Dialog open={showPinModal} onOpenChange={setShowPinModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">{t.adminAccessCode}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">{t.adminPinHint}</p>
            <Input
              type="password"
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              placeholder={t.pinPlaceholder}
              className="text-center text-2xl tracking-widest"
              maxLength={8}
              data-testid="input-admin-pin"
            />
            <Button
              onClick={() => {
                if (adminPin.length < 4) { toast({ title: t.pinMinLength, variant: "destructive" }); return; }
                verifyPinMutation.mutate(adminPin);
              }}
              disabled={verifyPinMutation.isPending || adminPin.length < 4}
              className="w-full"
              style={{ backgroundColor: RED }}
              data-testid="button-verify-pin"
            >
              {verifyPinMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {t.confirm}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
