import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, CheckCircle2, Loader2, ClipboardList, Copy, ExternalLink, ShieldCheck, ArrowRight } from "lucide-react";
import { Link, useSearch } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const CURRENCY = "CDF";

// amount → operator → combined payer/transaction details → pending confirmation
type Step = "amount" | "operator" | "phone" | "done";

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
  // selectedDepositChannel = the channel (Canal 1 or Wave) chosen in step 1
  const [selectedDepositChannel, setSelectedDepositChannel] = useState<DepositChannel | null>(null);
  // selectedChannel = the operator (MTN, Orange…) chosen in step 2
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
  const currentCountry = countryConfigs.find(country => country.code === user?.country);
  const isAutomaticDeposit = currentCountry?.autoPaymentEnabled === true;
  const showManualDepositChannels = !isCountriesLoading && !isAutomaticDeposit;

  // Deposit channels (Canal 1, Wave…) filtered by the user's country
  const { data: depositChannels = [] } = useQuery<DepositChannel[]>({
    queryKey: ["/api/deposit-channels", user?.country],
    queryFn: async () => {
      const url = user?.country
        ? `/api/deposit-channels?country=${user.country}`
        : `/api/deposit-channels`;
      const res = await fetch(url, { credentials: "include" });
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
    (n) =>
      n.isActive &&
      (!user?.country ||
        n.country === user.country ||
        paymentNumbersRaw.filter((x) => x.country === user?.country).length === 0)
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
  const countryPrefix = "243";

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
        country: user?.country || "CM",
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
  const isManualDepositFlow = step === "operator" || selectedChannel !== null;
  const pageStyle: React.CSSProperties = isOlive
    ? { background: "#000000" }
    : isManualDepositFlow
      ? {
          background:
            "linear-gradient(160deg, #F7A927 0%, #F28A12 52%, #E97812 100%)",
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
      ) : isManualDepositFlow ? (
        <header className="px-5 pb-5 pt-8">
          <div className="flex items-center justify-between">
            <button
              className="-ml-1 rounded-full p-1"
              onClick={() => {
                if (step === "operator") setStep("amount");
                else if (step === "phone") setStep("operator");
                else if (step === "done") { window.location.href = "/"; return; }
              }}
              aria-label={step === "operator" ? "Retour au montant" : "Retour"}
              data-testid="button-deposit-back"
            >
              <ChevronLeft className="h-6 w-6 text-white" strokeWidth={2.5} />
            </button>
            <div className="flex items-center gap-2 rounded-full border border-white/40 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white">
              <ShieldCheck className="h-4 w-4 text-[#D9F3FF]" />
              <span>{selectedDepositChannel?.name || "Paiement manuel"}</span>
            </div>
          </div>
          <div className="mt-5 flex items-end justify-between gap-3">
            <div>
              <p className="mb-1 text-sm font-medium text-white/80">Montant :</p>
              <p className="font-black leading-none text-white" style={{ fontSize: 38 }}>
                {Number(amount).toLocaleString("fr-FR")}{" "}
                <span className="text-xl font-bold">{CURRENCY}</span>
              </p>
            </div>
            {step !== "operator" && (
              <div className="rounded-full border border-[#17263F] bg-white px-3 py-2 text-xs font-bold text-[#17263F]">
                {selectedChannel?.operatorName}
              </div>
            )}
          </div>
        </header>
      ) : (
        <header className="flex items-start px-4 pt-12 pb-5">
          <button
            className="p-1 mr-2 mt-1"
            onClick={() => {
              if (step === "phone") setStep("operator");
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
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/75">
                  Dépôt par numéro
                </p>
                <h2 className="mt-1 text-xl font-black text-white">
                  Choisissez votre opérateur
                </h2>
              </div>
              <span className="rounded-full border border-white/45 bg-white/15 px-3 py-1.5 text-xs font-bold text-white">
                1 / 3
              </span>
            </div>

            {operators.length === 0 ? (
              <p className="rounded-2xl border-2 border-[#17263F] bg-white px-4 py-12 text-center text-sm font-medium text-[#17263F] shadow-[0_5px_0_#17263F]">
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
                    className="flex w-full items-center justify-between rounded-2xl border-2 border-[#17263F] bg-white px-5 py-4 text-left shadow-[0_5px_0_#17263F] transition active:translate-y-1 active:shadow-[0_1px_0_#17263F]"
                    data-testid={`button-operator-${op.id}`}
                  >
                    <span className="font-extrabold text-[#17263F]" style={{ fontSize: 17 }}>
                      {op.operatorName}
                    </span>
                    <ArrowRight className="h-5 w-5 text-[#367A9A]" />
                  </button>
                ))}
              </div>
            )}
            <p className="mt-4 flex items-center gap-2 text-xs leading-5 text-white/80">
              <ShieldCheck className="h-4 w-4 shrink-0 text-[#D9F3FF]" />
              Choisissez l&apos;opérateur utilisé pour envoyer le transfert.
            </p>
          </div>
        )}

        {/* ─────────────────────────────────────────
            STEP 3 : Stepper 1 – Phone + method (BLUE/PURPLE)
        ───────────────────────────────────────── */}
        {step === "phone" && selectedChannel && (
          <div className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/75">
                  Informations du transfert
                </p>
                <h2 className="mt-1 text-xl font-black text-white">
                  Envoyez votre demande
                </h2>
              </div>
              <span className="rounded-full border border-white/45 bg-white/15 px-3 py-1.5 text-xs font-bold text-white">
                2 / 3
              </span>
            </div>

            <div className="rounded-[24px] border-2 border-[#17263F] bg-white p-5 shadow-[0_6px_0_#17263F]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500">
                    Numéro de réception
                  </p>
                  <p className="mt-1 text-base font-extrabold text-[#17263F]">
                    {selectedChannel.operatorName}
                  </p>
                </div>
                <span className="rounded-full bg-[#EAF7FC] px-3 py-1 text-[11px] font-bold text-[#28627F]">
                  {selectedDepositChannel?.name || "Mobile Money"}
                </span>
              </div>

              <div className="mt-4 rounded-2xl border border-[#B8DDED] bg-[#F3FAFD] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 break-all text-xl font-black tracking-wide text-[#17263F]">
                    {selectedChannel.phone}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedChannel.phone)}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[#17263F] bg-white px-3 py-2 text-xs font-bold text-[#17263F] transition hover:bg-[#EAF7FC]"
                    aria-label={`Copier le numéro ${selectedChannel.phone}`}
                    data-testid="button-copy-payment-number"
                  >
                    <Copy className="h-4 w-4 text-[#367A9A]" />
                    Copier
                  </button>
                </div>
                <p className="mt-3 border-t border-[#D6EAF3] pt-3 text-sm text-gray-600">
                  Transférez{" "}
                  <strong className="text-[#17263F]">
                    {Number(amount).toLocaleString("fr-FR")} {CURRENCY}
                  </strong>{" "}
                  vers ce numéro avant de remplir les champs ci-dessous.
                </p>
              </div>

              <div className="mt-5 rounded-xl border border-[#B8DDED] bg-[#EAF7FC] px-3.5 py-3 text-sm leading-5 text-[#244D61]">
                Indiquez le numéro qui a envoyé l&apos;argent et l&apos;ID exact du SMS de confirmation.
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label htmlFor="manual-sender-phone" className="mb-2 block text-sm font-bold text-[#17263F]">
                    Téléphone payeur <span className="text-red-600">*</span>
                  </label>
                  <div className="flex overflow-hidden rounded-xl border-2 border-[#D8E0E6] bg-white focus-within:border-[#87CEEB]">
                    <span className="flex shrink-0 items-center border-r border-[#D8E0E6] bg-gray-50 px-3 text-sm font-bold text-[#367A9A]">
                      +{countryPrefix}
                    </span>
                    <input
                      id="manual-sender-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      placeholder="Ex. 90 12 34 56"
                      className="min-w-0 flex-1 px-3 py-3 text-sm text-gray-900 outline-none"
                      aria-required="true"
                      data-testid="input-sender-phone"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="manual-transaction-id" className="mb-2 block text-sm font-bold text-[#17263F]">
                    ID de transaction <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="manual-transaction-id"
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Ex. 10467523233"
                    className="w-full rounded-xl border-2 border-[#D8E0E6] px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#87CEEB]"
                    aria-required="true"
                    data-testid="input-transaction-id"
                  />
                  <p className="mt-1.5 text-xs leading-5 text-gray-500">
                    Saisissez l&apos;identifiant reçu par SMS après le transfert.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setStep("operator")}
                  className="flex-1 rounded-xl border-2 border-[#17263F] bg-white py-3.5 text-sm font-bold text-[#17263F] transition hover:bg-gray-50"
                >
                  ‹ Retour
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!senderPhone.trim() || !transactionId.trim()) return;
                    submitMutation.mutate();
                  }}
                  disabled={!senderPhone.trim() || !transactionId.trim() || submitMutation.isPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[#17263F] py-3.5 text-sm font-extrabold text-[#17263F] transition enabled:bg-[#87CEEB] enabled:hover:bg-[#6FC1E5] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 disabled:opacity-80"
                  data-testid="button-deposit-completed"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Envoi en cours…
                    </>
                  ) : (
                    <>
                      Envoyer la demande
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="px-2 text-center text-xs leading-5 text-white/85">
              Votre dépôt sera crédité après vérification de ces informations.
            </p>
          </div>
        )}

        {/* ─────────────────────────────────────────
            STEP 4 : Stepper 2 – Account + Transaction ID (BLUE/PURPLE)
        ───────────────────────────────────────── */}
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
