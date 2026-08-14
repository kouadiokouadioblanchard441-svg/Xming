import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, Eye, EyeOff, ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";

const RED = "#E8192C";

export default function ChangePasswordPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent,     setShowCurrent]     = useState(false);
  const [showNew,         setShowNew]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest("POST", "/api/change-password", data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || t.errorOccurred);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t.passwordSuccess, description: t.passwordSuccessDesc });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      navigate("/account");
    },
    onError: (e: Error) => toast({ title: e.message || t.errorOccurred, variant: "destructive" }),
  });

  const handleSubmit = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: t.requiredFields, description: t.fillAllFields, variant: "destructive" }); return;
    }
    if (newPassword.length < 6) {
      toast({ title: t.passwordTooShort, description: t.minSixCharsRequired, variant: "destructive" }); return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: t.errPasswordMismatch, variant: "destructive" }); return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const fields = [
    {
      placeholder: "Mot de passe actuel",
      value: currentPassword,
      onChange: setCurrentPassword,
      show: showCurrent,
      toggleShow: () => setShowCurrent(v => !v),
      testId: "input-current-password",
    },
    {
      placeholder: "Nouveau mot de passe",
      value: newPassword,
      onChange: setNewPassword,
      show: showNew,
      toggleShow: () => setShowNew(v => !v),
      testId: "input-new-password",
    },
    {
      placeholder: "Confirmer le nouveau mot de passe",
      value: confirmPassword,
      onChange: setConfirmPassword,
      show: showConfirm,
      toggleShow: () => setShowConfirm(v => !v),
      testId: "input-confirm-password",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#efefef" }}>

      {/* ══ HEADER rouge ══ */}
      <header
        className="flex items-center px-4 py-4"
        style={{ background: RED }}
      >
        <button
          onClick={() => navigate("/account")}
          className="w-9 h-9 flex items-center justify-center active:opacity-70"
          data-testid="button-back"
        >
          <ChevronLeft className="w-6 h-6 text-white" strokeWidth={2.5} />
        </button>
        <h1 className="flex-1 text-center text-white font-semibold text-base pr-9">
          Modifier le mot de passe
        </h1>
      </header>

      {/* ══ CARTE FORMULAIRE ══ */}
      <div className="mx-4 mt-5">
        <div
          className="bg-white rounded-2xl overflow-hidden"
          style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}
        >
          {fields.map((field, i) => (
            <div key={i}>
              {/* Séparateur */}
              {i > 0 && <div style={{ height: 1, background: "#f0f0f0", marginLeft: 48 }} />}

              {/* Ligne champ */}
              <div className="flex items-center px-4" style={{ height: 58 }}>
                {/* Icône cadenas */}
                <Lock
                  style={{ width: 18, height: 18, color: "#9ca3af", flexShrink: 0, marginRight: 12 }}
                />

                {/* Input */}
                <input
                  type={field.show ? "text" : "password"}
                  value={field.value}
                  onChange={e => field.onChange(e.target.value)}
                  placeholder={field.placeholder}
                  className="flex-1 outline-none bg-transparent text-sm"
                  style={{ color: "#333", caretColor: RED }}
                  data-testid={field.testId}
                />

                {/* Œil */}
                <button
                  type="button"
                  onClick={field.toggleShow}
                  className="pl-2 flex items-center active:opacity-60"
                >
                  {field.show
                    ? <EyeOff style={{ width: 18, height: 18, color: "#9ca3af" }} />
                    : <Eye    style={{ width: 18, height: 18, color: "#9ca3af" }} />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ BOUTON CONFIRMER ══ */}
      <div className="px-6 mt-8">
        <button
          onClick={handleSubmit}
          disabled={changePasswordMutation.isPending}
          className="w-full font-bold text-white text-lg disabled:opacity-50 active:scale-95 transition-transform"
          style={{
            background: RED,
            borderRadius: 999,
            height: 56,
            boxShadow: "0 4px 14px rgba(232,25,44,0.35)",
          }}
          data-testid="button-change-password-submit"
        >
          {changePasswordMutation.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              {t.processing}
            </span>
          ) : (
            "Confirmer"
          )}
        </button>
      </div>

    </div>
  );
}
