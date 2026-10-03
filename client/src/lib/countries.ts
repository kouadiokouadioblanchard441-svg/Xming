import { RDC_COUNTRY, SUPPORTED_COUNTRY_CODE } from "@shared/country-config";

// RDC is the only supported country; this also keeps forms usable before the API loads.
export const COUNTRIES = [
  {
    code: SUPPORTED_COUNTRY_CODE,
    name: RDC_COUNTRY.shortName,
    flag: RDC_COUNTRY.flag,
    currency: RDC_COUNTRY.currency,
    paymentMethods: [...RDC_COUNTRY.operators],
  },
];

export const FALLBACK_COUNTRIES = [RDC_COUNTRY];

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

function normalizeCurrency(currency: string): string {
  return currency === "FCFA" ? "CDF" : currency;
}

export function parseOperators(operatorsJson: string): string[] {
  try {
    return JSON.parse(operatorsJson);
  } catch {
    return [];
  }
}

export function getCountryByCode(code: string, apiCountries?: ApiCountry[]) {
  if (code !== SUPPORTED_COUNTRY_CODE) return undefined;
  if (apiCountries && apiCountries.length > 0) {
    // API data is loaded — only use it, never fall back to hardcoded data
    // This ensures disabled countries and updated operators are respected
    const c = apiCountries.find(c => c.code === code && c.isActive);
    if (!c) return undefined;
    return {
      code: c.code,
      name: c.name,
      currency: normalizeCurrency(c.currency),
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
    currency: normalizeCurrency(fallback.currency),
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
