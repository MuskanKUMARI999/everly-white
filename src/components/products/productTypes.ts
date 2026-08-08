export interface ProductCategory {
  key: string;
  label: string;
}

export const productCategories: ProductCategory[] = [
  { key: "all", label: "All Pieces" },
  { key: "center-pieces", label: "Center Pieces" },
  { key: "coming-soon", label: "Coming Soon" },
];

export interface CatalogProduct {
  /** DB uuid — present when sourced from Supabase; absent for hardcoded/fallback products. */
  id?: string;
  /**
   * The `slug` column, which is what every server-side lookup matches on. Absent only for the
   * hardcoded fallback products; read it through productSlug() rather than directly.
   */
  slug?: string;
  name: string;
  price: number;
  image: string;
  hoverImage?: string;
  tagline: string;
  description: string;
  story: string;
  dimensions?: string;
  composition?: string;
  /** Editable in Admin → Products; each surfaces in the product-page accordion when filled in. */
  weight?: string;
  careInstructions?: string;
  makingTime?: string;
  shippingInfo?: string;
  galleryImages?: { src: string; alt: string }[];
  videos?: string[];
  category: string;
  collectionSlug: string;
  /** Units in stock, so the product page's quantity stepper can stop at the real limit. */
  stock?: number;
  /** Shows the "Flagship" badge on the card. Set per-product in Admin → Products. */
  isFlagship?: boolean;
}
