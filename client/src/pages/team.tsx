import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getCountryByCode } from "@/lib/countries";
import { useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";

import xpengInvite   from "@assets/xpeng-team-invite.png";
import xpengProgress from "@assets/xpeng-team-progress.png";

/* ── Palette ─────────────────────────────────── */
const GREEN   = "#4CAF50";
const GREENDARK = "#388E3C";

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

  const countryInfo = getCountryByCode(user.country);
  const currency    = countryInfo?.currency || "FCFA";
  const referralCode = user.referralCode || "";
  const referralLink = `${window.location.origin}/#/register?invite_code=${referralCode}`;

  const lv1Rate = settings?.level1Commission || "30";
  const lv2Rate = settings?.level2Commission || "2";
  const lv3Rate = settings?.level3Commission || "1";

  const totalUsers =
    (stats?.level1Count || 0) +
    (stats?.level2Count || 0) +
    (stats?.level3Count || 0);
  const totalCommission = stats?.totalCommission || 0;

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast({ title: "Code copié !" });
  };
  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Lien copié !" });
  };

  return (
    <div
      className="flex flex-col min-h-full pb-20"
      style={{ background: "#f5f5f5" }}
    >

      {/* ══ Stats 3 colonnes ══ */}
      <div
        className="flex"
        style={{ background: "#fff", borderBottom: "1px solid #e0e0e0" }}
      >
        {[
          { label: "Utilisateurs", val: stats?.level1Count || 0 },
          { label: "Utilisateurs", val: stats?.level2Count || 0 },
          { label: "Utilisateurs", val: stats?.level3Count || 0 },
        ].map((col, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col items-center py-3"
            style={{
              borderRight: i < 2 ? "1px solid #e0e0e0" : "none",
            }}
          >
            <p style={{ fontSize: 13, color: "#333", lineHeight: 1.4 }}>
              Utilisateurs : {col.val}
            </p>
            <p style={{ fontSize: 13, color: "#333", lineHeight: 1.4 }}>
              Récompenses : {i === 0
                ? (stats?.level1Commission || 0).toFixed(0)
                : i === 1
                  ? (stats?.level2Commission || 0).toFixed(0)
                  : (stats?.level3Commission || 0).toFixed(0)}
            </p>
          </div>
        ))}
      </div>

      {/* ══ Boutons navigation ══ */}
      <div
        className="flex gap-3 px-4 py-3"
        style={{ background: "#fff" }}
      >
        <button
          onClick={() => navigate("/tasks")}
          className="flex-1 text-center font-semibold rounded-full py-2"
          style={{
            border: `1.5px solid ${GREEN}`,
            color: GREEN,
            fontSize: 13,
            background: "#fff",
          }}
          data-testid="button-task-center"
        >
          Centre des tâches &gt;
        </button>
        <button
          onClick={() => navigate("/members")}
          className="flex-1 text-center font-semibold rounded-full py-2"
          style={{
            border: `1.5px solid ${GREEN}`,
            color: GREEN,
            fontSize: 13,
            background: "#fff",
          }}
          data-testid="button-team-history"
        >
          Historique d'équipe &gt;
        </button>
      </div>

      <div className="px-3 pt-2 space-y-3">

        {/* ══ Carte invitation ══ */}
        <div
          className="rounded-2xl bg-white shadow-sm overflow-hidden"
          style={{ border: "1px solid #e8e8e8" }}
        >
          {/* Header */}
          <div className="flex items-start gap-3 px-4 pt-4 pb-3">
            <img
              src={xpengInvite}
              alt="XPENG"
              style={{ width: 72, height: 72, objectFit: "contain", flexShrink: 0 }}
            />
            <div className="flex-1 min-w-0">
              <p
                className="font-bold leading-snug"
                style={{ fontSize: 15, color: "#111", marginBottom: 4 }}
              >
                Commencez à inviter des amis maintenant
              </p>
              <p style={{ fontSize: 12, color: "#777" }}>
                Partagez le code d'invitation ou le lien
              </p>
            </div>
          </div>

          {/* Code row */}
          <div className="flex items-center gap-2 px-4 pb-3">
            <div
              className="flex-1 flex items-center justify-center rounded-full py-2"
              style={{
                border: `1.5px solid ${GREEN}`,
                color: GREEN,
                fontSize: 14,
                fontWeight: 600,
                background: "#fff",
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              <span className="truncate px-2" data-testid="text-referral-code">
                {referralCode}
              </span>
            </div>
            <button
              onClick={copyCode}
              className="shrink-0 font-semibold rounded-lg py-2 px-4 active:scale-95 transition-transform"
              style={{
                background: GREEN,
                color: "#fff",
                fontSize: 14,
                border: "none",
              }}
              data-testid="button-copy-code"
            >
              Copier
            </button>
          </div>

          {/* Link row */}
          <div className="flex items-center gap-2 px-4 pb-4">
            <div
              className="flex-1 flex items-center rounded-full py-2"
              style={{
                border: "1.5px solid #ccc",
                color: "#555",
                fontSize: 12,
                background: "#fff",
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              <span className="truncate px-3" data-testid="text-referral-link">
                {referralLink}
              </span>
            </div>
            <button
              onClick={copyLink}
              className="shrink-0 font-semibold rounded-lg py-2 px-4 active:scale-95 transition-transform"
              style={{
                background: GREEN,
                color: "#fff",
                fontSize: 14,
                border: "none",
              }}
              data-testid="button-copy-link"
            >
              Copier
            </button>
          </div>
        </div>

        {/* ══ Carte Ma progression ══ */}
        <div
          className="rounded-2xl overflow-hidden shadow-sm"
          style={{ background: GREEN }}
        >
          <div className="flex items-center justify-between px-5 py-5">
            {/* Left */}
            <div className="flex flex-col gap-4">
              <p
                className="font-bold"
                style={{ fontSize: 18, color: "#fff", marginBottom: 6 }}
              >
                Ma progression
              </p>

              {/* Utilisateurs */}
              <div>
                <p style={{ fontSize: 22, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
                  {totalUsers}
                </p>
                <button
                  onClick={() => navigate("/members")}
                  style={{ fontSize: 13, color: "#ffffffcc", textDecoration: "underline" }}
                  data-testid="button-total-users"
                >
                  Utilisateurs totaux &gt;
                </button>
              </div>

              {/* Récompenses */}
              <div>
                <p style={{ fontSize: 20, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
                  {currency} {totalCommission.toFixed(0)}
                </p>
                <button
                  onClick={() => navigate("/team-details")}
                  style={{ fontSize: 13, color: "#ffffffcc", textDecoration: "underline" }}
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
          className="rounded-2xl bg-white shadow-sm px-4 py-5"
          style={{ border: "1px solid #e8e8e8" }}
        >
          <p style={{ fontSize: 14, color: "#333", lineHeight: 1.8 }}>
            Lorsqu'un ami que vous invitez s'inscrit et investit, vous recevez
            immédiatement une prime de <strong>{lv1Rate} %</strong> sur son investissement.
          </p>
          <p style={{ fontSize: 14, color: "#333", lineHeight: 1.8, marginTop: 8 }}>
            Lorsque les membres de votre équipe de deuxième niveau investissent,
            vous recevez une prime de <strong>{lv2Rate} %</strong>.
          </p>
          <p style={{ fontSize: 14, color: "#333", lineHeight: 1.8, marginTop: 8 }}>
            Lorsque les membres de votre équipe de troisième niveau investissent,
            vous recevez une prime de <strong>{lv3Rate} %</strong>.
          </p>
          <p style={{ fontSize: 14, color: "#333", lineHeight: 1.8, marginTop: 8 }}>
            Une fois que les membres de votre équipe ont investi, la prime est
            immédiatement créditée sur votre compte et vous pouvez la retirer
            immédiatement.
          </p>
        </div>

      </div>
    </div>
  );
}
