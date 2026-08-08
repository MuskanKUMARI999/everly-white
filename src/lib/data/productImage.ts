/**
 * Choosing a product's main photo, in one place.
 *
 * PostgREST makes no promise about the order of an embedded array, so reading `product_images[0]`
 * straight off a response is a coin toss: the cart thumbnail, the checkout summary and the photo
 * frozen onto an order line could each land on the specifications sheet instead of the pair shot,
 * and could differ from the card the customer clicked.
 *
 * Sort first, then choose — is_featured wins, lowest `position` is the deterministic fallback. This
 * matches mapProductToCatalog in components/products/productsData.ts; the cart, wishlist and order
 * snapshot don't go through that mapper, which is why the rule lives here rather than beside it.
 */
export interface ProductImageRef {
  url: string;
  position?: number | null;
  is_featured?: boolean | null;
}

function orderByPosition<T extends ProductImageRef>(images: T[]): T[] {
  return images.slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

export function primaryProductImage(images: ProductImageRef[] | null | undefined): string | null {
  if (!images?.length) return null;
  const ordered = orderByPosition(images);
  return ordered.find((img) => img.is_featured)?.url ?? ordered[0]?.url ?? null;
}

/**
 * The hover-swap photo: the next distinct image after the primary one. Matched on "first url that
 * isn't the primary" rather than `position === 1`, because deleting an image leaves gaps in the
 * sequence and a position-based match then silently loses the hover.
 */
export function hoverProductImage(
  images: ProductImageRef[] | null | undefined,
  primaryUrl: string | null,
): string | undefined {
  if (!images?.length) return undefined;
  return orderByPosition(images).find((img) => img.url !== primaryUrl)?.url;
}

/** Shared last-resort thumbnail when a product has no photos at all. */
export const FALLBACK_PRODUCT_IMAGE = "/images/logo.png";
