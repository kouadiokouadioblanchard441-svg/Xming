import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { CheckCircle, Loader2, XCircle, Headphones } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export default function DepositCallbackPage() {
  const { refreshUser } = useAuth();
  const { t } = useI18n();

  const { id: depositId } = useParams<{ id: string }>();

  const search = typeof window !== "undefined" ? window.location.search : "";
  const params = new URLSearchParams(search);
  const callbackStatus = params.get("status");
  const ref = params.get("ref");

  const [depositStatus, setDepositStatus] = useState<
    "polling" | "approved" | "rejected" | "timeout"
  >("polling");

  useEffect(() => {
    if (!depositId) return;

    if (callbackStatus === "failed" || callbackStatus === "failure") {
      setDepositStatus("rejected");
      return;
    }

    let attempts = 0;
    const MAX_ATTEMPTS = 60;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const res = await fetch(`/api/deposits/${depositId}/verify`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status === "approved") {
            setDepositStatus("approved");
            refreshUser();
            return;
          }
          if (data.status === "rejected") {
            setDepositStatus("rejected");
            return;
          }
        }
      } catch {
        // network error — keep polling
      }

      attempts++;
      if (attempts >= MAX_ATTEMPTS) {
        setDepositStatus("timeout");
        return;
      }
      timer = setTimeout(poll, 5000);
    };

    timer = setTimeout(poll, 2000);
    return () => clearTimeout(timer);
  }, [depositId, callbackStatus]);

  /* ── Success ── */
  if (depositStatus === "approved") {
    return (
      <Screen>
        <CheckCircle className="w-16 h-16 text-gray-800 mx-auto" />
        <h1 className="text-xl font-bold text-gray-800">{t.depositSuccessTitle}</h1>
        <p className="text-gray-500 text-sm">{t.depositSuccessDesc}</p>
        {ref && (
          <p className="text-xs text-gray-400 font-mono bg-gray-50 rounded-lg px-3 py-1.5">
            {t.depositRefLabel} {ref}
          </p>
        )}
        <Link href="/deposit-history">
          <button
            className="w-full py-3.5 rounded-full text-white font-bold shadow-md"
            style={{ background: "#E8192C" }}
          >
            {t.depositViewHistory}
          </button>
        </Link>
        <Link href="/">
          <button className="w-full py-3 rounded-full text-gray-600 border border-gray-200 text-sm font-medium">
            {t.depositGoHome}
          </button>
        </Link>
      </Screen>
    );
  }

  /* ── Failure ── */
  if (depositStatus === "rejected") {
    return (
      <Screen>
        <XCircle className="w-16 h-16 text-red-400 mx-auto" />
        <h1 className="text-xl font-bold text-gray-800">{t.depositFailTitle}</h1>
        <p className="text-gray-500 text-sm">{t.depositFailDesc}</p>
        <Link href="/deposit">
          <button
            className="w-full py-3.5 rounded-full text-white font-bold shadow-md"
            style={{ background: "#E8192C" }}
          >
            {t.depositRetry}
          </button>
        </Link>
        <Link href="/">
          <button className="w-full py-3 rounded-full text-gray-600 border border-gray-200 text-sm font-medium">
            {t.depositGoHome}
          </button>
        </Link>
      </Screen>
    );
  }

  /* ── Timeout ── */
  if (depositStatus === "timeout") {
    return (
      <Screen>
        <Headphones className="w-16 h-16 text-[#E8192C] mx-auto" />
        <h1 className="text-xl font-bold text-gray-800">{t.depositPendingTitle}</h1>
        <p className="text-gray-500 text-sm">{t.depositPendingDesc}</p>
        {ref && (
          <p className="text-xs text-gray-400 font-mono bg-gray-50 rounded-lg px-3 py-1.5">
            {t.depositRefLabel} {ref}
          </p>
        )}
        <Link href="/service">
          <button
            className="w-full py-3.5 rounded-full text-white font-bold shadow-md"
            style={{ background: "#E8192C" }}
          >
            {t.depositContactSupport}
          </button>
        </Link>
        <Link href="/">
          <button className="w-full py-3 rounded-full text-gray-600 border border-gray-200 text-sm font-medium">
            {t.depositGoHome}
          </button>
        </Link>
      </Screen>
    );
  }

  /* ── Polling / Loading ── */
  return (
    <Screen>
      <h1 className="text-xl font-bold text-gray-800">{t.depositVerifyingTitle}</h1>
      <p className="text-gray-500 text-sm">{t.depositVerifyingDesc}</p>
      <div className="flex gap-2 justify-center pt-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-[#E8192C] animate-bounce"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
    </Screen>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "#0d0d0d" }}
    >
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center space-y-5">
        {children}
      </div>
    </div>
  );
}
