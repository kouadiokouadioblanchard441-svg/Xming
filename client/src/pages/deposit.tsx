import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, CheckCircle2, Loader2, ClipboardList, Copy, ExternalLink } from "lucide-react";
import { Link, useSearch } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { RDC_COUNTRY, SUPPORTED_COUNTRY_CODE } from "@shared/country-config";

const CURRENCY = RDC_COUNTRY.currency;

// amount → operator → combined payer/transaction details → pending confirmation
type Step = "amount" | "operator" | "phone" | "info" | "done";

interface PaymentNumber {
  id: number;
  ownerName: string;
  phone: string;
  operatorName: string;
  country: string;
  channelId?: number | null;
  logoUrl?: string;
  isActive: boolean;
}

interface DepositChannel {
  id: number;
  name: string;
  description?: string | null;
  country: string;
  isActive: boolean;
  sortOrder: number;
}

interface CountryConfig {
  code: string;
  autoPaymentEnabled?: boolean;
}

/* ── Stepper ─────────────────────────────────────────────────────── */
function Stepper({ active }: { active: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Numéro de\ntéléphone" },
    { n: 2, label: "Informations de\nconfirmation" },
    { n: 3, label: "Paiement terminé" },
  ] as const;

  return (
    <div className="flex items-start mb-6">
      {steps.map((s, i) => (
        <div key={s.n} className="flex-1 flex flex-col items-center">
          <div className="flex items-center w-full">
            {i > 0 && (
              <div
                className="flex-1 h-px"
                style={{ background: active >= s.n ? "#3B82F6" : "#D1D5DB" }}
              />
            )}
            <div
              className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0"
              style={{
                borderColor: active >= s.n ? "#3B82F6" : "#D1D5DB",
                color: active >= s.n ? "#3B82F6" : "#9CA3AF",
                background: "white",
              }}
            >
              {s.n}
            </div>
            {i < steps.length - 1 && (
              <div
                className="flex-1 h-px"
                style={{ background: active > s.n ? "#3B82F6" : "#D1D5DB" }}
              />
            )}
          </div>
          <p
            className="text-center mt-1 leading-tight whitespace-pre-line"
            style={{
              color: active >= s.n ? "#3B82F6" : "#9CA3AF",
              fontSize: 10,
            }}
          >
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ── Main ──────────────────────────────────────────────────────────── */
export default function DepositPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── WestPay return-URL detection ──────────────────────────────────
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const wpDepositId  = searchParams.get("wp_deposit");
  const wpReturn     = searchParams.get("wp_return");
  const wpStatus     = searchParams.get("status"); // success | failure

  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState<number | "">("");
  // WestPay state
  const [wpPending, setWpPending] = useState(false);
  const [wpDepositIdState, setWpDepositIdState] = useState<number | null>(
    wpDepositId ? Number(wpDepositId) : null,
  );
  const [wpPollingDone, setWpPollingDone] = useState(false);
  // selectedDepositChannel = the RDC deposit channel chosen in step 1
  const [selectedDepositChannel, setSelectedDepositChannel] = useState<DepositChannel | null>(null);
  // selectedChannel = the supported RDC Mobile Money operator chosen in step 2
  const [selectedChannel, setSelectedChannel] = useState<PaymentNumber | null>(null);
  const [senderPhone, setSenderPhone] = useState("");
  const [transactionId, setTransactionId] = useState("");

  const { data: platformSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const { data: countryConfigs = [], isLoading: isCountriesLoading } = useQuery<CountryConfig[]>({
    queryKey: ["/api/countries"],
    enabled: !!user,
  });
  const currentCountry = countryConfigs.find(
    country => country.code === SUPPORTED_COUNTRY_CODE
  );
  const isAutomaticDeposit = currentCountry?.autoPaymentEnabled === true;
  const showManualDepositChannels = !isCountriesLoading && !isAutomaticDeposit;

  // Deposit channels are served only for the supported RDC country.
  const { data: depositChannels = [] } = useQuery<DepositChannel[]>({
    queryKey: ["/api/deposit-channels", SUPPORTED_COUNTRY_CODE],
    queryFn: async () => {
      const res = await fetch(
        `/api/deposit-channels?country=${SUPPORTED_COUNTRY_CODE}`,
        { credentials: "include" }
      );
      return res.json();
    },
    enabled: !!user && showManualDepositChannels,
  });

  // Operators within the selected deposit channel
  const { data: channelOperators = [] } = useQuery<PaymentNumber[]>({
    queryKey: [`/api/deposit-channels/${selectedDepositChannel?.id}/operators`],
    queryFn: async () => {
      const res = await fetch(
        `/api/deposit-channels/${selectedDepositChannel!.id}/operators`,
        { credentials: "include" }
      );
      return res.json();
    },
    enabled: !!selectedDepositChannel && showManualDepositChannels,
  });

  // Legacy payment numbers (fallback if no channels configured)
  const { data: paymentNumbersRaw = [] } = useQuery<PaymentNumber[]>({
    queryKey: ["/api/payment-numbers"],
    enabled: !!user && showManualDepositChannels,
  });
  const fallbackOperators = paymentNumbersRaw.filter(
    (n) => n.isActive && n.country === SUPPORTED_COUNTRY_CODE
  );

  // Are channels configured for this country?
  const hasChannels = showManualDepositChannels && depositChannels.length > 0;

  const minDeposit = parseInt(platformSettings?.minDeposit || "20000", 10);
  const presetAmounts = useMemo(
    () =>
      (
        platformSettings?.depositPresetAmounts ||
        "20000,45000,75000,100000,245000,500000,1000000"
      )
        .split(",")
        .map((v) => parseInt(v.trim(), 10))
        .filter((v) => Number.isFinite(v) && v > 0),
    [platformSettings?.depositPresetAmounts]
  );

  // Operators shown on step 2: channel-specific or global fallback
  const operators = hasChannels ? channelOperators : fallbackOperators;

  // Country phone prefix
  const countryPrefix = RDC_COUNTRY.phonePrefix;

  // ── WestPay: initiate & poll ──────────────────────────────────────
  const westpayMutation = useMutation({
    mutationFn: async (payload: { amount: number; channelId?: number }) => {
      const res = await apiRequest("POST", "/api/deposits/westpay/initiate", payload);
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || "Erreur"); }
      return res.json() as Promise<{ depositId: number; payUrl: string }>;
    },
    onSuccess: ({ depositId, payUrl }) => {
      setWpDepositIdState(depositId);
      window.location.href = payUrl; // redirect to WestPay hosted page
    },
    onError: (e: Error) => toast({ title: "Erreur WestPay", description: e.message, variant: "destructive" }),
  });

  // Poll deposit status when user returns from WestPay
  useEffect(() => {
    if (!wpReturn || !wpDepositIdState || wpPollingDone) return;
    let tries = 0;
    const poll = setInterval(async () => {
      tries++;
      try {
        const res = await fetch(`/api/deposits/${wpDepositIdState}/verify`, { credentials: "include" });
        const data = await res.json();
        if (data.status === "approved") {
          clearInterval(poll);
          setWpPollingDone(true);
          setStep("done");
          queryClient.invalidateQueries({ queryKey: ["/api/deposits/history"] });
        } else if (data.status === "rejected" || tries >= 20) {
          clearInterval(poll);
          setWpPollingDone(true);
        }
      } catch { /* ignore */ }
    }, 3000);
    return () => clearInterval(poll);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wpReturn, wpDepositIdState]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/deposits", {
        amount: Number(amount),
        accountName: senderPhone,
        accountNumber: senderPhone,
        paymentMethod: selectedChannel?.operatorName || "Mobile Money",
        country: SUPPORTED_COUNTRY_CODE,
        depositChannelId: selectedDepositChannel?.id || null,
        paymentNumberId: selectedChannel?.id || null,
        channelName: selectedDepositChannel?.name || "Mobile Money",
        reference: transactionId || senderPhone,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erreur");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deposits/history"] });
      setStep("done");
    },
    onError: (e: Error) => {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    },
  });

  if (!user) return null;

  const isOlive = step === "amount";
  // The operator and selected-number screens belong only to manual deposits.
  // WestPay keeps its existing screen and return/approval behavior.
  const isManualDepositFlow =
    step === "operator" || step === "phone" || step === "info" || selectedChannel !== null;
  const pageStyle: React.CSSProperties = isOlive
    ? { background: "#000000" }
    : isManualDepositFlow
      ? {
          background:
            "linear-gradient(160deg, #7C3AED 0%, #4F46E5 45%, #2563EB 100%)",
        }
      : {
          background:
            "linear-gradient(160deg, #7C3AED 0%, #4F46E5 45%, #2563EB 100%)",
        };

  /* helpers */
  const copyToClipboard = (text: string) => {
    if (!navigator.clipboard?.writeText) {
      toast({
        title: "Copie impossible",
        description: "Copiez le numéro manuellement.",
        variant: "destructive",
      });
      return;
    }
    navigator.clipboard.writeText(text).then(
      () => toast({ title: "Copié !", description: text }),
      () => toast({
        title: "Copie impossible",
        description: "Copiez le numéro manuellement.",
        variant: "destructive",
      }),
    );
  };

  return (
    <div className="flex flex-col min-h-screen" style={pageStyle}>

      {/* ══ HEADER ══ */}
      {isOlive ? (
        <header className="flex items-center px-4 py-4">
          <Link href="/">
            <button className="p-1" data-testid="button-back-account">
              <ChevronLeft className="w-6 h-6 text-white" strokeWidth={2.5} />
            </button>
          </Link>
          <h1 className="flex-1 text-center text-white font-bold text-lg pr-8">
            Recharger
          </h1>
        </header>
      ) : isManualDepositFlow && step === "operator" ? (
        <header className="px-5 pt-10 pb-6">
          <button
            className="mb-4 p-1 -ml-1"
            onClick={() => setStep("amount")}
            data-testid="button-deposit-back"
          >
            <ChevronLeft className="w-6 h-6 text-white" strokeWidth={2.5} />
          </button>
          <p className="text-white text-[15px] font-normal leading-none mb-2">
            Montant:
          </p>
          <p className="text-white font-black leading-none" style={{ fontSize: 42 }}>
            {Number(amount).toLocaleString("fr-FR")}{" "}
            <span className="font-bold" style={{ fontSize: 22 }}>{CURRENCY}</span>
          </p>
        </header>
      ) : isManualDepositFlow ? (
        <header className="flex items-start px-4 pt-12 pb-5">
          <button
            className="p-1 mr-2 mt-1"
            onClick={() => {
              if (step === "phone") setStep("operator");
              else if (step === "info") setStep("phone");
              else if (step === "done") { window.location.href = "/"; return; }
            }}
            data-testid="button-deposit-back"
          >
            <ChevronLeft className="w-6 h-6 text-white" strokeWidth={2.5} />
          </button>
          <div>
            <p className="text-white/70 text-sm font-medium">Montant:</p>
            <p className="text-white font-black text-3xl leading-tight">
              {Number(amount).toLocaleString("fr-FR")}{" "}
              <span className="text-xl font-semibold">{CURRENCY}</span>
            </p>
          </div>
        </header>
      ) : (
        <header className="flex items-start px-4 pt-12 pb-5">
          <button
            className="p-1 mr-2 mt-1"
            onClick={() => {
              if (step === "done") { window.location.href = "/"; return; }
            }}
            data-testid="button-deposit-back"
          >
            <ChevronLeft className="w-6 h-6 text-white" strokeWidth={2.5} />
          </button>
          <div>
            <p className="text-white/70 text-sm font-medium">Montant:</p>
            <p className="text-white font-black text-3xl leading-tight">
              {Number(amount).toLocaleString("fr-FR")}{" "}
              <span className="text-xl font-semibold">{CURRENCY}</span>
            </p>
          </div>
        </header>
      )}

      {/* ══ CONTENT ══ */}
      <div className="flex-1 px-4 pb-8">

        {/* ─────────────────────────────────────────
            STEP 1 : Amount + mode de paiement (OLIVE)
        ───────────────────────────────────────── */}
        {step === "amount" && (
          <div className="space-y-5">
            {/* Olive balance card */}
            <div
              className="relative overflow-hidden rounded-2xl p-5"
              style={{
                background:
                  "linear-gradient(135deg, #1a1a1a 0%, #000000 100%)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(120deg, rgba(255,255,255,0.12) 0%, transparent 60%)",
                }}
              />
              <div className="relative">
                <p className="text-white/65 text-xs mb-0.5">mon solde</p>
                <p className="text-white font-black text-3xl mb-3">
                  {CURRENCY}{" "}
                  {(user.balance || 0).toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
                <Link href="/deposits-history">
                  <button className="flex items-center gap-1.5 text-white/55 text-xs hover:text-white/75 transition">
                    <ClipboardList className="w-3.5 h-3.5" />
                    dépôt
                  </button>
                </Link>
              </div>
            </div>

            {/* Amount label + input */}
            <div>
              <p className="text-white font-bold text-[15px] mb-2">
                Montant de la recharge
              </p>
              <input
                type="number"
                value={amount}
                min={minDeposit}
                onChange={(e) =>
                  setAmount(e.target.value ? Number(e.target.value) : "")
                }
                placeholder="Veuillez saisir le montant de la recharge"
                className="w-full rounded-xl px-4 py-3.5 text-sm outline-none"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  color: "white",
                }}
                data-testid="input-deposit-amount"
              />

              {/* Preset grid – 3 columns */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                {presetAmounts.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(preset)}
                    className="rounded-xl py-3.5 text-sm font-semibold text-white transition active:scale-95"
                    style={{
                      background:
                        amount === preset ? "#1A56DB" : "rgba(255,255,255,0.10)",
                    }}
                    data-testid={`button-preset-amount-${preset}`}
                  >
                    {preset.toLocaleString("fr-FR")}
                  </button>
                ))}
              </div>
            </div>

            {/* Retour WestPay — indicateur de vérification */}
            {isAutomaticDeposit && wpReturn && !wpPollingDone && (
              <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold"
                style={{ background: "rgba(255,255,255,0.08)", color: "#fde68a", border: "1px solid rgba(253,230,138,0.3)" }}>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                Vérification du paiement en cours…
              </div>
            )}

            {/* Payment mode chips — channels if configured, otherwise operators */}
            {showManualDepositChannels && (hasChannels ? depositChannels : fallbackOperators).length > 0 && (
              <div>
                <p className="text-white font-bold text-[15px] mb-2">
                  mode de paiement
                </p>
                <div className="flex flex-wrap gap-2">
                  {hasChannels
                    ? depositChannels.map((ch) => (
                        <button
                          key={ch.id}
                          onClick={() => {
                            setSelectedDepositChannel(ch);
                            setSelectedChannel(null); // reset operator
                          }}
                          className="rounded-xl px-5 py-3.5 text-sm font-semibold text-white transition active:scale-95"
                          style={{
                            background:
                              selectedDepositChannel?.id === ch.id
                                ? "#1A56DB"
                                : "rgba(255,255,255,0.10)",
                            minWidth: 80,
                          }}
                          data-testid={`button-deposit-channel-${ch.id}`}
                        >
                          {ch.name}
                        </button>
                      ))
                    : fallbackOperators.map((op) => (
                        <button
                          key={op.id}
                          onClick={() => setSelectedChannel(op)}
                          className="rounded-xl px-5 py-3.5 text-sm font-semibold text-white transition active:scale-95"
                          style={{
                            background:
                              selectedChannel?.id === op.id
                                ? "#1A56DB"
                                : "rgba(255,255,255,0.10)",
                            minWidth: 80,
                          }}
                          data-testid={`button-channel-${op.id}`}
                        >
                          {op.operatorName}
                        </button>
                      ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────
            STEP 2 : Operator list (BLUE/PURPLE)
        ───────────────────────────────────────── */}
        {step === "operator" && (
          <div>
            <p className="text-white font-normal mb-4" style={{ fontSize: 15 }}>
              Sélectionnez le mode de paiement :
            </p>

            {operators.length === 0 ? (
              <p className="text-white/50 text-sm text-center py-12">
                Aucun opérateur disponible
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {operators.map((op) => (
                  <button
                    key={op.id}
                    onClick={() => {
                      setSelectedChannel(op);
                      setStep("phone");
                    }}
                    className="w-full bg-white flex items-center justify-between transition active:scale-[0.98]"
                    style={{
                      borderRadius: 14,
                      paddingTop: 18,
                      paddingBottom: 18,
                      paddingLeft: 20,
                      paddingRight: 20,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                    }}
                    data-testid={`button-operator-${op.id}`}
                  >
                    <span className="font-extrabold tracking-wide" style={{ color: "#1B3A6B", fontSize: 17 }}>
                      {op.operatorName.toUpperCase()}
                    </span>
                    <span className="font-semibold" style={{ color: "#1B3A6B", fontSize: 18 }}>{">"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: payer phone and transfer method, matching the previous manual flow. */}
        {step === "phone" && selectedChannel && (
          <div>
            <div className="rounded-3xl bg-white p-5 shadow-xl" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
              <Stepper active={1} />

              <div
                className="mb-5 rounded-xl px-4 py-3 text-sm"
                style={{ background: "#FEE2E2", border: "1px solid #ff0000", color: "#7f1d1d" }}
              >
                Veuillez sélectionner la même option que votre méthode de transfert.
              </div>

              <p className="mb-2 text-sm text-gray-700">Veuillez entrer votre numéro de téléphone :</p>
              <div className="mb-5 flex overflow-hidden rounded-xl border border-gray-200">
                <span className="shrink-0 border-r border-gray-200 bg-gray-50 px-3 py-3.5 text-sm font-semibold text-blue-600">
                  +{countryPrefix}
                </span>
                <input
                  id="manual-sender-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  value={senderPhone}
                  onChange={(event) => setSenderPhone(event.target.value)}
                  placeholder="9 chiffres"
                  className="min-w-0 flex-1 px-3 py-3.5 text-sm text-gray-800 outline-none"
                  aria-required="true"
                  data-testid="input-sender-phone"
                />
              </div>

              <p className="mb-3 text-sm text-gray-700">Choisissez la méthode de transfert :</p>
              <label className="mb-6 flex cursor-pointer items-center gap-2.5">
                <input type="radio" name="method" checked readOnly className="h-4 w-4 accent-blue-500" />
                <span className="text-sm font-semibold text-gray-800">{selectedChannel.operatorName}</span>
              </label>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("operator")}
                  className="flex-1 rounded-xl py-3 text-sm font-semibold transition active:opacity-80"
                  style={{ border: "1.5px solid #3B82F6", color: "#3B82F6", background: "white" }}
                >
                  ‹ Retourner
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!senderPhone.trim()) {
                      toast({
                        title: "Numéro requis",
                        description: "Veuillez entrer votre numéro de téléphone",
                        variant: "destructive",
                      });
                      return;
                    }
                    setStep("info");
                  }}
                  className="flex-1 rounded-xl py-3 text-sm font-semibold text-white transition active:opacity-80"
                  style={{ background: "#3B82F6" }}
                >
                  L&apos;étape suivante ›
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: destination account and transaction ID. */}
        {step === "info" && selectedChannel && (
          <div>
            <div className="rounded-3xl bg-white p-5 shadow-xl" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
              <Stepper active={2} />

              <div
                className="mb-5 rounded-xl px-4 py-3 text-sm font-medium"
                style={{ background: "#FEE2E2", border: "1px solid #ff0000", color: "#78350F" }}
              >
                Transférez {Number(amount).toLocaleString("fr-FR")} {CURRENCY} sur le compte suivant :
              </div>

              <div className="mb-5 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-gray-500">Banque :</p>
                  <p className="text-base font-bold text-gray-900">{selectedChannel.operatorName}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500">Compte :</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="break-all text-base font-bold text-gray-900">{selectedChannel.phone}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedChannel.phone)}
                      className="ml-1 text-gray-400 transition hover:text-blue-500"
                      title="Copier"
                      aria-label="Copier le numéro de dépôt"
                      data-testid="button-copy-payment-number"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500">Montant :</p>
                  <p className="text-lg font-bold text-gray-900">
                    {Number(amount).toLocaleString("fr-FR")}{" "}
                    <span className="text-base font-semibold text-gray-600">{CURRENCY}</span>
                  </p>
                </div>
              </div>

              <div
                className="mb-4 rounded-xl px-4 py-3 text-sm"
                style={{ background: "#FEE2E2", border: "1px solid #ff0000", color: "#78350F" }}
              >
                Une fois le transfert terminé, saisissez l&apos;ID reçu par SMS.
              </div>

              <label htmlFor="manual-transaction-id" className="mb-2 block text-sm font-medium text-gray-700">
                Identifiant de transaction
              </label>
              <input
                id="manual-transaction-id"
                type="text"
                inputMode="text"
                autoComplete="off"
                value={transactionId}
                onChange={(event) => setTransactionId(event.target.value)}
                placeholder="Ex. 10467523233"
                className="mb-6 w-full rounded-xl px-4 py-3 text-sm text-gray-900 outline-none"
                style={{ border: "1px solid #D1D5DB" }}
                aria-required="true"
                data-testid="input-transaction-id"
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="flex-1 rounded-xl py-3 text-sm font-semibold transition active:opacity-80"
                  style={{ border: "1.5px solid #3B82F6", color: "#3B82F6", background: "white" }}
                >
                  ‹ Retour
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!transactionId.trim()) {
                      toast({
                        title: "ID requis",
                        description: "Veuillez saisir votre identifiant de transaction",
                        variant: "destructive",
                      });
                      return;
                    }
                    submitMutation.mutate();
                  }}
                  disabled={submitMutation.isPending}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-semibold text-white transition active:opacity-80 disabled:opacity-60"
                  style={{ background: "#3B82F6" }}
                  data-testid="button-deposit-completed"
                >
                  {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Envoyer la demande ›"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manual deposits remain pending until reviewed by an administrator. */}
        {step === "done" && selectedChannel && (
          <div className="rounded-[24px] border-2 border-[#17263F] bg-white p-5 shadow-[0_6px_0_#17263F]">
            <div className="flex flex-col items-center pb-5 pt-2 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#17263F] bg-[#EAF7FC]">
                <CheckCircle2 className="h-11 w-11 text-[#367A9A]" />
              </div>
              <span className="rounded-full bg-[#EAF7FC] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#28627F]">
                Demande envoyée
              </span>
              <h2 className="mt-3 text-2xl font-black text-[#17263F]">
                En attente de validation
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-gray-600">
                Votre demande de dépôt a bien été reçue. Le montant sera ajouté à votre solde après vérification.
              </p>
            </div>

            <div className="rounded-2xl border border-[#D8E0E6] bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-3">
                <span className="text-sm text-gray-600">Opérateur</span>
                <span className="text-right text-sm font-bold text-[#17263F]">
                  {selectedChannel.operatorName}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-gray-200 py-3">
                <span className="text-sm text-gray-600">Montant</span>
                <span className="text-right text-sm font-bold text-[#17263F]">
                  {Number(amount).toLocaleString("fr-FR")} {CURRENCY}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 pt-3">
                <span className="text-sm text-gray-600">ID de transaction</span>
                <span className="max-w-[60%] break-all text-right text-sm font-bold text-[#17263F]">
                  {transactionId}
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#B8DDED] bg-[#EAF7FC] px-3.5 py-3 text-sm font-semibold text-[#244D61]">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              Notre équipe vérifie les informations de votre transfert.
            </div>

            <Link href="/">
              <button
                className="mt-5 w-full rounded-xl border-2 border-[#17263F] bg-[#87CEEB] py-3.5 text-sm font-extrabold text-[#17263F] transition hover:bg-[#6FC1E5]"
                data-testid="button-deposit-pending-home"
              >
                Retour à l&apos;accueil
              </button>
            </Link>
          </div>
        )}

        {/* ─────────────────────────────────────────
            STEP 5 : Done – stepper 3 (BLUE/PURPLE)
        ───────────────────────────────────────── */}
        {step === "done" && !selectedChannel && (
          <div>
            <div
              className="bg-white rounded-3xl p-5 shadow-xl"
              style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
            >
              <Stepper active={3} />

              <div className="flex flex-col items-center py-4">
                {/* Success ring */}
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
                  style={{
                    border: "3px solid #86EFAC",
                    background: "rgba(255,255,255,0.08)",
                  }}
                >
                  <CheckCircle2 className="w-10 h-10 text-gray-400" />
                </div>

                <p className="font-black text-xl text-gray-900 mb-2">
                  Transfert terminé!
                </p>
                <p className="text-gray-500 text-sm text-center mb-7 leading-relaxed">
                  Le paiement a été effectué, veuillez revenir sur votre compte
                  pour confirmer.
                </p>

                <Link href="/">
                  <button
                    className="px-10 py-3 rounded-xl font-semibold text-white text-sm transition active:opacity-80"
                    style={{ background: "#22C55E" }}
                  >
                    Confirm
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══ FIXED BOTTOM – Step 1 only ══ */}
      {step === "amount" && (
        <div
          className="mt-6 px-4 pb-8 pt-2"
        >
          <button
            onClick={() => {
              if (!amount || Number(amount) < minDeposit) {
                toast({
                  title: "Montant invalide",
                  description: `Montant minimum : ${minDeposit.toLocaleString()} ${CURRENCY}`,
                  variant: "destructive",
                });
                return;
              }
              // Les dépôts automatiques de la RDC passent par WestPay.
              if (isAutomaticDeposit) {
                westpayMutation.mutate({ amount: Number(amount) });
                return;
              }
              // Channels mode: need a channel selected → go to operator step
              if (hasChannels) {
                if (!selectedDepositChannel) {
                  toast({ title: "Mode de paiement requis", description: "Veuillez sélectionner un canal", variant: "destructive" });
                  return;
                }
                setStep("operator"); // operator step will show operators within the channel
                return;
              }
              // Fallback (no channels): operator acts as direct selector
              if (fallbackOperators.length > 0 && !selectedChannel) {
                toast({ title: "Mode de paiement requis", description: "Veuillez sélectionner un mode de paiement", variant: "destructive" });
                return;
              }
              if (selectedChannel) {
                setStep("phone"); // skip operator step
              } else {
                setStep("operator");
              }
            }}
            className="w-full py-4 rounded-full font-bold text-white text-base transition active:opacity-80"
            style={{
              background: "linear-gradient(90deg, #3B82F6 0%, #1A56DB 100%)",
            }}
            data-testid="button-recharge-now"
          >
            paiement
          </button>

          <div className="mt-3 px-2">
            <p
              className="text-center font-bold text-sm"
              style={{ color: "#A855F7" }}
            >
              Instructions de dépôt
            </p>
            <div className="mt-2 space-y-1 text-white/65 text-xs leading-5 text-left">
              <p>1. Le montant minimum est de {minDeposit.toLocaleString()} {CURRENCY}.</p>
              <p>2. Sélectionnez le canal et l&apos;opérateur que vous allez utiliser.</p>
              <p>3. Transférez exactement le montant indiqué vers le numéro affiché.</p>
              <p>4. Utilisez le même numéro de téléphone que celui du transfert.</p>
              <p>5. Saisissez ensuite l&apos;identifiant de transaction reçu par SMS.</p>
              <p className="text-white/45">Une information incorrecte peut retarder la validation du dépôt.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
