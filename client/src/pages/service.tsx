import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import {
  SiTelegram,
  SiWhatsapp,
  SiFacebook,
  SiInstagram,
  SiTiktok,
  SiYoutube,
} from "react-icons/si";

import heroImg from "@assets/pngtree-office-people-teamwork-image_2245594_1785053207927.jpg";
import { getContent } from "@/lib/content";
import { useI18n } from "@/lib/i18n";

interface LinksSettings {
  supportLink: string;
  support2Link: string;
  channelLink: string;
  groupLink: string;
  supportType: string;
  support2Type: string;
  channelType: string;
  groupType: string;
  supportLabel: string;
  support2Label: string;
  channelLabel: string;
  groupLabel: string;
  supportEnabled: string;
  support2Enabled: string;
  channelEnabled: string;
  groupEnabled: string;
  withdrawalStartHour: string;
  withdrawalEndHour: string;
}

type NetworkType = "telegram" | "whatsapp" | "facebook" | "instagram" | "tiktok" | "youtube";

const NETWORK_CONFIG: Record<NetworkType, { Icon: React.ElementType; color: string; bg: string }> = {
  telegram:  { Icon: SiTelegram,  color: "#ffffff", bg: "#229ED9" },
  whatsapp:  { Icon: SiWhatsapp,  color: "#ffffff", bg: "#25D366" },
  facebook:  { Icon: SiFacebook,  color: "#ffffff", bg: "#1877F2" },
  instagram: { Icon: SiInstagram, color: "#ffffff", bg: "#E1306C" },
  tiktok:    { Icon: SiTiktok,    color: "#ffffff", bg: "#010101" },
  youtube:   { Icon: SiYoutube,   color: "#ffffff", bg: "#FF0000" },
};

function NetworkIcon({ type }: { type: string }) {
  const cfg = NETWORK_CONFIG[(type as NetworkType)] || NETWORK_CONFIG.telegram;
  const { Icon, color, bg } = cfg;
  return (
    <div
      className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: bg }}
    >
      <Icon style={{ color, width: 22, height: 22 }} />
    </div>
  );
}

function LinkRow({
  label,
  type,
  href,
  testId,
}: {
  label: string;
  type: string;
  href: string;
  testId: string;
}) {
  return (
    <button
      onClick={() => window.open(href, "_blank")}
      className="w-full flex items-center gap-3 px-4 py-3.5"
      data-testid={testId}
    >
      <NetworkIcon type={type} />
      <span className="flex-1 text-left text-sm font-bold text-gray-900 tracking-wide">{label}</span>
      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
    </button>
  );
}

export default function ServicePage() {
  const { t } = useI18n();
  const { data: settings } = useQuery<LinksSettings>({
    queryKey: ["/api/settings/links"],
  });

  const { data: allSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const servicePageTitle = getContent(allSettings, "content_service_pageTitle", t.customerService);
  const serviceWithdrawalHoursText = getContent(allSettings, "content_service_withdrawalHoursText", "");
  const serviceSupportHoursLabel = getContent(allSettings, "content_service_supportHoursLabel", t.customerService);

  const startHour = parseInt(settings?.withdrawalStartHour || "9", 10);
  const endHour = parseInt(settings?.withdrawalEndHour || "17", 10);
  const hoursDisplay = `${String(startHour).padStart(2, "0")}:00 - ${String(endHour).padStart(2, "0")}:00`;

  const allLinks = [
    {
      label: settings?.supportLabel || t.serviceCustomerServiceFallback,
      type: settings?.supportType || "telegram",
      href: settings?.supportLink || "https://t.me/vestasgroup",
      testId: "button-support-link",
      enabled: settings?.supportEnabled !== "false",
    },
    {
      label: settings?.support2Label || t.serviceCustomerService2Fallback,
      type: settings?.support2Type || "telegram",
      href: settings?.support2Link || "https://t.me/vestasgroup",
      testId: "button-support2-link",
      enabled: settings?.support2Enabled !== "false",
    },
    {
      label: settings?.channelLabel || t.serviceOfficialChannelFallback,
      type: settings?.channelType || "telegram",
      href: settings?.channelLink || "https://t.me/vestasgroup",
      testId: "button-channel-link",
      enabled: settings?.channelEnabled !== "false",
    },
    {
      label: settings?.groupLabel || t.serviceDiscussionGroupFallback,
      type: settings?.groupType || "telegram",
      href: settings?.groupLink || "https://t.me/vestasgroup",
      testId: "button-group-link",
      enabled: settings?.groupEnabled !== "false",
    },
  ];
  const links = allLinks.filter(l => l.enabled);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#000000" }}>

      {/* ── Header ── */}
      <div className="flex items-center bg-white px-4 py-3 shadow-sm">
        <Link href="/account">
          <button className="w-9 h-9 flex items-center justify-center" data-testid="button-back">
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
        </Link>
        <h1 className="flex-1 text-center text-gray-900 font-semibold text-base mr-9">
          {servicePageTitle}
        </h1>
      </div>

      {/* ── Hero Image ── */}
      <div className="w-full bg-white flex items-center justify-center" style={{ height: 160 }}>
        <img
          src={heroImg}
          alt={t.serviceTitle}
          className="h-full object-contain"
          data-testid="img-service-hero"
        />
      </div>

      {/* ── Links Card ── */}
      <div className="mx-3 mt-3">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {links.map((link, idx) => (
            <div key={link.testId}>
              <LinkRow
                label={link.label}
                type={link.type}
                href={link.href}
                testId={link.testId}
              />
              {idx < links.length - 1 && (
                <div className="h-px bg-gray-100 mx-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Hours Card ── */}
      <div className="mx-3 mt-3 pb-24">
        <div className="bg-white rounded-2xl shadow-sm px-6 py-5 text-center">
          <p className="text-2xl font-black text-gray-900 tracking-wide">24h/24h</p>
          <p className="text-xs text-gray-400 mt-2">{serviceSupportHoursLabel}</p>
        </div>
      </div>

    </div>
  );
}
