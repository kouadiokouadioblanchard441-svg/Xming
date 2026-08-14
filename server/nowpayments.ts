/**
 * NowPayments integration — singleton SDK + raw Payouts API.
 *
 * The official SDK (@nowpaymentsio/nowpayments-sdk-nodejs) handles:
 *   - Payment creation (createDirectPayment, createCheckout, …)
 *   - IPN signature verification + normalization (parseWebhook)
 *   - JWT auth lifecycle: token caching, expiry detection, auto-refresh
 *
 * The Payouts API (POST /payout, POST /payout/:id/verify, GET /payout/:id)
 * is NOT covered by the SDK v0.2.1, so those calls are made via raw fetch
 * using the SDK's own getJwtToken() for auth — no duplicated token logic.
 */

import { NowPaymentsSDK } from "@nowpaymentsio/nowpayments-sdk-nodejs";

const DEFAULT_PUBLIC_APP_URL = "https://www.gampower.site";

// ---------------------------------------------------------------------------
// Singleton SDK instance
// ---------------------------------------------------------------------------

let _sdk: NowPaymentsSDK | null = null;

/**
 * Returns the shared SDK instance, creating it on first call.
 * Reads env vars at call-time so the instance is created with the correct
 * values even if secrets are injected after module load.
 */
export function getSDK(): NowPaymentsSDK {
  if (_sdk) return _sdk;

  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) throw new Error("NOWPAYMENTS_API_KEY n'est pas configuré");

  _sdk = new NowPaymentsSDK({
    apiKey,
    ...(process.env.NOWPAYMENTS_IPN_SECRET && {
      ipnSecret: process.env.NOWPAYMENTS_IPN_SECRET,
    }),
    // Credentials for JWT-protected endpoints (Payouts API)
    ...(process.env.NOWPAYMENTS_ACCOUNT_EMAIL && {
      email: process.env.NOWPAYMENTS_ACCOUNT_EMAIL,
    }),
    ...(process.env.NOWPAYMENTS_ACCOUNT_PASSWORD && {
      password: process.env.NOWPAYMENTS_ACCOUNT_PASSWORD,
    }),
    // Switch to sandbox by setting NOWPAYMENTS_SANDBOX=true
    ...(process.env.NOWPAYMENTS_SANDBOX === "true" && {
      baseUrl: "https://api-sandbox.nowpayments.io",
    }),
  });

  return _sdk;
}

/** Force re-creation of the singleton (e.g. after env-var changes). */
export function resetSDK(): void {
  _sdk = null;
}

// ---------------------------------------------------------------------------
// Helpers shared by deposit + payout routes
// ---------------------------------------------------------------------------

export function getNowPaymentsCallbackUrl(): string | undefined {
  const baseUrl =
    process.env.APP_URL ||
    DEFAULT_PUBLIC_APP_URL;
  return baseUrl ? `${baseUrl}/api/nowpayments/ipn` : undefined;
}

// ---------------------------------------------------------------------------
// Payouts API — raw fetch, JWT token from the SDK (handles caching + refresh)
// ---------------------------------------------------------------------------

const PAYOUTS_API_BASE =
  process.env.NOWPAYMENTS_SANDBOX === "true"
    ? "https://api-sandbox.nowpayments.io/v1"
    : "https://api.nowpayments.io/v1";

export type NowPaymentsWithdrawal = {
  id?: string;
  batchWithdrawalId?: string;
  batch_withdrawal_id?: string;
  status?: string;
  hash?: string | null;
  error?: string | null;
  address?: string;
  currency?: string;
  amount?: string | number;
};

export type NowPaymentsPayoutResponse = {
  id?: string;
  withdrawals?: NowPaymentsWithdrawal[];
};

export type NowPaymentsPayoutStatus = NowPaymentsWithdrawal & {
  batch_withdrawal_id?: string;
};

async function parsePayoutResponse(
  response: Response,
): Promise<Record<string, unknown>> {
  const text = await response.text();
  let body: Record<string, unknown> = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { message: text };
  }
  if (!response.ok) {
    const message =
      typeof body.message === "string"
        ? body.message
        : typeof body.error === "string"
          ? body.error
          : `NOWPayments API returned HTTP ${response.status}`;
    throw new Error(message);
  }
  return body;
}

async function payoutRequest(
  path: string,
  init: RequestInit = {},
): Promise<Record<string, unknown>> {
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) throw new Error("NOWPayments payouts are not fully configured");

  // Delegate JWT lifecycle entirely to the SDK (caching + auto-refresh).
  // getJwtToken() returns null when email/password are not configured —
  // detect that early so the error message is clear.
  const sdk = getSDK();
  if (!sdk.hasAuthCredentials()) {
    throw new Error(
      "NOWPayments payouts requièrent NOWPAYMENTS_ACCOUNT_EMAIL et NOWPAYMENTS_ACCOUNT_PASSWORD",
    );
  }
  const token = await sdk.getJwtToken();
  if (!token) {
    throw new Error(
      "NOWPayments n'a pas retourné de token JWT — vérifiez vos identifiants",
    );
  }

  const headers = new Headers(init.headers as HeadersInit);
  headers.set("x-api-key", apiKey);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");

  const response = await fetch(`${PAYOUTS_API_BASE}${path}`, {
    ...init,
    headers,
  });
  return parsePayoutResponse(response);
}

/**
 * Create a payout batch with a single withdrawal.
 * Requires NOWPAYMENTS_ACCOUNT_EMAIL + NOWPAYMENTS_ACCOUNT_PASSWORD for JWT.
 */
export async function createPayout(input: {
  address: string;
  currency: string;
  amount: number;
  uniqueExternalId: string;
  description: string;
}): Promise<NowPaymentsPayoutResponse> {
  const callbackUrl = getNowPaymentsCallbackUrl();
  return payoutRequest("/payout", {
    method: "POST",
    body: JSON.stringify({
      ...(callbackUrl ? { ipn_callback_url: callbackUrl } : {}),
      withdrawals: [
        {
          address: input.address,
          currency: input.currency,
          amount: Number(input.amount.toFixed(6)),
          ...(callbackUrl ? { ipn_callback_url: callbackUrl } : {}),
          payout_description: input.description,
          unique_external_id: input.uniqueExternalId,
        },
      ],
    }),
  }) as Promise<NowPaymentsPayoutResponse>;
}

/**
 * Submit the 2FA verification code to release a pending payout batch.
 */
export async function verifyPayout(
  batchWithdrawalId: string,
  verificationCode: string,
): Promise<Record<string, unknown>> {
  return payoutRequest(
    `/payout/${encodeURIComponent(batchWithdrawalId)}/verify`,
    {
      method: "POST",
      body: JSON.stringify({ verification_code: verificationCode }),
    },
  );
}

/**
 * Fetch the current status of a single payout.
 */
export async function getPayoutStatus(
  payoutId: string,
): Promise<NowPaymentsPayoutStatus | NowPaymentsPayoutStatus[]> {
  return payoutRequest(`/payout/${encodeURIComponent(payoutId)}`, {
    method: "GET",
  }) as Promise<NowPaymentsPayoutStatus | NowPaymentsPayoutStatus[]>;
}
