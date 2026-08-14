import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import landscapeImg from "@assets/portable-charger-power-banks_480x480_d6b67d82-6118-4295-be02-e_1784966597898.jpg";
import { useLocation } from "wouter";
import { ChevronLeft, User } from "lucide-react";
import { getUserAvatar } from "@/lib/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { getCountryByCode } from "@/lib/countries";
import { useI18n } from "@/lib/i18n";

interface TeamMember {
  id: number;
  fullName: string;
  phone: string;
  country: string;
  createdAt: string;
  totalInvested: number;
}

interface TeamDetails {
  level1: TeamMember[];
  level2: TeamMember[];
  level3: TeamMember[];
  totalLevel1Invested: number;
  totalLevel2Invested: number;
  totalLevel3Invested: number;
}

function maskPhone(phone: string): string {
  if (phone.length <= 4) return phone;
  const last4 = phone.slice(-4);
  return `******${last4}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
}

const GREEN = "#E8192C";
const GREEN_BG = "#d9f5e4";

export default function TeamDetailsPage() {
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3>(1);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { t } = useI18n();

  const { data: team, isLoading } = useQuery<TeamDetails>({
    queryKey: ["/api/team/details"],
  });

  const country = getCountryByCode(user?.country || "");
  const currency = "FCFA";

  const levels = [
    {
      num: 1 as const,
      label: t.teamLevel1,
      members: team?.level1 || [],
      totalInvested: team?.totalLevel1Invested || 0,
    },
    {
      num: 2 as const,
      label: t.teamLevel2,
      members: team?.level2 || [],
      totalInvested: team?.totalLevel2Invested || 0,
    },
    {
      num: 3 as const,
      label: t.teamLevel3,
      members: team?.level3 || [],
      totalInvested: team?.totalLevel3Invested || 0,
    },
  ];

  const activeData = levels[activeLevel - 1];
  const members = activeData.members;
  const memberCount = members.length;
  const totalInvested = activeData.totalInvested;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#0d0d0d" }}>

      {/* ── Header ── */}
      <div className="bg-white flex items-center px-4 py-4 shadow-sm">
        <button
          onClick={() => navigate("/team")}
          className="p-1 text-gray-600"
          data-testid="button-back-team"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1
          className="flex-1 text-center font-bold text-base pr-7"
          style={{ color: GREEN }}
          data-testid="text-page-title"
        >
          {t.teamHistoryTitle}
        </h1>
      </div>

      {/* ── Level tabs ── */}
      <div className="bg-white border-b border-gray-100 flex">
        {levels.map((level) => (
          <button
            key={level.num}
            onClick={() => setActiveLevel(level.num)}
            className="flex-1 py-3 text-center text-sm font-medium relative"
            style={{ color: activeLevel === level.num ? GREEN : "#9ca3af" }}
            data-testid={`tab-level-${level.num}`}
          >
            {level.label}
            {activeLevel === level.num && (
              <span
                className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                style={{ backgroundColor: GREEN }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ── Stats row ── */}
      <div className="mx-3 mt-3 flex gap-3">
        {/* Membres */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm px-4 py-3">
          <p className="text-xs text-gray-400 mb-1">{t.teamMembersLabel}</p>
          <p className="text-3xl font-black text-gray-900" data-testid="text-member-count">
            {isLoading ? "—" : memberCount}
          </p>
        </div>

        {/* Dépôts */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm px-4 py-3">
          <p className="text-xs text-gray-400 mb-1">{t.teamDepositsLabel}</p>
          <p
            className="text-xl font-black"
            style={{ color: GREEN }}
            data-testid="text-total-invested"
          >
            {isLoading
              ? "—"
              : `${currency} ${Number(totalInvested).toLocaleString()}`}
          </p>
        </div>
      </div>

      {/* ── Members list ── */}
      <div className="mx-3 mt-3 mb-8 flex-1 space-y-2">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))
        ) : members.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm text-center py-14 px-6">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: GREEN_BG }}
            >
              <User className="w-7 h-7" style={{ color: GREEN }} />
            </div>
            <p className="text-gray-500 text-sm font-medium">
              {t.membersNoneAtLevel.replace("{0}", String(activeLevel))}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              {t.membersInviteFriends}
            </p>
          </div>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-2xl shadow-sm flex items-center px-4 py-3 gap-3"
              data-testid={`team-member-${member.id}`}
            >
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border-2" style={{ borderColor: GREEN }}>
                <img src={getUserAvatar(member.id)} alt="avatar" className="w-full h-full object-cover" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-semibold text-gray-800 truncate"
                  data-testid={`text-member-phone-${member.id}`}
                >
                  {t.teamMemberAccount} {maskPhone(member.phone)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {t.teamMemberDate} {formatDate(member.createdAt)}
                </p>
              </div>

              {/* Amount */}
              <p
                className="text-sm font-bold shrink-0 text-gray-700"
                data-testid={`text-member-invested-${member.id}`}
              >
                {currency} {Number(member.totalInvested).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>

      <img src={landscapeImg} alt="ASUS" className="w-full object-cover object-top" style={{ maxHeight: 220 }} />
    </div>
  );
}
