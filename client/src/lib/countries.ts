// Fallback country data (used if API not available)
export const COUNTRIES = [
  { code: "CI", name: "Côte d'Ivoire", flag: "CI", currency: "FCFA", paymentMethods: ["Orange CI", "MTN CI", "Wave CI", "Moov Africa CI"] },
  { code: "BF", name: "Burkina Faso",  flag: "BF", currency: "FCFA", paymentMethods: ["Orange Burkina", "Moov Africa Burkina", "Telecel Burkina"] },
  { code: "ML", name: "Mali",          flag: "ML", currency: "FCFA", paymentMethods: ["Orange Mali", "Moov Africa Mali", "Telecel Mali"] },
  { code: "BJ", name: "Bénin",         flag: "BJ", currency: "FCFA", paymentMethods: ["MTN Bénin", "Moov Africa Bénin"] },
];

export const FALLBACK_COUNTRIES = [
  { code: "CI", name: "Côte d'Ivoire", currency: "FCFA", phonePrefix: "225", phoneLength: 10, operators: ["Orange CI", "MTN CI", "Wave CI", "Moov Africa CI"] },
  { code: "BF", name: "Burkina Faso",  currency: "FCFA", phonePrefix: "226", phoneLength: 8,  operators: ["Orange Burkina", "Moov Africa Burkina", "Telecel Burkina"] },
  { code: "ML", name: "Mali",          currency: "FCFA", phonePrefix: "223", phoneLength: 8,  operators: ["Orange Mali", "Moov Africa Mali", "Telecel Mali"] },
  { code: "BJ", name: "Bénin",         currency: "FCFA", phonePrefix: "229", phoneLength: 9,  operators: ["MTN Bénin", "Moov Africa Bénin"] },
];

/** Retourne le nombre de chiffres attendu pour un numéro de téléphone selon le pays. */
export function getPhoneLength(countryCode: string): number {
  const c = FALLBACK_COUNTRIES.find(c => c.code === countryCode);
  return c?.phoneLength ?? 8;
}

// Legacy compatibility - kept for places still using ELIGIBLE_COUNTRIES directly
export const ELIGIBLE_COUNTRIES = FALLBACK_COUNTRIES.map(c => ({
  code: c.code,
  name: c.name,
  flag: c.code,
  currency: c.currency,
  phonePrefix: c.phonePrefix,
  paymentMethods: c.operators,
})) as readonly { code: string; name: string; flag: string; currency: string; phonePrefix: string; paymentMethods: readonly string[] }[];

export type ApiCountry = {
  id: number;
  code: string;
  name: string;
  currency: string;
  phonePrefix: string;
  operators: string; // JSON string
  isActive: boolean;
  autoPaymentEnabled: boolean;
};

export function parseOperators(operatorsJson: string): string[] {
  try {
    return JSON.parse(operatorsJson);
  } catch {
    return [];
  }
}

export function getCountryByCode(code: string, apiCountries?: ApiCountry[]) {
  if (apiCountries && apiCountries.length > 0) {
    // API data is loaded — only use it, never fall back to hardcoded data
    // This ensures disabled countries and updated operators are respected
    const c = apiCountries.find(c => c.code === code && c.isActive);
    if (!c) return undefined;
    return {
      code: c.code,
      name: c.name,
      currency: c.currency,
      phonePrefix: c.phonePrefix,
      paymentMethods: parseOperators(c.operators),
    };
  }
  // API not yet loaded — use hardcoded fallback temporarily
  const fallback = FALLBACK_COUNTRIES.find(c => c.code === code);
  if (!fallback) return undefined;
  return {
    code: fallback.code,
    name: fallback.name,
    currency: fallback.currency,
    phonePrefix: fallback.phonePrefix,
    paymentMethods: fallback.operators,
  };
}

export function getPaymentMethodsForCountry(code: string, apiCountries?: ApiCountry[]): string[] {
  const country = getCountryByCode(code, apiCountries);
  return country ? [...country.paymentMethods] : [];
}

export function formatCurrency(amount: number, countryCode: string, apiCountries?: ApiCountry[]): string {
  const country = getCountryByCode(countryCode, apiCountries);
  const currency = country?.currency || "USDT";
  return `${amount.toLocaleString()} ${currency}`;
}
