export function formatPrice(price: number) {
  return `₹ ${price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * The slug a product is actually addressed by.
 *
 * Everything that resolves a product server-side matches on the `slug` COLUMN — the product page
 * (`getProductBySlug`), add-to-cart (`cart/actions.ts`) and the wishlist (`productIdForSlug`) all
 * do `.eq("slug", slug)`. The UI, however, used to rebuild the slug from the product NAME. Those
 * agree only while nobody touches the admin panel's Slug field or renames a piece; the moment they
 * diverge the product 404s and can no longer be added to a cart or wishlist at all.
 *
 * So the stored slug always wins. `slugify(name)` remains only as the fallback for the hardcoded
 * design-reference products, which have no slug of their own.
 */
export function productSlug(product: { slug?: string; name: string }) {
  return product.slug?.trim() || slugify(product.name);
}
