import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { SiTelegram } from "react-icons/si";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

import heroImg from "@assets/xpeng-gift-charging.jpg";

const RED = "#E8192C";

export default function GiftCodePage() {
  const { refreshUser } = useAuth();
  const { toast }       = useToast();
  const { t }           = useI18n();
  const [code, setCode] = useState("");

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const groupLink = settings?.groupLink || "https://t.me/vestasgroup";

  const claimMutation = useMutation({
    mutationFn: async (giftCode: string) => {
      const res = await apiRequest("POST", "/api/gift-codes/claim", { code: giftCode });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || t.errorOccurred);
      }
      return res.json();
    },
    onSuccess: (data) => {
      refreshUser();
      setCode("");
      toast({ title: "🎉 " + t.purchaseSuccess, description: data.message });
    },
    onError: (e: any) => {
      toast({ title: t.errorOccurred, description: e.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!code.trim()) {
      toast({ title: t.errorOccurred, description: t.requiredFields, variant: "destructive" });
      return;
    }
    claimMutation.mutate(code.trim());
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#f2f2f2" }}>

      {/* ══ HEADER ══ */}
      <div className="flex items-center px-4 py-3 bg-white">
        <Link href="/account">
          <button
            className="w-9 h-9 flex items-center justify-center active:opacity-70"
            data-testid="button-back"
          >
            <ChevronLeft className="w-6 h-6 text-gray-800" strokeWidth={2.5} />
          </button>
        </Link>
        <h1
          className="flex-1 text-center font-semibold text-base pr-9"
          style={{ color: RED }}
        >
          Échanger un cadeau
        </h1>
      </div>

      {/* ══ IMAGE HERO ══ */}
      <div style={{ width: "100%", height: 220, overflow: "hidden" }}>
        <img
          src={heroImg}
          alt="XPENG charging"
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
          data-testid="img-gift-banner"
        />
      </div>

      {/* ══ DESCRIPTION ══ */}
      <p style={{ fontSize: 13, color: "#555", padding: "14px 16px 10px", lineHeight: 1.5 }}>
        Vous pouvez obtenir un code cadeau dans le groupe
      </p>

      {/* ══ BOUTON TELEGRAM ══ */}
      <button
        onClick={() => window.open(groupLink, "_blank")}
        className="flex items-center gap-3 active:opacity-70 transition-opacity"
        style={{
          background: "#fff",
          border: "none",
          padding: "14px 16px",
          width: "100%",
          cursor: "pointer",
          borderTop: "1px solid #efefef",
          borderBottom: "1px solid #efefef",
        }}
      >
        {/* Icône Telegram */}
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            background: "#0088cc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <SiTelegram style={{ width: 22, height: 22, color: "#fff" }} />
        </div>

        {/* Label */}
        <span style={{ flex: 1, textAlign: "left", fontSize: 15, fontWeight: 500, color: "#111" }}>
          Groupes Telegram
        </span>

        <ChevronRight style={{ width: 18, height: 18, color: "#bbb", flexShrink: 0 }} />
      </button>

      {/* ══ SECTION CODE CADEAU ══ */}
      <div style={{ padding: "20px 16px 0" }}>
        {/* Label */}
        <p style={{ fontSize: 15, fontWeight: 600, color: "#111", marginBottom: 10 }}>
          <span style={{ color: RED }}>* </span>Code cadeau
        </p>

        {/* Input */}
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="Veuillez saisir le code cadeau"
          className="w-full outline-none"
          style={{
            background: "#e8e8e8",
            border: "none",
            borderRadius: 6,
            height: 50,
            padding: "0 16px",
            fontSize: 14,
            color: "#333",
            caretColor: RED,
          }}
          data-testid="input-gift-code"
        />
      </div>

      {/* ══ BOUTON CONFIRMER ══ */}
      <div style={{ padding: "28px 32px 0" }}>
        <button
          onClick={handleSubmit}
          disabled={claimMutation.isPending}
          className="w-full font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
          style={{
            height: 52,
            borderRadius: 999,
            background: RED,
            border: "none",
            fontSize: 17,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(232,25,44,0.35)",
          }}
          data-testid="button-submit-code"
        >
          {claimMutation.isPending
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : "Confirmer"
          }
        </button>
      </div>

    </div>
  );
}
