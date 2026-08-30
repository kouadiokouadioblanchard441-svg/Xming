import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { FALLBACK_COUNTRIES, getPhoneLength } from "@/lib/countries";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ChevronLeft, ChevronRight, Trash2, CreditCard, Check, Shield, Loader2
} from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import type { WithdrawalWallet } from "@shared/schema";
import { useI18n } from "@/lib/i18n";



// Thème de carte selon l'opérateur
function cardTheme(paymentMethod: string): { bg: string; shine: string; logo: string } {
  const m = (paymentMethod || "").toLowerCase();
  if (m.includes("wave"))
    return { bg: "linear-gradient(135deg, #0061a8 0%, #003f7a 100%)", shine: "rgba(255,255,255,0.18)", logo: "🌊" };
  if (m.includes("mtn"))
    return { bg: "linear-gradient(135deg, #f5a800 0%, #c97f00 100%)", shine: "rgba(255,255,255,0.22)", logo: "🟡" };
  if (m.includes("orange"))
    return { bg: "linear-gradient(135deg, #f55a00 0%, #b03d00 100%)", shine: "rgba(255,255,255,0.18)", logo: "🟠" };
  if (m.includes("moov"))
    return { bg: "linear-gradient(135deg, #0099cc 0%, #006699 100%)", shine: "rgba(255,255,255,0.18)", logo: "🔵" };
  if (m.includes("telecel"))
    return { bg: "linear-gradient(135deg, #8b2fc9 0%, #5b1a8a 100%)", shine: "rgba(255,255,255,0.16)", logo: "🟣" };
  // défaut olive
  return { bg: "linear-gradient(135deg, #1a1a1a 0%, #000000 100%)", shine: "rgba(255,255,255,0.12)", logo: "💳" };
}

export default function WalletPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const selectMode = params.get("from") === "withdrawal";

  // List vs Add form mode
  const [showForm, setShowForm] = useState(false);

  // Add form state
  const [selectedOperator, setSelectedOperator] = useState<string>("");
  const [holderName, setHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [showBankSheet, setShowBankSheet] = useState(false);

  const { data: wallets = [], isLoading } = useQuery<WithdrawalWallet[]>({
    queryKey: ["/api/wallets"],
  });

  // Opérateurs Mobile Money selon le pays de l'utilisateur
  const userCountryCode = user?.country || "CI";
  const { data: countryOperators = [] } = useQuery<string[]>({
    queryKey: [`/api/countries/${userCountryCode}/operators`],
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/wallets", {
        accountName: holderName,
        accountNumber: accountNumber,
        paymentMethod: selectedOperator,
        country: user!.country,
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Erreur");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      toast({ title: "Compte lié avec succès" });
      setShowForm(false);
      setSelectedOperator("");
      setHolderName("");
      setAccountNumber("");
    },
    onError: (error: any) => {
      toast({ title: error.message || t.errorOccurred, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (walletId: number) => {
      const response = await apiRequest("DELETE", `/api/wallets/${walletId}`, {});
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Erreur");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      toast({ title: t.walletDeleted });
    },
    onError: (error: any) => {
      toast({ title: error.message || t.errorOccurred, variant: "destructive" });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (walletId: number) => {
      const response = await apiRequest("PATCH", `/api/wallets/${walletId}/default`, {});
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Erreur");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
    },
    onError: (error: any) => {
      toast({ title: error.message || t.errorOccurred, variant: "destructive" });
    },
  });

  const handleSelectWallet = (wallet: WithdrawalWallet) => {
    if (selectMode) {
      localStorage.setItem("selectedWalletId", wallet.id.toString());
      navigate("/withdrawal");
    }
  };

  const countryInfo = FALLBACK_COUNTRIES.find(c => c.code === userCountryCode);
  const phonePrefix = countryInfo?.phonePrefix || "225";
  const requiredPhoneLength = getPhoneLength(userCountryCode);

  const handleConfirm = () => {
    if (!selectedOperator) {
      toast({ title: "Sélectionnez une banque", variant: "destructive" }); return;
    }
    if (!holderName.trim()) {
      toast({ title: "Saisissez le nom du titulaire", variant: "destructive" }); return;
    }
    const digits = accountNumber.replace(/\D/g, "");
    if (!digits) {
      toast({ title: "Saisissez le numéro de compte", variant: "destructive" }); return;
    }
    if (digits.length !== requiredPhoneLength) {
      toast({ title: `Numéro invalide`, description: `Le numéro doit contenir exactement ${requiredPhoneLength} chiffres`, variant: "destructive" }); return;
    }
    addMutation.mutate();
  };

  if (!user) return null;

  const backLink = selectMode ? "/withdrawal" : "/account";

  /* ══════════════════════════════════════════
     ADD FORM VIEW — "Lier un compte bancaire"
  ══════════════════════════════════════════ */
  if (showForm) {
    return (
      <div className="flex flex-col min-h-screen bg-white relative">

        {/* Header */}
        <header
          className="flex items-center px-4 py-4"
          style={{ background: "linear-gradient(135deg, #E8192C 0%, #a01020 100%)" }}
        >
          <button
            onClick={() => { setShowForm(false); setSelectedOperator(""); setHolderName(""); setAccountNumber(""); }}
            className="p-1"
            data-testid="button-back-form"
          >
            <ChevronLeft className="w-6 h-6 text-white" strokeWidth={2.5} />
          </button>
          <h1 className="flex-1 text-center text-white font-bold text-base pr-8">
            Lier un compte bancaire
          </h1>
        </header>

        {/* Form rows */}
        <div className="bg-white">

          {/* Row 1 — Sélectionner une banque */}
          <button
            onClick={() => setShowBankSheet(true)}
            className="w-full flex flex-col px-4 pt-5 pb-4 border-b border-gray-200 active:bg-gray-50 text-left"
            data-testid="button-select-bank"
          >
            <p className="text-sm font-bold text-gray-900 mb-1">
              <span className="text-red-500 mr-1">*</span>Sélectionner une banque
            </p>
            <div className="flex items-center justify-between w-full">
              <span className={`text-sm ${selectedOperator ? "text-gray-900 font-semibold" : "text-gray-400"}`}>
                {selectedOperator || "Veuillez sélectionner"}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </button>

          {/* Row 2 — Nom du titulaire */}
          <div className="flex flex-col px-4 pt-5 pb-4 border-b border-gray-200">
            <p className="text-sm font-bold text-gray-900 mb-1">
              <span className="text-red-500 mr-1">*</span>Nom du titulaire du compte
            </p>
            <input
              type="text"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              placeholder="Veuillez saisir le nom du titulaire"
              className="w-full text-sm text-gray-700 outline-none placeholder:text-gray-400 bg-transparent"
              data-testid="input-wallet-name"
            />
          </div>

          {/* Row 3 — Compte bancaire */}
          <div className="flex flex-col px-4 pt-5 pb-4 border-b border-gray-200">
            <p className="text-sm font-bold text-gray-900 mb-1">
              <span className="text-red-500 mr-1">*</span>Numéro Mobile Money
            </p>
            <div className="flex items-center gap-2">
              {/* Indicatif pays (non modifiable, basé sur le pays d'inscription) */}
              <span
                className="text-sm font-bold shrink-0 px-2 py-1 rounded"
                style={{ background: "#f3f4f6", color: "#374151" }}
              >
                +{phonePrefix}
              </span>
              <input
                type="tel"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                placeholder={`${requiredPhoneLength} chiffres`}
                maxLength={requiredPhoneLength}
                className="flex-1 text-sm text-gray-700 outline-none placeholder:text-gray-400 bg-transparent"
                data-testid="input-wallet-number"
              />
            </div>
            <p className="text-gray-400 text-xs mt-1">{requiredPhoneLength} chiffres requis</p>
          </div>
        </div>

        {/* Bouton Confirmer centré */}
        <div className="px-6 py-6 flex justify-center">
          <button
            onClick={handleConfirm}
            disabled={addMutation.isPending}
            className="font-bold text-base text-white disabled:opacity-50 active:scale-95 transition-transform"
            style={{
              width: "72%",
              height: 54,
              borderRadius: 999,
              background: "linear-gradient(135deg, #E8192C, #a01020)",
              boxShadow: "0 4px 16px rgba(232,25,44,0.35)",
            }}
            data-testid="button-confirm-wallet"
          >
            {addMutation.isPending
              ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Traitement…</span>
              : "Confirmer"}
          </button>
        </div>

        {/* Bank bottom sheet */}
        {showBankSheet && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setShowBankSheet(false)}
            />
            {/* Sheet */}
            <div
              className="fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-2xl overflow-hidden"
              style={{ maxHeight: "60vh" }}
            >
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-2" />
              <div className="overflow-y-auto" style={{ maxHeight: "calc(60vh - 32px)" }}>
                {countryOperators.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400 text-sm">Aucun opérateur disponible</p>
                  </div>
                ) : (
                  countryOperators.map((op, idx) => (
                    <button
                      key={op}
                      onClick={() => {
                        setSelectedOperator(op);
                        setShowBankSheet(false);
                      }}
                      className="w-full text-center py-4 text-sm text-gray-800 active:bg-gray-50 transition"
                      style={{ borderBottom: idx < countryOperators.length - 1 ? "1px solid #f3f4f6" : undefined }}
                      data-testid={`button-operator-${idx}`}
                    >
                      {op}
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  /* ══════════════════════════════════════════
     LIST VIEW
  ══════════════════════════════════════════ */
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#f5f5f5" }}>

      {/* Header — dégradé rouge plateforme */}
      <header
        className="flex items-center px-4 py-4"
        style={{ background: "linear-gradient(135deg, #E8192C 0%, #a01020 100%)" }}
      >
        <Link href={backLink}>
          <button className="p-1" data-testid="button-back">
            <ChevronLeft className="w-6 h-6 text-white" strokeWidth={2.5} />
          </button>
        </Link>
        <h1 className="flex-1 text-center text-white font-bold text-base pr-8">
          {selectMode ? "Sélectionner un compte" : "Mes comptes de retrait"}
        </h1>
      </header>

      <div className="px-4 pt-4 pb-10">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#E8192C" }} />
          </div>
        ) : wallets && wallets.length > 0 ? (
          <div className="space-y-3">
            {wallets.map((wallet) => {
              const theme = cardTheme(wallet.paymentMethod || "");
              return (
              <div
                key={wallet.id}
                onClick={() => selectMode && handleSelectWallet(wallet)}
                className={`rounded-2xl overflow-hidden ${selectMode ? "cursor-pointer active:opacity-90" : ""}`}
                style={{
                  background: theme.bg,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                }}
                data-testid={`wallet-card-${wallet.id}`}
              >
                <div className="p-5 relative">
                  {/* Shine */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: `linear-gradient(120deg, ${theme.shine} 0%, transparent 60%)` }}
                  />

                  {/* Top row */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-white/60 text-xs mb-0.5">{wallet.paymentMethod}</p>
                      <p className="text-white font-bold text-sm">{wallet.accountName}</p>
                    </div>
                    {!selectMode && (
                      <div className="flex items-center gap-2">
                        {!wallet.isDefault && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setDefaultMutation.mutate(wallet.id); }}
                            disabled={setDefaultMutation.isPending}
                            className="p-1.5 rounded-full bg-white/20"
                            data-testid={`button-set-default-${wallet.id}`}
                          >
                            <Check className="w-3.5 h-3.5 text-white" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(wallet.id); }}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 rounded-full bg-white/20"
                          data-testid={`button-delete-wallet-${wallet.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Account number */}
                  <p className="text-white font-mono text-base tracking-widest mb-2">
                    {wallet.accountNumber}
                  </p>

                  {wallet.isDefault && (
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-white/60" />
                      <span className="text-white/60 text-xs">{t.walletDefault}</span>
                    </div>
                  )}
                </div>
              </div>
              );
            })}

            {!selectMode && (
              <button
                onClick={() => setShowForm(true)}
                className="w-full py-4 rounded-2xl text-white font-bold text-sm active:opacity-80 transition mt-2"
                style={{ background: "linear-gradient(135deg, #E8192C, #a01020)", boxShadow: "0 4px 14px rgba(232,25,44,0.35)" }}
                data-testid="button-add-wallet"
              >
                + Lier un nouveau compte
              </button>
            )}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #E8192C22, #E8192C44)" }}
            >
              <CreditCard className="w-10 h-10" style={{ color: "#E8192C" }} />
            </div>
            <p className="text-gray-500 text-sm text-center font-medium">Aucun compte de retrait lié</p>
            <p className="text-gray-400 text-xs text-center">Ajoutez un compte Mobile Money pour retirer vos gains</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 px-10 py-3 rounded-full text-white font-bold text-sm active:scale-95 transition"
              style={{ background: "linear-gradient(135deg, #E8192C, #a01020)", boxShadow: "0 4px 14px rgba(232,25,44,0.35)" }}
              data-testid="button-add-wallet"
            >
              Lier un compte bancaire
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
