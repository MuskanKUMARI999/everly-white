import "server-only";

import { getAllCollections } from "@/lib/data/collections";
import { getProductsByCollection } from "@/lib/data/products";

// Serializable shape for the header mega-menu. Deliberately free of React component references
// (e.g. icons) so it can cross the server→client boundary as a plain prop — the Header assigns
// decorative icons itself.
export interface NavProduct {
  label: string;
  description: string;
  href: string;
}

export interface NavCollectionData {
  key: string;
  name: string;
  badge?: string;
  image: string;
  imageAlt: string;
  tagline: string;
  href: string;
  items: NavProduct[];
}

const FALLBACK_IMAGE = "/images/instagram/product-coffee-table.jpg";

// Builds the mega-menu from published collections and their available products, so the nav links
// always point at real product slugs (the previous hardcoded list could 404 if a slug changed).
export async function getNavCollections(): Promise<NavCollectionData[]> {
  const collections = await getAllCollections();

  return Promise.all(
    collections.map(async (collection) => {
      const products = await getProductsByCollection(collection.slug);
      // The mega-menu panel is a tall 260px-wide crop, so it wants a different photo from the
      // full-bleed collection page hero; it gets its own image in metadata, same as the homepage
      // tile's metadata.tileImage. hero_image is the fallback when none is set.
      const metadata = (collection.metadata as Record<string, unknown>) ?? {};
      const navImage = typeof metadata.navImage === "string" ? metadata.navImage : null;
      const navImageAlt = typeof metadata.navImageAlt === "string" ? metadata.navImageAlt : null;
      const navTagline = typeof metadata.navTagline === "string" ? metadata.navTagline : null;

      return {
        key: collection.slug,
        name: collection.title,
        image: navImage ?? collection.hero_image ?? FALLBACK_IMAGE,
        imageAlt: navImageAlt ?? collection.title,
        // Design copy is the call-to-action "Discover <Name> Collection", not the collection's
        // poetic subtitle — building it from the title keeps it correct if the client renames one.
        tagline: navTagline ?? `Discover ${collection.title} Collection`,
        href: `/collection/${collection.slug}`,
        items: products.map((product) => {
          // The menu tile is a three-across cell with room for two short lines, so the design gives
          // each product its own one-line blurb rather than reusing the product page's longer
          // tagline (which wrapped to three lines here and knocked the grid out of alignment).
          // Stored per product in metadata, same pattern as the collection's navImage/navTagline.
          const productMeta = (product.metadata as Record<string, unknown>) ?? {};
          const navDescription =
            typeof productMeta.navDescription === "string" ? productMeta.navDescription : null;

          return {
            label: product.name,
            description: navDescription ?? product.tagline ?? "",
            // The product page resolves on the DB slug column, so this link is guaranteed to resolve.
            href: `/products/${product.slug}`,
          };
        }),
      };
    }),
  );
}
