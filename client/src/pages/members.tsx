import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/* ── Palette XPENG ─────────────────────────────────── */
const RED  = "#E8192C";
const GRAY = "#f5f5f5";

/* ── Types ──────────────────────────────────────────── */
interface TeamMember {
  id: number;
  fullName: string;
  phone: string;
  referralCode: string;
  country: string;
  createdAt: string;
  totalInvested: number;
  bonusFromMember: number;
  hasDeposited: boolean;
  hasActiveProduct: boolean;
  vipLevel: number;
}

interface TeamDetails {
  level1: TeamMember[];
  level2: TeamMember[];
  level3: TeamMember[];
}

/* ── Helpers ─────────────────────────────────────────── */
function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const d   = new Date(dateStr);
  const dd  = String(d.getDate()).padStart(2, "0");
  const mm  = String(d.getMonth() + 1).padStart(2, "0");
  const yy  = String(d.getFullYear()).slice(2);
  const hh  = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yy} ${hh}:${min}`;
}

function isToday(dateStr: string): boolean {
  const d   = new Date(dateStr);
  const now = new Date();
  return (
    d.getDate()     === now.getDate()    &&
    d.getMonth()    === now.getMonth()   &&
    d.getFullYear() === now.getFullYear()
  );
}

/* ── Empty state ─────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="18" y="22" width="44" height="54" rx="4" stroke="#ccc" strokeWidth="2" fill="#f9f9f9" />
        <rect x="24" y="16" width="44" height="54" rx="4" stroke="#ccc" strokeWidth="2" fill="#fff" />
        <line x1="32" y1="36" x2="60" y2="36" stroke="#ddd" strokeWidth="2" strokeLinecap="round" />
        <line x1="32" y1="44" x2="60" y2="44" stroke="#ddd" strokeWidth="2" strokeLinecap="round" />
        <line x1="32" y1="52" x2="50" y2="52" stroke="#ddd" strokeWidth="2" strokeLinecap="round" />
        <text x="10" y="22" fill="#ccc" fontSize="10" fontWeight="bold">+</text>
        <text x="68" y="30" fill="#ccc" fontSize="10" fontWeight="bold">+</text>
        <text x="14" y="60" fill="#ccc" fontSize="10" fontWeight="bold">+</text>
        <text x="72" y="62" fill="#ccc" fontSize="10" fontWeight="bold">+</text>
        <circle cx="18" cy="50" r="3" stroke="#ddd" strokeWidth="1.5" fill="none" />
        <circle cx="74" cy="44" r="3" stroke="#ddd" strokeWidth="1.5" fill="none" />
      </svg>
      <p style={{ color: "#aaa", fontSize: 14, marginTop: 10, fontWeight: 500 }}>
        Aucun enregistrement
      </p>
    </div>
  );
}

/* ── Main component ──────────────────────────────────── */
export default function MembersPage() {
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3>(1);
  const [, navigate] = useLocation();
  const { t }        = useI18n();

  const { data: team, isLoading } = useQuery<TeamDetails>({
    queryKey: ["/api/team/details"],
  });

  const currency = "FCFA";

  const levels = [
    { num: 1 as const, label: "Niveau 1", members: team?.level1 || [] },
    { num: 2 as const, label: "Niveau 2", members: team?.level2 || [] },
    { num: 3 as const, label: "Niveau 3", members: team?.level3 || [] },
  ];

  const members     = levels[activeLevel - 1].members;
  const totalCount  = members.length;
  const activeCount = members.filter(m => m.hasDeposited).length;

  const todayMembers     = members.filter(m => m.createdAt && isToday(m.createdAt));
  const todayCount       = todayMembers.length;
  const todayActiveCount = todayMembers.filter(m => m.hasDeposited).length;

  const totalCommission = members.reduce((s, m) => s + (m.bonusFromMember || 0), 0);
  const todayCommission = todayMembers.reduce((s, m) => s + (m.bonusFromMember || 0), 0);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#fff" }}>

      {/* ══ HEADER ══ */}
      <div
        className="flex items-center px-4 py-3"
        style={{ background: "#fff", borderBottom: "1px solid #f0f0f0" }}
      >
        <button
          onClick={() => navigate("/team")}
          className="w-9 h-9 flex items-center justify-center active:opacity-70"
          data-testid="button-back"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" strokeWidth={2.5} />
        </button>
        <h1
          className="flex-1 text-center font-bold text-base pr-9"
          style={{ color: "#111" }}
        >
          Parrainage Niveau {activeLevel}
        </h1>
      </div>

      {/* ══ NIVEAU TABS ══ */}
      <div className="flex" style={{ background: "#fff", borderBottom: "1px solid #eee" }}>
        {levels.map(lv => (
          <button
            key={lv.num}
            onClick={() => setActiveLevel(lv.num)}
            className="flex-1 py-3 text-center text-sm font-semibold relative transition-colors"
            style={{ color: activeLevel === lv.num ? RED : "#9ca3af" }}
            data-testid={`tab-level-${lv.num}`}
          >
            {lv.label}
            {activeLevel === lv.num && (
              <span
                className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                style={{ background: RED }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ══ STATS CARD ══ */}
      <div className="mx-3 mt-4 rounded-2xl overflow-hidden" style={{ background: GRAY }}>
        {/* En-tête colonnes */}
        <div
          className="grid"
          style={{ gridTemplateColumns: "1fr 1fr 1fr", padding: "12px 16px 8px" }}
        >
          <span />
          <span style={{ fontSize: 12, color: "#666", textAlign: "center", fontStyle: "italic" }}>
            Nb. de filleuls
          </span>
          <span style={{ fontSize: 12, color: "#666", textAlign: "right", fontStyle: "italic" }}>
            Ma Commission
          </span>
        </div>

        {/* Ligne Total */}
        <div
          className="grid"
          style={{ gridTemplateColumns: "1fr 1fr 1fr", padding: "6px 16px 6px", borderTop: "1px solid #e8e8e8" }}
        >
          <span style={{ fontSize: 13, color: "#444", fontStyle: "italic" }}>Total</span>
          <span style={{ fontSize: 13, color: "#111", fontWeight: 600, textAlign: "center" }}>
            {isLoading ? "—" : `${activeCount}/${totalCount}`}
          </span>
          <span style={{ fontSize: 13, color: "#111", fontWeight: 600, textAlign: "right" }}>
            {isLoading ? "—" : `${currency} ${totalCommission.toLocaleString()}`}
          </span>
        </div>

        {/* Ligne Aujourd'hui */}
        <div
          className="grid"
          style={{ gridTemplateColumns: "1fr 1fr 1fr", padding: "6px 16px 14px", borderTop: "1px solid #e8e8e8" }}
        >
          <span style={{ fontSize: 13, color: "#444", fontStyle: "italic" }}>Aujourd'hui</span>
          <span style={{ fontSize: 13, color: "#111", fontWeight: 600, textAlign: "center" }}>
            {isLoading ? "—" : `${todayActiveCount}/${todayCount}`}
          </span>
          <span style={{ fontSize: 13, color: "#111", fontWeight: 600, textAlign: "right" }}>
            {isLoading ? "—" : `${currency} ${todayCommission.toLocaleString()}`}
          </span>
        </div>
      </div>

      {/* ══ EN-TÊTES TABLEAU ══ */}
      <div
        className="flex mx-3 mt-4"
        style={{ borderBottom: "1px solid #e8e8e8", paddingBottom: 8 }}
      >
        {["Date", "Code", "Dépôt total", "Ma Commission"].map((col, i) => (
          <div
            key={i}
            className="flex-1 text-center"
            style={{
              fontSize: 12,
              color: "#999",
              borderRight: i < 3 ? "1px solid #e8e8e8" : "none",
              padding: "0 4px",
              lineHeight: 1.3,
            }}
          >
            {col}
          </div>
        ))}
      </div>

      {/* ══ LISTE FILLEULS ══ */}
      <div className="flex-1 overflow-y-auto pb-20">
        {isLoading ? (
          <div className="space-y-2 mx-3 mt-3">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <EmptyState />
        ) : (
          members.map((member, idx) => (
            <div
              key={member.id}
              className="flex mx-0"
              style={{
                borderBottom: "1px solid #f5f5f5",
                background: idx % 2 === 0 ? "#fff" : "#fafafa",
              }}
              data-testid={`member-row-${member.id}`}
            >
              {/* Date */}
              <div
                className="flex-1 flex items-center justify-center py-3 px-1"
                style={{ borderRight: "1px solid #f0f0f0" }}
              >
                <span style={{ fontSize: 10, color: "#555", textAlign: "center", lineHeight: 1.3 }}>
                  {formatDate(member.createdAt)}
                </span>
              </div>

              {/* Code de parrainage */}
              <div
                className="flex-1 flex items-center justify-center py-3 px-1"
                style={{ borderRight: "1px solid #f0f0f0" }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: RED, textAlign: "center" }}>
                  {member.referralCode || "-"}
                </span>
              </div>

              {/* Dépôt total */}
              <div
                className="flex-1 flex items-center justify-center py-3 px-1"
                style={{ borderRight: "1px solid #f0f0f0" }}
              >
                <span style={{ fontSize: 11, color: "#333", fontWeight: 600, textAlign: "center" }}>
                  {Number(member.totalInvested).toLocaleString()}
                </span>
              </div>

              {/* Ma commission */}
              <div className="flex-1 flex items-center justify-center py-3 px-1">
                <span style={{ fontSize: 11, fontWeight: 700, color: RED, textAlign: "center" }}>
                  {Number(member.bonusFromMember || 0).toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
