import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, CheckCircle2, Loader2, ClipboardList, Copy } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const CURRENCY = "FCFA";

// amount → operator → phone (stepper 1) → info (stepper 2) → done (stepper 3)
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

  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState<number | "">("");
  // selectedDepositChannel = the Canal (Canal 1, Canal 2…) chosen in step 1
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

  // Deposit channels (Canal 1, Canal 2…) filtered by the user's country
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

  const minDeposit = parseInt(platformSettings?.minDeposit || "1000", 10);
  const presetAmounts = useMemo(
    () =>
      (
        platformSettings?.depositPresetAmounts ||
        "1000,3800,15000,30000,100000,150000,200000,300000"
      )
        .split(",")
        .map((v) => parseInt(v.trim(), 10))
        .filter((v) => Number.isFinite(v) && v > 0),
    [platformSettings?.depositPresetAmounts]
  );

  // Operators shown on step 2: channel-specific or global fallback
  const operators = hasChannels ? channelOperators : fallbackOperators;

  // Country phone prefix
  const countryPrefix =
    user?.country === "CI" ? "225"
    : user?.country === "CM" ? "237"
    : user?.country === "BF" ? "226"
    : user?.country === "BJ" ? "229"
    : user?.country === "ML" ? "223"
    : "225";

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/deposits", {
        amount: Number(amount),
        accountName: senderPhone,
        accountNumber: senderPhone,
        paymentMethod: selectedChannel?.operatorName || "Mobile Money",
        country: user?.country || "CM",
        paymentNumberId: selectedChannel?.id || null,
        channelName: selectedChannel?.operatorName || "Mobile Money",
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
  const pageStyle: React.CSSProperties = isOlive
    ? { background: "#000000" }
    : {
        background:
          "linear-gradient(160deg, #7C3AED 0%, #4F46E5 45%, #2563EB 100%)",
      };

  /* helpers */
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copié !", description: text });
    });
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
      ) : step === "operator" ? (
        /* ── Operator step header: amount floats top-left ── */
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
      ) : (
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
      )}

      {/* ══ CONTENT ══ */}
      <div className={`flex-1 px-4 ${isOlive ? "pb-44" : "pb-8"}`}>

        {/* ─────────────────────────────────────────
            STEP 1 : Amount + mode de paiement (OLIVE)
        ───────────────────────────────────────── */}
        {step === "amount" && (
          <div className="space-y-5">
            {/* Olive balance card */}
            <div
              className="relative aspect-square overflow-hidden rounded-2xl p-5 flex flex-col"
              style={{
                background:
                  "linear-gradient(135deg, #333333 0%, #111111 55%, #000000 100%)",
                boxShadow: "0 6px 24px rgba(0,0,0,0.35)",
              }}
            >
              <p className="text-white/65 text-xs mb-0.5">mon solde</p>
              <p className="text-white font-black text-3xl mb-3">
                F{" "}
                {(user.balance || 0).toLocaleString("fr-FR", {
                  minimumFractionDigits: 2,
                })}
              </p>
              <Link href="/deposits-history">
                <button className="mt-auto flex items-center gap-1.5 text-white/55 text-xs hover:text-white/75 transition">
                  <ClipboardList className="w-3.5 h-3.5" />
                  enregistrer
                </button>
              </Link>
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

            {isAutomaticDeposit && (
              <div
                className="rounded-2xl p-4"
                style={{
                  background: "linear-gradient(135deg, rgba(232,25,44,0.18), rgba(0,0,0,0.45))",
                  border: "1px solid rgba(232,25,44,0.55)",
                }}
              >
                <p className="text-white font-bold text-[15px] mb-1">
                  Paiement automatique
                </p>
                <p className="text-white/70 text-sm leading-relaxed">
                  Le mode automatique est activé pour votre pays. Les canaux manuels sont masqués.
                </p>
                <div
                  className="mt-3 rounded-xl px-3 py-2.5 text-sm font-semibold"
                  style={{ background: "rgba(255,255,255,0.1)", color: "#ff9aa5" }}
                >
                  Westpay sera disponible ici après la connexion du service de paiement.
                </div>
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
            {/* Label */}
            <p
              className="text-white font-normal mb-4"
              style={{ fontSize: 15 }}
            >
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
                    <span
                      className="font-extrabold tracking-wide"
                      style={{ color: "#1B3A6B", fontSize: 17 }}
                    >
                      {op.operatorName.toUpperCase()}
                    </span>
                    <span
                      className="font-semibold"
                      style={{ color: "#1B3A6B", fontSize: 18 }}
                    >
                      {">"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────
            STEP 3 : Stepper 1 – Phone + method (BLUE/PURPLE)
        ───────────────────────────────────────── */}
        {step === "phone" && selectedChannel && (
          <div>
            <div
              className="bg-white rounded-3xl p-5 shadow-xl"
              style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
            >
              <Stepper active={1} />

              {/* Warning */}
              <div
                className="rounded-xl px-4 py-3 mb-5 text-sm"
                style={{
                  background: "#FEE2E2",
                  border: "1px solid #ff0000",
                  color: "#7f1d1d",
                }}
              >
                Veuillez sélectionner la même option que votre méthode de
                transfert.
              </div>

              {/* Phone input */}
              <p className="text-gray-700 text-sm mb-2">
                Veuillez entrer votre numéro de téléphone:
              </p>
              <div
                className="flex items-center rounded-xl mb-5 overflow-hidden"
                style={{ border: "1px solid #E5E7EB" }}
              >
                <span className="px-3 py-3.5 text-sm font-semibold text-blue-600 bg-gray-50 border-r border-gray-200 shrink-0">
                  +{countryPrefix}
                </span>
                <input
                  type="tel"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="XXXXXXXXXX"
                  className="flex-1 px-3 py-3.5 text-sm outline-none text-gray-800"
                  data-testid="input-sender-phone"
                />
              </div>

              {/* Method radio */}
              <p className="text-gray-700 text-sm mb-3">
                Choisissez la méthode de transfert:
              </p>
              <label className="flex items-center gap-2.5 cursor-pointer mb-6">
                <input
                  type="radio"
                  name="method"
                  checked
                  readOnly
                  className="w-4 h-4 accent-blue-500"
                />
                <span className="text-gray-800 text-sm font-semibold">
                  {selectedChannel.operatorName}
                </span>
              </label>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("operator")}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm transition active:opacity-80"
                  style={{
                    border: "1.5px solid #3B82F6",
                    color: "#3B82F6",
                    background: "white",
                  }}
                >
                  ‹ Retourner
                </button>
                <button
                  onClick={() => {
                    if (!senderPhone.trim()) {
                      toast({
                        title: "Numéro requis",
                        description:
                          "Veuillez entrer votre numéro de téléphone",
                        variant: "destructive",
                      });
                      return;
                    }
                    setStep("info");
                  }}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm text-white transition active:opacity-80"
                  style={{ background: "#3B82F6" }}
                >
                  L'étape suivante ›
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────
            STEP 4 : Stepper 2 – Account + Transaction ID (BLUE/PURPLE)
        ───────────────────────────────────────── */}
        {step === "info" && selectedChannel && (
          <div>
            <div
              className="bg-white rounded-3xl p-5 shadow-xl"
              style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
            >
              <Stepper active={2} />

              {/* Banner 1 */}
              <div
                className="rounded-xl px-4 py-3 mb-5 text-sm font-medium"
                style={{
                  background: "#FEE2E2",
                  border: "1px solid #ff0000",
                  color: "#78350F",
                }}
              >
                Transférez {Number(amount).toLocaleString("fr-FR")} {CURRENCY}{" "}
                sur le compte suivant:
              </div>

              {/* Destination account details */}
              <div className="mb-5 space-y-3">
                <div>
                  <p className="text-gray-500 text-sm font-semibold">Banque:</p>
                  <p className="text-gray-900 text-base font-bold">
                    {selectedChannel.operatorName}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 text-sm font-semibold">Compte:</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-gray-900 text-base font-bold">
                      {selectedChannel.phone}
                    </span>
                    <button
                      onClick={() => copyToClipboard(selectedChannel.phone)}
                      className="ml-1 text-gray-400 hover:text-blue-500 transition"
                      title="Copier"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-gray-500 text-sm font-semibold">Montant:</p>
                  <p className="text-gray-900 text-lg font-bold">
                    {Number(amount).toLocaleString("fr-FR")}{" "}
                    <span className="text-base font-semibold text-gray-600">
                      {CURRENCY}
                    </span>
                  </p>
                </div>
              </div>

              {/* Banner 2 */}
              <div
                className="rounded-xl px-4 py-3 mb-4 text-sm"
                style={{
                  background: "#FEE2E2",
                  border: "1px solid #ff0000",
                  color: "#78350F",
                }}
              >
                Une fois le transfert terminé, veuillez saisir l'ID de
                transfert dans le message texte reçu:
              </div>

              {/* Transaction ID */}
              <p className="text-gray-700 text-sm font-medium mb-2">
                Entrez votre identifiant de transaction
              </p>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Ex: 10467523233"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none mb-6"
                style={{ border: "1px solid #D1D5DB", color: "#111827" }}
                data-testid="input-transaction-id"
              />

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("phone")}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm transition active:opacity-80"
                  style={{
                    border: "1.5px solid #3B82F6",
                    color: "#3B82F6",
                    background: "white",
                  }}
                >
                  ‹ Previous
                </button>
                <button
                  onClick={() => {
                    if (!transactionId.trim()) {
                      toast({
                        title: "ID requis",
                        description:
                          "Veuillez saisir votre identifiant de transaction",
                        variant: "destructive",
                      });
                      return;
                    }
                    submitMutation.mutate();
                  }}
                  disabled={submitMutation.isPending}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm text-white transition active:opacity-80 flex items-center justify-center gap-1.5"
                  style={{ background: "#3B82F6" }}
                  data-testid="button-deposit-completed"
                >
                  {submitMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Submit ›"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────
            STEP 5 : Done – stepper 3 (BLUE/PURPLE)
        ───────────────────────────────────────── */}
        {step === "done" && (
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
          className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-4"
          style={{
            background:
              "linear-gradient(to top, #000000 70%, rgba(0,0,0,0))",
          }}
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
              Instructions de charge
            </p>
            <p className="text-white/50 text-xs text-center mt-1 leading-5">
              Montant minimum de recharge {minDeposit.toLocaleString()} FAFC.
              Veuillez remplir complètement les informations selon les invites
              pour éviter une arrivée retardée ou une charge infructueuse.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
