import { useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Copy } from "lucide-react";
import "./_group.css";

const CURRENCY = "CDF";
const paymentNumber = {
  operatorName: "Togocel",
  phone: "92 45 68 37",
};

type CurrentStep = "operator" | "phone" | "info" | "done";

function CurrentStepper({ active }: { active: 1 | 2 | 3 }) {
  return (
    <div className="mb-6 flex items-start">
      {["Téléphone", "Confirmation", "Terminé"].map((label, index) => {
        const step = index + 1;
        return (
          <div key={label} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {index > 0 && (
                <div
                  className="h-px flex-1"
                  style={{ background: active >= step ? "#3B82F6" : "#D1D5DB" }}
                />
              )}
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold"
                style={{
                  borderColor: active >= step ? "#3B82F6" : "#D1D5DB",
                  color: active >= step ? "#3B82F6" : "#9CA3AF",
                  background: "white",
                }}
              >
                {step}
              </div>
              {index < 2 && (
                <div
                  className="h-px flex-1"
                  style={{ background: active > step ? "#3B82F6" : "#D1D5DB" }}
                />
              )}
            </div>
            <span className="mt-1 text-center text-[10px] leading-tight text-gray-500">
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function Current() {
  const [step, setStep] = useState<CurrentStep>("operator");
  const [phone, setPhone] = useState("");
  const [reference, setReference] = useState("");
  const [copied, setCopied] = useState(false);

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(paymentNumber.phone);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main
      className="min-h-screen px-4 pb-8"
      style={{
        background: "linear-gradient(160deg, #7C3AED 0%, #4F46E5 45%, #2563EB 100%)",
        fontFamily: "Roboto, sans-serif",
      }}
    >
      <header className="px-1 pb-6 pt-10 text-white">
        {step === "operator" ? (
          <>
            <button
              aria-label="Retour au montant"
              className="-ml-1 mb-4 rounded-full p-1"
              onClick={() => setStep("operator")}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <p className="mb-2 text-sm">Montant:</p>
            <p className="text-[42px] font-black leading-none">
              5 000 <span className="text-[22px] font-bold">{CURRENCY}</span>
            </p>
          </>
        ) : (
          <div className="flex items-start gap-2">
            <button
              aria-label="Étape précédente"
              className="mt-1 rounded-full p-1"
              onClick={() => setStep(step === "info" ? "phone" : "operator")}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div>
              <p className="text-sm text-white/70">Montant:</p>
              <p className="text-3xl font-black">
                5 000 <span className="text-xl font-semibold">{CURRENCY}</span>
              </p>
            </div>
          </div>
        )}
      </header>

      {step === "operator" && (
        <section aria-label="Choix de l'opérateur">
          <p className="mb-4 text-[15px] text-white">
            Sélectionnez le mode de paiement :
          </p>
          <button
            className="flex w-full items-center justify-between rounded-[14px] bg-white px-5 py-[18px] text-left shadow"
            onClick={() => setStep("phone")}
          >
            <span className="font-extrabold tracking-wide text-[#1B3A6B]">
              {paymentNumber.operatorName.toUpperCase()}
            </span>
            <ChevronRight className="h-5 w-5 text-[#1B3A6B]" />
          </button>
        </section>
      )}

      {step === "phone" && (
        <section className="rounded-3xl bg-white p-5 shadow-xl">
          <CurrentStepper active={1} />
          <div className="mb-5 rounded-xl border border-red-500 bg-red-50 px-4 py-3 text-sm text-red-900">
            Veuillez sélectionner la même option que votre méthode de transfert.
          </div>
          <label className="mb-2 block text-sm text-gray-700">
            Veuillez entrer votre numéro de téléphone:
          </label>
          <div className="mb-5 flex overflow-hidden rounded-xl border border-gray-200">
            <span className="border-r border-gray-200 bg-gray-50 px-3 py-3.5 text-sm font-semibold text-blue-600">
              +228
            </span>
            <input
              aria-label="Numéro de téléphone"
              className="min-w-0 flex-1 px-3 py-3.5 text-sm text-gray-800 outline-none"
              placeholder="XXXXXXXXXX"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>
          <p className="mb-3 text-sm text-gray-700">Choisissez la méthode de transfert:</p>
          <label className="mb-6 flex items-center gap-2.5 text-sm font-semibold text-gray-800">
            <input type="radio" checked readOnly className="accent-blue-500" />
            {paymentNumber.operatorName}
          </label>
          <div className="flex gap-3">
            <button
              className="flex-1 rounded-xl border border-blue-500 py-3 text-sm font-semibold text-blue-500"
              onClick={() => setStep("operator")}
            >
              ‹ Retourner
            </button>
            <button
              className="flex-1 rounded-xl bg-blue-500 py-3 text-sm font-semibold text-white"
              onClick={() => setStep("info")}
            >
              L'étape suivante ›
            </button>
          </div>
        </section>
      )}

      {step === "info" && (
        <section className="rounded-3xl bg-white p-5 shadow-xl">
          <CurrentStepper active={2} />
          <div className="mb-5 rounded-xl border border-red-500 bg-red-50 px-4 py-3 text-sm text-amber-900">
            Transférez 5 000 {CURRENCY} sur le compte suivant:
          </div>
          <div className="mb-5 space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-500">Banque:</p>
              <p className="font-bold text-gray-900">{paymentNumber.operatorName}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500">Compte:</p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="font-bold text-gray-900">{paymentNumber.phone}</span>
                <button
                  aria-label="Copier le numéro"
                  className="text-gray-500"
                  onClick={copyNumber}
                >
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="mb-4 rounded-xl border border-red-500 bg-red-50 px-4 py-3 text-sm text-amber-900">
            Une fois le transfert terminé, veuillez saisir l'ID de transfert reçu par SMS:
          </div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Entrez votre identifiant de transaction
          </label>
          <input
            aria-label="Identifiant de transaction"
            className="mb-6 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none"
            placeholder="Ex: 10467523233"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
          />
          <div className="flex gap-3">
            <button
              className="flex-1 rounded-xl border border-blue-500 py-3 text-sm font-semibold text-blue-500"
              onClick={() => setStep("phone")}
            >
              ‹ Retourner
            </button>
            <button
              className="flex-1 rounded-xl bg-blue-500 py-3 text-sm font-semibold text-white"
              onClick={() => setStep("done")}
            >
              Vérifier
            </button>
          </div>
        </section>
      )}

      {step === "done" && (
        <section className="rounded-3xl bg-white p-6 text-center shadow-xl">
          <CheckCircle2 className="mx-auto mb-3 h-14 w-14 text-green-600" />
          <h2 className="text-xl font-bold text-gray-900">Transfert terminé!</h2>
          <p className="mt-2 text-sm text-gray-600">
            Votre transfert a été effectué avec succès
          </p>
          <button
            className="mt-6 w-full rounded-xl bg-blue-500 py-3 font-semibold text-white"
            onClick={() => setStep("operator")}
          >
            Continuer
          </button>
        </section>
      )}
    </main>
  );
}