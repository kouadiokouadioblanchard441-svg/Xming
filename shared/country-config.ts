export const SUPPORTED_COUNTRY_CODE = "CD";

export const RDC_COUNTRY = {
  code: SUPPORTED_COUNTRY_CODE,
  name: "République démocratique du Congo",
  shortName: "RDC",
  flag: "CD",
  currency: "CDF",
  timeZone: "Africa/Kinshasa",
  phonePrefix: "243",
  phoneLength: 9,
  // Only the Mobile Money operators supported in the RDC.
  operators: ["Airtel Money", "M-Pesa", "Orange Money", "Afrimoney"],
  isActive: true,
  autoPaymentEnabled: false,
} as const;