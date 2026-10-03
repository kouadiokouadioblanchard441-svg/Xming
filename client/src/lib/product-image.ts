const XPENG_PRODUCT_IMAGES = [
  "/xpeng-product-1.jpg",
  "/xpeng-product-2.jpg",
  "/xpeng-product-4.jpg",
  "/xpeng-product-5.jpg",
  "/xpeng-product-6.jpg",
  "/xpeng-product-7.jpg",
  "/xpeng-product-8.jpg",
  "/xpeng-product-12.jpg",
  "/xpeng-product-9.jpg",
  "/xpeng-product-10.jpg",
  "/xpeng-product-11.jpg",
  "/xpeng-product-3.jpg",
];

const NON_VEHICLE_PRODUCT_IMAGE = /power[\s_-]?bank|portable[\s_-]?charger|vestas_112v/i;

export function getProductImageUrl(
  imageUrl?: string | null,
  fallbackOrder = 1,
): string {
  const value = imageUrl?.trim() ?? "";
  if (value && !NON_VEHICLE_PRODUCT_IMAGE.test(value)) return value;

  const legacyNumber = value.match(/power[\s_-]?bank[-_]?(\d+)/i);
  const requestedOrder = Number(legacyNumber?.[1] ?? fallbackOrder);
  const imageIndex = Number.isFinite(requestedOrder) && requestedOrder > 0
    ? Math.trunc(requestedOrder) - 1
    : 0;

  return XPENG_PRODUCT_IMAGES[imageIndex % XPENG_PRODUCT_IMAGES.length];
}