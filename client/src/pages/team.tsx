import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getCountryByCode } from "@/lib/countries";
import { useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";

import xpengInvite   from "@assets/xpeng-team-invite.png";
import xpengProgress from "@assets/xpeng-team-progress.png";

/* ── Palette plateforme (identique à l'inscription) ──────── */
const RED    = "#E8192C";          // rouge accent XPENG
const BLACK  = "#000000";
const PAGE_BG = "linear-gradient(to bottom, #000000 0%, #1a1a1a 30%, #4a4a4a 60%, #c0c0c0 85%, #f5f5f5 100%)";
const INPUT_STYLE: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: 10,
  border: "none",
  boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
  display: "flex",
  alignItems: "center",
  overflow: "hidden",
  height: 50,
};

interface TeamStats {
  level1Count: number;
  level2Count: number;
  level3Count: number;
  totalCommission: number;
  level1Commission: number;
  level2Commission: number;
  level3Commission: number;
  level1Invested: number;
  level2Invested: number;
  level3Invested: number;
  level1Recharged: number;
  teamTotalDeposits: number;
  teamTotalWithdrawals: number;
}

export default function TeamPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [, navigate] = useLocation();

  const { data: stats } = useQuery<TeamStats>({ queryKey: ["/api/team/stats"] });
  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });

  if (!user) return null;

  const countryInfo  = getCountryByCode(user.country);
  const currency     = countryInfo?.currency || "FCFA";
  const referralCode = user.referralCode || "";
  const referralLink = `${window.location.origin}/#/register?invite_code=${referralCode}`;

  const lv1Rate = settings?.level1Commission || "30";
  const lv2Rate = settings?.level2Commission || "2";
  const lv3Rate = settings?.level3Commission || "1";

  const totalUsers      = (stats?.level1Count || 0) + (stats?.level2Count || 0) + (stats?.level3Count || 0);
  const totalCommission = stats?.totalCommission || 0;

  const copyCode = () => { navigator.clipboard.writeText(referralCode); toast({ title: "Code copié !" }); };
  const copyLink = () => { navigator.clipboard.writeText(referralLink);  toast({ title: "Lien copié !" }); };

  return (
    <div
      className="flex flex-col min-h-full pb-20"
      style={{ background: PAGE_BG, minHeight: "100vh" }}
    >
      {/* ══ Stats 3 colonnes ══ */}
      <div
        className="flex"
        style={{ background: "rgba(0,0,0,0.55)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}
      >
        {[
          { users: stats?.level1Count || 0, rewards: (stats?.level1Commission || 0).toFixed(0) },
          { users: stats?.level2Count || 0, rewards: (stats?.level2Commission || 0).toFixed(0) },
          { users: stats?.level3Count || 0, rewards: (stats?.level3Commission || 0).toFixed(0) },
        ].map((col, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col items-center py-3"
            style={{ borderRight: i < 2 ? "1px solid rgba(255,255,255,0.12)" : "none" }}
          >
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
              Utilisateurs : {col.users}
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
              Récompenses : {col.rewards}
            </p>
          </div>
        ))}
      </div>

      {/* ══ Boutons navigation ══ */}
      <div
        className="flex gap-3 px-4 py-3"
        style={{ background: "rgba(0,0,0,0.35)" }}
      >
        <button
          onClick={() => navigate("/tasks")}
          className="flex-1 text-center font-semibold rounded-full py-2 active:scale-95 transition-transform"
          style={{ border: `1.5px solid ${RED}`, color: RED, fontSize: 13, background: "transparent" }}
          data-testid="button-task-center"
        >
          Centre des tâches &gt;
        </button>
        <button
          onClick={() => navigate("/members")}
          className="flex-1 text-center font-semibold rounded-full py-2 active:scale-95 transition-transform"
          style={{ border: `1.5px solid ${RED}`, color: RED, fontSize: 13, background: "transparent" }}
          data-testid="button-team-history"
        >
          Historique d'équipe &gt;
        </button>
      </div>

      <div className="px-4 pt-3 space-y-4">

        {/* ══ Carte invitation ══ */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "#ffffff",
            boxShadow: "0 4px 16px rgba(0,0,0,0.45)",
            borderRadius: 14,
          }}
        >
          {/* En-tête */}
          <div className="flex items-start gap-3 px-4 pt-4 pb-3">
            <img
              src={xpengInvite}
              alt="XPENG"
              style={{ width: 70, height: 70, objectFit: "contain", flexShrink: 0 }}
            />
            <div className="flex-1 min-w-0 pt-1">
              <p className="font-bold leading-snug" style={{ fontSize: 15, color: "#111", marginBottom: 4 }}>
                Commencez à inviter des amis maintenant
              </p>
              <p style={{ fontSize: 12, color: "#777" }}>
                Partagez le code d'invitation ou le lien
              </p>
            </div>
          </div>

          {/* Ligne code */}
          <div className="flex items-center gap-2 px-4 pb-3">
            <div
              className="flex-1 flex items-center justify-center rounded-full"
              style={{
                height: 44,
                border: `1.5px solid ${RED}`,
                color: RED,
                fontSize: 14,
                fontWeight: 600,
                background: "#fff",
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              <span className="truncate px-3" data-testid="text-referral-code">{referralCode}</span>
            </div>
            <button
              onClick={copyCode}
              className="shrink-0 font-semibold rounded-xl py-2 px-4 active:scale-95 transition-transform"
              style={{ background: BLACK, color: "#fff", fontSize: 14, height: 44 }}
              data-testid="button-copy-code"
            >
              Copier
            </button>
          </div>

          {/* Ligne lien */}
          <div className="flex items-center gap-2 px-4 pb-4">
            <div
              className="flex-1 flex items-center rounded-full"
              style={{
                height: 44,
                border: "1.5px solid #ddd",
                color: "#555",
                fontSize: 12,
                background: "#f9f9f9",
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              <span className="truncate px-3" data-testid="text-referral-link">{referralLink}</span>
            </div>
            <button
              onClick={copyLink}
              className="shrink-0 font-semibold rounded-xl py-2 px-4 active:scale-95 transition-transform"
              style={{ background: RED, color: "#fff", fontSize: 14, height: 44 }}
              data-testid="button-copy-link"
            >
              Copier
            </button>
          </div>
        </div>

        {/* ══ Carte Ma progression ══ */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${BLACK} 0%, #1a1a1a 60%, ${RED}55 100%)`,
            boxShadow: `0 4px 20px rgba(232,25,44,0.35)`,
            borderRadius: 14,
            border: `1px solid ${RED}44`,
          }}
        >
          <div className="flex items-center justify-between px-5 py-5">
            {/* Left */}
            <div className="flex flex-col gap-4">
              <p className="font-bold" style={{ fontSize: 18, color: "#fff", marginBottom: 2 }}>
                Ma progression
              </p>

              <div>
                <p style={{ fontSize: 24, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
                  {totalUsers}
                </p>
                <button
                  onClick={() => navigate("/members")}
                  style={{ fontSize: 13, color: RED, fontWeight: 600 }}
                  data-testid="button-total-users"
                >
                  Utilisateurs totaux &gt;
                </button>
              </div>

              <div>
                <p style={{ fontSize: 22, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
                  {currency} {totalCommission.toFixed(0)}
                </p>
                <button
                  onClick={() => navigate("/team-details")}
                  style={{ fontSize: 13, color: RED, fontWeight: 600 }}
                  data-testid="button-total-rewards"
                >
                  Récompenses totales &gt;
                </button>
              </div>
            </div>

            {/* Right image */}
            <img
              src={xpengProgress}
              alt="XPENG"
              style={{ width: 140, height: 110, objectFit: "contain", flexShrink: 0 }}
            />
          </div>
        </div>

        {/* ══ Bloc texte règles ══ */}
        <div
          className="rounded-2xl px-4 py-5"
          style={{
            background: "#ffffff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
            borderRadius: 14,
          }}
        >
          {[
            `Lorsqu'un ami que vous invitez s'inscrit et investit, vous recevez immédiatement une prime de ${lv1Rate} % sur son investissement.`,
            `Lorsque les membres de votre équipe de deuxième niveau investissent, vous recevez une prime de ${lv2Rate} %.`,
            `Lorsque les membres de votre équipe de troisième niveau investissent, vous recevez une prime de ${lv3Rate} %.`,
            "Une fois que les membres de votre équipe ont investi, la prime est immédiatement créditée sur votre compte et vous pouvez la retirer immédiatement.",
          ].map((text, i) => (
            <p
              key={i}
              style={{
                fontSize: 14,
                color: "#333",
                lineHeight: 1.7,
                marginTop: i > 0 ? 10 : 0,
              }}
            >
              {text}
            </p>
          ))}
        </div>

      </div>
    </div>
  );
}
