import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useMutation } from "@tanstack/react-query";
import { ChevronLeft, Loader2, Gift, Tag } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { getContent } from "@/lib/content";
import { useI18n } from "@/lib/i18n";

import vipBadgeImg from "@assets/0_1001899520_1785147624494.png";

export default function GiftCodePage() {
  const { refreshUser } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [code, setCode] = useState("");

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const headerTitle = getContent(settings, "content_giftcode_headerTitle", "Bonus Code");
  const infoLine1 = getContent(settings, "content_giftcode_infoLine1", "Enter your bonus code to receive your reward instantly");
  const infoLine2 = getContent(settings, "content_giftcode_infoLine2", "Codes are available every evening at 5pm GMT");
  const howToTitle = getContent(settings, "content_giftcode_howToTitle", "How to get codes?");
  const step1 = getContent(settings, "content_giftcode_step1", "Join our official Telegram channel");
  const step2 = getContent(settings, "content_giftcode_step2", "Follow announcements every evening at 5pm GMT");
  const step3 = getContent(settings, "content_giftcode_step3", "Copy the code and paste it here before it expires");

  const claimMutation = useMutation({
    mutationFn: async (giftCode: string) => {
      const response = await apiRequest("POST", "/api/gift-codes/claim", { code: giftCode });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || t.errorOccurred);
      }
      return response.json();
    },
    onSuccess: (data) => {
      refreshUser();
      setCode("");
      toast({
        title: "🎉 " + t.purchaseSuccess,
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: t.errorOccurred,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!code.trim()) {
      toast({
        title: t.errorOccurred,
        description: t.requiredFields,
        variant: "destructive",
      });
      return;
    }
    claimMutation.mutate(code.trim());
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#000000" }}>

      {/* Hero image with red overlay + header */}
      <div className="relative">
        <img
          src="/gift-banner.png"
          alt="ASUS"
          className="w-full h-36 object-contain"
          style={{ background: "linear-gradient(135deg, #000000, #000000)" }}
          data-testid="img-gift-banner"
        />
        {/* Red gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0.70) 100%)" }}
        />

        {/* Header over image */}
        <div className="absolute top-0 left-0 right-0 flex items-center px-4 py-3">
          <Link href="/account">
            <button className="p-1.5 rounded-full bg-white/20" data-testid="button-back">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          </Link>
          <h1 className="flex-1 text-center text-base font-bold text-white pr-8">
            {headerTitle}
          </h1>
        </div>

        {/* Icon badge */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full flex items-center justify-center shadow-xl border-2 border-white/60 overflow-hidden"
          style={{ background: "#000" }}>
          <img src={vipBadgeImg} alt="VIP" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-10 pb-24 space-y-4">

        {/* Info card */}
        <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
          <p className="text-gray-700 text-sm font-medium">
            {infoLine1}
          </p>
        </div>

        {/* Input card */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Tag className="w-4 h-4" style={{ color: "#E8192C" }} />
            <span className="text-gray-800 font-semibold text-sm">{t.giftCodeLabel}</span>
          </div>

          <div className="flex items-center overflow-hidden bg-white" style={{ height: 54, borderRadius: 999, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
            <div className="pl-4 pr-3 flex items-center shrink-0">
              <Tag className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={t.giftCodeInputPlaceholder}
              className="flex-1 h-full bg-transparent text-center text-sm font-mono tracking-widest outline-none pr-4"
              style={{ color: "#1f2937" }}
              data-testid="input-gift-code"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={claimMutation.isPending}
            className="w-full font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{
              height: 54, borderRadius: 999,
              background: "linear-gradient(135deg, #ff416c 0%, #ff8c00 40%, #ffd700 70%, #ff8c00 85%, #ff416c 100%)",
              color: "#fff",
              boxShadow: "0 4px 20px rgba(255,140,0,0.5), 0 2px 8px rgba(255,65,108,0.4)",
              border: "1.5px solid rgba(255,255,255,0.35)",
              textShadow: "0 1px 3px rgba(0,0,0,0.3)",
            }}
            data-testid="button-submit-code"
          >
            {claimMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Gift className="w-5 h-5" />
                {t.giftCodeReceiveBtn}
              </>
            )}
          </button>
        </div>

        {/* How to get codes */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-gray-800 font-semibold text-sm mb-2">{howToTitle}</p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-white text-[10px] font-bold"
                style={{ backgroundColor: "#E8192C" }}>1</div>
              <p className="text-gray-500 text-xs">{step1}</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-white text-[10px] font-bold"
                style={{ backgroundColor: "#E8192C" }}>2</div>
              <p className="text-gray-500 text-xs">{step2}</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-white text-[10px] font-bold"
                style={{ backgroundColor: "#E8192C" }}>3</div>
              <p className="text-gray-500 text-xs">{step3}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
