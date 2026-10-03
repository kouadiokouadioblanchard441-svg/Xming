import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  ShieldCheck,
} from "lucide-react";
import "./_group.css";

type DepositStep = "operator" | "details" | "pending";

const operators = [
  {
    id: "moov",
    name: "Moov Africa Togo",
    mark: "M",
    color: "#087bb5",
    number: "90 12 34 56",
  },
  {
    id: "togocel",
    name: "Togocel",
    mark: "T",
    color: "#dd5a28",
    number: "73 12 74 20",
  },
];

function DepositProgress({ active }: { active: 1 | 2 | 3 }) {
  const items = ["Opérateur", "Paiement", "Validation"];

  return (
    <ol className="xmd-progress" aria-label={`Étape ${active} sur 3`}>
      {items.map((item, index) => {
        const number = index + 1;
        const complete = number < active;
        const current = number === active;

        return (
          <li
            className={`xmd-progress-item${current ? " is-current" : ""}${complete ? " is-complete" : ""}`}
            key={item}
            aria-current={current ? "step" : undefined}
          >
            <span className="xmd-progress-dot" aria-hidden="true">
              {complete ? <Check size={13} strokeWidth={3} /> : number}
            </span>
            <span>{item}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function XPingManualDeposit() {
  const [step, setStep] = useState<DepositStep>("operator");
  const [selectedOperatorId, setSelectedOperatorId] = useState("togocel");
  const [payerPhone, setPayerPhone] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const selectedOperator =
    operators.find((operator) => operator.id === selectedOperatorId) ?? operators[1];
  const isFormValid = payerPhone.trim().length >= 6 && transactionId.trim().length > 0;

  const copyDestination = async () => {
    try {
      await navigator.clipboard.writeText(selectedOperator.number.replaceAll(" ", ""));
      setCopied(true);
      setCopyError(false);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyError(true);
      setCopied(false);
    }
  };

  const goBack = () => {
    if (step === "details") setStep("operator");
    if (step === "pending") setStep("details");
  };

  return (
    <main className="xmd-shell">
      <style>{`
        .xmd-shell {
          --xmd-ink: #152538;
          --xmd-muted: #617080;
          --xmd-orange: #fb781d;
          --xmd-orange-deep: #d85b13;
          --xmd-sky: #80d5f0;
          --xmd-paper: #fffdfa;
          --xmd-line: #dbe2e7;
          min-height: 100vh;
          min-height: 100dvh;
          box-sizing: border-box;
          padding: 24px 18px 36px;
          color: var(--xmd-ink);
          background:
            radial-gradient(ellipse at 85% 8%, rgba(255, 202, 141, .48), transparent 33%),
            linear-gradient(155deg, #ff841f 0%, #f87519 58%, #f16b12 100%);
          font-family: 'DM Sans', var(--font-sans, sans-serif);
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow-x: hidden;
        }
        .xmd-shell *, .xmd-shell *::before, .xmd-shell *::after { box-sizing: border-box; }
        .xmd-wrap { width: 100%; max-width: 470px; }
        .xmd-brandbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: var(--xmd-ink);
          margin-bottom: 22px;
        }
        .xmd-brand {
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 16px;
          font-weight: 900;
          letter-spacing: .09em;
        }
        .xmd-brand-mark {
          display: grid;
          width: 31px;
          height: 31px;
          place-items: center;
          border: 2px solid var(--xmd-ink);
          border-radius: 10px 10px 10px 3px;
          font-size: 17px;
          line-height: 1;
          transform: rotate(-4deg);
        }
        .xmd-secure {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #563518;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .035em;
        }
        .xmd-heading-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin: 0 0 18px;
        }
        .xmd-back {
          width: 39px;
          height: 39px;
          flex: 0 0 39px;
          display: inline-grid;
          place-items: center;
          margin: 2px 0 0 -4px;
          padding: 0;
          border: 1px solid rgba(21, 37, 56, .32);
          border-radius: 13px;
          background: rgba(255, 255, 255, .2);
          color: var(--xmd-ink);
          cursor: pointer;
          transition: background .18s ease, transform .18s ease;
        }
        .xmd-back:hover { background: rgba(255,255,255,.42); transform: translateX(-2px); }
        .xmd-back:focus-visible, .xmd-operator:focus-visible, .xmd-copy:focus-visible,
        .xmd-primary:focus-visible, .xmd-secondary:focus-visible, .xmd-text-input:focus-visible {
          outline: 3px solid #146b8c;
          outline-offset: 3px;
        }
        .xmd-amount-label {
          margin: 0 0 2px;
          color: rgba(21, 37, 56, .7);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .14em;
          text-transform: uppercase;
        }
        .xmd-amount {
          margin: 0;
          color: var(--xmd-ink);
          font-size: clamp(34px, 10vw, 42px);
          font-weight: 900;
          line-height: 1.02;
          letter-spacing: -.045em;
        }
        .xmd-amount small { font-size: .48em; letter-spacing: -.01em; }
        .xmd-panel {
          position: relative;
          padding: 21px 20px 20px;
          border: 2px solid var(--xmd-ink);
          border-radius: 19px;
          background: var(--xmd-paper);
          box-shadow: 0 7px 0 rgba(21, 37, 56, .92), 0 16px 28px rgba(105, 45, 5, .15);
          animation: xmd-rise .34s cubic-bezier(.2,.75,.25,1) both;
        }
        @keyframes xmd-rise {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .xmd-progress {
          display: flex;
          align-items: flex-start;
          margin: 0 0 21px;
          padding: 0;
          list-style: none;
        }
        .xmd-progress-item {
          display: flex;
          flex: 1;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          position: relative;
          color: #8a949e;
          font-size: 10px;
          font-weight: 700;
          text-align: center;
        }
        .xmd-progress-item:not(:last-child)::after {
          position: absolute;
          top: 14px;
          left: calc(50% + 17px);
          width: calc(100% - 34px);
          height: 2px;
          content: "";
          background: #e2e7ea;
        }
        .xmd-progress-item.is-complete:not(:last-child)::after { background: var(--xmd-sky); }
        .xmd-progress-dot {
          width: 29px;
          height: 29px;
          display: grid;
          place-items: center;
          border: 1.5px solid #d8dfe4;
          border-radius: 50%;
          background: #fff;
          color: #8a949e;
          font-size: 12px;
          font-weight: 800;
        }
        .xmd-progress-item.is-current { color: var(--xmd-ink); }
        .xmd-progress-item.is-current .xmd-progress-dot {
          border-color: var(--xmd-ink);
          background: var(--xmd-sky);
          color: var(--xmd-ink);
          box-shadow: 0 0 0 4px rgba(128, 213, 240, .22);
        }
        .xmd-progress-item.is-complete .xmd-progress-dot {
          border-color: var(--xmd-ink);
          background: var(--xmd-ink);
          color: white;
        }
        .xmd-title {
          margin: 0;
          color: var(--xmd-ink);
          font-size: 20px;
          font-weight: 850;
          line-height: 1.2;
          letter-spacing: -.025em;
        }
        .xmd-subtitle {
          margin: 7px 0 17px;
          color: var(--xmd-muted);
          font-size: 13px;
          line-height: 1.45;
        }
        .xmd-operator-list { display: grid; gap: 11px; }
        .xmd-operator {
          width: 100%;
          min-height: 77px;
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 12px 14px;
          border: 1.5px solid var(--xmd-ink);
          border-radius: 15px;
          background: #fff;
          color: var(--xmd-ink);
          text-align: left;
          cursor: pointer;
          box-shadow: 0 3px 0 rgba(21, 37, 56, .13);
          transition: transform .18s ease, background .18s ease, box-shadow .18s ease;
        }
        .xmd-operator:hover {
          transform: translateY(-2px);
          background: #f4fbfe;
          box-shadow: 0 5px 0 rgba(21, 37, 56, .18);
        }
        .xmd-operator-mark {
          width: 43px;
          height: 43px;
          flex: 0 0 43px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          color: white;
          font-size: 20px;
          font-weight: 900;
          box-shadow: inset 0 -3px 0 rgba(0,0,0,.15);
        }
        .xmd-operator-copy { min-width: 0; flex: 1; }
        .xmd-operator-name { display: block; font-size: 15px; font-weight: 850; }
        .xmd-operator-hint {
          display: block;
          margin-top: 3px;
          color: var(--xmd-muted);
          font-size: 11px;
        }
        .xmd-operator-arrow { color: #748392; }
        .xmd-note {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin: 15px 0 0;
          color: #687582;
          font-size: 11px;
          line-height: 1.45;
        }
        .xmd-note svg { flex: 0 0 auto; margin-top: 1px; color: #2991b2; }
        .xmd-transfer-note {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 11px 12px;
          border: 1px solid #f2c99b;
          border-radius: 12px;
          background: #fff5e8;
          color: #70451e;
          font-size: 12px;
          line-height: 1.4;
        }
        .xmd-transfer-note strong { color: #3e2c1c; }
        .xmd-transfer-note b { white-space: nowrap; }
        .xmd-destination {
          margin: 13px 0 15px;
          padding: 13px 14px 12px;
          border: 1px solid #d9e1e5;
          border-radius: 13px;
          background: #f7fafb;
        }
        .xmd-destination-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          color: #647180;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .085em;
          text-transform: uppercase;
        }
        .xmd-network-tag {
          padding: 4px 7px;
          border-radius: 5px;
          background: #e6f7fc;
          color: #18677e;
          letter-spacing: .035em;
        }
        .xmd-destination-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 9px;
          margin-top: 7px;
        }
        .xmd-destination-number {
          color: var(--xmd-ink);
          font-size: 22px;
          font-weight: 900;
          letter-spacing: .07em;
          font-variant-numeric: tabular-nums;
        }
        .xmd-copy {
          min-width: 88px;
          min-height: 37px;
          display: inline-flex;
          justify-content: center;
          align-items: center;
          gap: 6px;
          padding: 0 10px;
          border: 1.5px solid var(--xmd-ink);
          border-radius: 10px;
          background: var(--xmd-orange);
          color: var(--xmd-ink);
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: background .16s ease, transform .16s ease;
        }
        .xmd-copy:hover { background: #ff9a48; transform: translateY(-1px); }
        .xmd-copy.is-copied { background: #dff5fb; }
        .xmd-form { display: grid; gap: 13px; }
        .xmd-field { display: grid; gap: 6px; }
        .xmd-label {
          color: var(--xmd-ink);
          font-size: 12px;
          font-weight: 800;
        }
        .xmd-required { color: #b64526; }
        .xmd-phone-control {
          display: flex;
          min-height: 48px;
          overflow: hidden;
          border: 1.5px solid #aab6bf;
          border-radius: 11px;
          background: #fff;
          transition: border-color .15s ease, box-shadow .15s ease;
        }
        .xmd-phone-control:focus-within {
          border-color: #248caf;
          box-shadow: 0 0 0 3px rgba(128, 213, 240, .32);
        }
        .xmd-prefix {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 0 11px;
          border-right: 1px solid #e0e5e8;
          background: #f5f8f9;
          color: #425465;
          font-size: 13px;
          font-weight: 750;
        }
        .xmd-text-input {
          width: 100%;
          min-width: 0;
          min-height: 48px;
          padding: 0 13px;
          border: 1.5px solid #aab6bf;
          border-radius: 11px;
          background: white;
          color: var(--xmd-ink);
          font: inherit;
          font-size: 14px;
          transition: border-color .15s ease, box-shadow .15s ease;
        }
        .xmd-phone-control .xmd-text-input {
          min-height: 45px;
          border: 0;
          border-radius: 0;
          outline: 0;
          box-shadow: none;
        }
        .xmd-text-input::placeholder { color: #9aa5ae; }
        .xmd-text-input:focus-visible { border-color: #248caf; }
        .xmd-inline-error { margin: 0; color: #a3442c; font-size: 11px; }
        .xmd-copy-status { min-height: 14px; margin: 5px 0 0; color: #367086; font-size: 10px; }
        .xmd-actions { display: flex; gap: 10px; margin-top: 2px; }
        .xmd-primary, .xmd-secondary {
          min-height: 48px;
          display: inline-flex;
          flex: 1;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 0 12px;
          border: 1.5px solid var(--xmd-ink);
          border-radius: 12px;
          font: inherit;
          font-size: 13px;
          font-weight: 850;
          cursor: pointer;
          transition: background .16s ease, transform .16s ease, opacity .16s ease;
        }
        .xmd-primary { background: var(--xmd-orange); color: var(--xmd-ink); }
        .xmd-primary:hover:not(:disabled) { transform: translateY(-1px); background: #ff9946; }
        .xmd-primary:disabled {
          border-color: #c5ccd1;
          background: #e8ecee;
          color: #89939a;
          cursor: not-allowed;
          box-shadow: none;
        }
        .xmd-secondary { background: white; color: var(--xmd-ink); }
        .xmd-secondary:hover { background: #edf8fb; }
        .xmd-pending-panel { padding-top: 26px; text-align: center; }
        .xmd-pending-icon {
          width: 66px;
          height: 66px;
          display: grid;
          place-items: center;
          margin: 0 auto 15px;
          border: 2px solid var(--xmd-ink);
          border-radius: 22px 22px 22px 7px;
          background: var(--xmd-sky);
          color: var(--xmd-ink);
          transform: rotate(-3deg);
        }
        .xmd-pending-icon svg { transform: rotate(3deg); }
        .xmd-pending-panel .xmd-title { font-size: 23px; }
        .xmd-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin: 13px 0 16px;
          padding: 7px 10px;
          border: 1px solid #9ddcec;
          border-radius: 999px;
          background: #e9f9fd;
          color: #155e75;
          font-size: 11px;
          font-weight: 850;
        }
        .xmd-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #2696b6;
          box-shadow: 0 0 0 3px rgba(38,150,182,.13);
        }
        .xmd-summary {
          margin: 0;
          padding: 12px 13px;
          border: 1px solid #d8e0e5;
          border-radius: 13px;
          background: #f8fafb;
          text-align: left;
        }
        .xmd-summary-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 7px 0;
          border-bottom: 1px solid #e7ecef;
          color: #687581;
          font-size: 12px;
        }
        .xmd-summary-row:last-child { border-bottom: 0; }
        .xmd-summary-row strong {
          max-width: 65%;
          color: var(--xmd-ink);
          font-weight: 800;
          text-align: right;
          overflow-wrap: anywhere;
        }
        .xmd-pending-copy {
          max-width: 310px;
          margin: 15px auto 18px;
          color: var(--xmd-muted);
          font-size: 12px;
          line-height: 1.5;
        }
        .xmd-pending-panel .xmd-actions { margin-top: 0; }
        @media (max-width: 420px) {
          .xmd-shell { padding: 19px 14px 30px; }
          .xmd-brandbar { margin-bottom: 19px; }
          .xmd-panel { padding: 18px 15px 17px; border-radius: 17px; }
          .xmd-progress { margin-bottom: 17px; }
          .xmd-progress-item { font-size: 9px; }
          .xmd-operator { min-height: 72px; }
          .xmd-destination-number { font-size: 20px; letter-spacing: .045em; }
          .xmd-copy { min-width: 78px; }
          .xmd-actions { gap: 8px; }
          .xmd-primary, .xmd-secondary { padding: 0 9px; font-size: 12px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .xmd-shell *, .xmd-shell *::before, .xmd-shell *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>

      <div className="xmd-wrap">
        <div className="xmd-brandbar">
          <div className="xmd-brand" aria-label="XPENG">
            <span className="xmd-brand-mark" aria-hidden="true">X</span>
            <span>XPENG</span>
          </div>
          <span className="xmd-secure"><ShieldCheck size={15} /> Dépôt sécurisé</span>
        </div>

        <header className="xmd-heading-row">
          {step !== "operator" && (
            <button
              className="xmd-back"
              type="button"
              onClick={goBack}
              aria-label={step === "pending" ? "Retour aux informations du dépôt" : "Retour au choix de l’opérateur"}
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <p className="xmd-amount-label">Montant du dépôt</p>
            <p className="xmd-amount">5 000 <small>CDF</small></p>
          </div>
        </header>

        {step === "operator" && (
          <section className="xmd-panel" aria-labelledby="xmd-operator-title">
            <DepositProgress active={1} />
            <h1 className="xmd-title" id="xmd-operator-title">Choisissez votre opérateur</h1>
            <p className="xmd-subtitle">Sélectionnez le service utilisé pour envoyer votre dépôt.</p>
            <div className="xmd-operator-list">
              {operators.map((operator) => (
                <button
                  className="xmd-operator"
                  key={operator.id}
                  type="button"
                  onClick={() => {
                    setSelectedOperatorId(operator.id);
                    setStep("details");
                  }}
                  aria-label={`Continuer avec ${operator.name}`}
                >
                  <span className="xmd-operator-mark" style={{ background: operator.color }} aria-hidden="true">
                    {operator.mark}
                  </span>
                  <span className="xmd-operator-copy">
                    <span className="xmd-operator-name">{operator.name}</span>
                    <span className="xmd-operator-hint">Paiement mobile money</span>
                  </span>
                  <ArrowRight className="xmd-operator-arrow" size={19} aria-hidden="true" />
                </button>
              ))}
            </div>
            <p className="xmd-note">
              <ShieldCheck size={15} aria-hidden="true" />
              Choisissez le même opérateur que celui utilisé pour votre transfert.
            </p>
          </section>
        )}

        {step === "details" && (
          <section className="xmd-panel" aria-labelledby="xmd-details-title">
            <DepositProgress active={2} />
            <h1 className="xmd-title" id="xmd-details-title">Envoyez votre dépôt</h1>
            <p className="xmd-subtitle">Effectuez le transfert, puis indiquez les informations de votre reçu.</p>

            <div className="xmd-transfer-note">
              <span aria-hidden="true">•</span>
              <span>Transférez <b>5 000 CDF</b> au numéro ci-dessous avec <strong>{selectedOperator.name}</strong>.</span>
            </div>

            <div className="xmd-destination" aria-label="Numéro de dépôt">
              <div className="xmd-destination-top">
                <span>Numéro de réception</span>
                <span className="xmd-network-tag">{selectedOperator.name}</span>
              </div>
              <div className="xmd-destination-line">
                <span className="xmd-destination-number">{selectedOperator.number}</span>
                <button
                  className={`xmd-copy${copied ? " is-copied" : ""}`}
                  type="button"
                  onClick={copyDestination}
                  aria-label={copied ? "Numéro copié" : "Copier le numéro de réception"}
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? "Copié" : "Copier"}
                </button>
              </div>
              <p className="xmd-copy-status" role="status" aria-live="polite">
                {copied ? "Numéro copié dans le presse-papiers." : copyError ? "Copie impossible. Vous pouvez saisir le numéro manuellement." : ""}
              </p>
            </div>

            <form
              className="xmd-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (isFormValid) setStep("pending");
              }}
            >
              <div className="xmd-field">
                <label className="xmd-label" htmlFor="xmd-payer-phone">Téléphone du payeur <span className="xmd-required">*</span></label>
                <div className="xmd-phone-control">
                  <span className="xmd-prefix"><span aria-hidden="true">+</span>228</span>
                  <input
                    className="xmd-text-input"
                    id="xmd-payer-phone"
                    name="payerPhone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    placeholder="Ex. 90 12 34 56"
                    value={payerPhone}
                    onChange={(event) => setPayerPhone(event.target.value)}
                    required
                    aria-required="true"
                    aria-describedby="xmd-phone-help"
                  />
                </div>
                <p className="xmd-inline-error" id="xmd-phone-help">Saisissez le numéro utilisé pour effectuer le transfert.</p>
              </div>

              <div className="xmd-field">
                <label className="xmd-label" htmlFor="xmd-transaction-id">Identifiant de transaction <span className="xmd-required">*</span></label>
                <input
                  className="xmd-text-input"
                  id="xmd-transaction-id"
                  name="transactionId"
                  type="text"
                  autoComplete="off"
                  placeholder="ID indiqué dans le SMS ou sur le reçu"
                  value={transactionId}
                  onChange={(event) => setTransactionId(event.target.value)}
                  required
                  aria-required="true"
                />
              </div>

              <div className="xmd-actions">
                <button className="xmd-secondary" type="button" onClick={goBack}>
                  <ArrowLeft size={16} /> Retour
                </button>
                <button className="xmd-primary" type="submit" disabled={!isFormValid}>
                  Envoyer la demande <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </section>
        )}

        {step === "pending" && (
          <section className="xmd-panel xmd-pending-panel" aria-labelledby="xmd-pending-title" aria-live="polite">
            <DepositProgress active={3} />
            <div className="xmd-pending-icon" aria-hidden="true"><CheckCircle2 size={39} strokeWidth={2.2} /></div>
            <h1 className="xmd-title" id="xmd-pending-title">Demande envoyée</h1>
            <div className="xmd-status"><span className="xmd-status-dot" aria-hidden="true" /> En attente de validation</div>
            <dl className="xmd-summary">
              <div className="xmd-summary-row"><dt>Opérateur</dt><dd><strong>{selectedOperator.name}</strong></dd></div>
              <div className="xmd-summary-row"><dt>Montant</dt><dd><strong>5 000 CDF</strong></dd></div>
              <div className="xmd-summary-row"><dt>Téléphone payeur</dt><dd><strong>+228 {payerPhone}</strong></dd></div>
              <div className="xmd-summary-row"><dt>ID de transaction</dt><dd><strong>{transactionId}</strong></dd></div>
            </dl>
            <p className="xmd-pending-copy">
              Votre reçu a été transmis pour vérification. Le dépôt sera ajouté à votre solde après validation.
            </p>
            <div className="xmd-actions">
              <button className="xmd-secondary" type="button" onClick={goBack}>
                <ArrowLeft size={16} /> Modifier les informations
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}