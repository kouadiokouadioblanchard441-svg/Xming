export const SUPPORTED_COUNTRY_CODE = "CD";

export const RDC_COUNTRY = {
  code: SUPPORTED_COUNTRY_CODE,
  name: "République démocratique du Congo",
  shortName: "RDC",
  flag: "CD",
  currency: "CDF",
  phonePrefix: "243",
  phoneLength: 9,
  operators: ["Airtel Money", "M-Pesa", "Orange Money", "Afrimoney"],
  isActive: true,
  autoPaymentEnabled: false,
} as const;