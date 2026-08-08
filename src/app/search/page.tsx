import type { Metadata } from "next";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/sections/ProductCard";
import { CollectionEyebrow as Eyebrow } from "@/components/collection/Eyebrow";
import { getAllProducts, productCategories } from "@/components/products/productsData";
import type { CatalogProduct } from "@/components/products/productTypes";

export const metadata: Metadata = {
  title: "Search — Everly White",
  description: "Search the Everly White catalog of hand-finished, mirror-inlay plates.",
};

const categoryLabel = (key: string) =>
  productCategories.find((cat) => cat.key === key)?.label ?? "";

function matchesQuery(product: CatalogProduct, tokens: string[]) {
  const haystack = [
    product.name,
    product.tagline,
    product.description,
    product.story,
    product.collectionSlug,
    categoryLabel(product.category),
  ]
    .join(" ")
    .toLowerCase();
  // Every whitespace-separated token must appear, so "mirror plate" narrows rather than widens.
  return tokens.every((token) => haystack.includes(token));
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { q } = await searchParams;
  const query = (typeof q === "string" ? q : "").trim();
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);

  const results = tokens.length
    ? (await getAllProducts()).filter((product) => matchesQuery(product, tokens))
    : [];

  return (
    <main className="py-20 sm:py-28">
      <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
        <div className="text-center">
          <Eyebrow>Search</Eyebrow>
          <h1 className="mt-3 font-heading text-3xl text-neutral-500 sm:text-4xl">
            {query ? "Search Results" : "Search The Catalog"}
          </h1>
        </div>

        <form
          action="/search"
          method="get"
          role="search"
          className="mx-auto mt-10 flex max-w-xl items-center gap-3 border-b border-neutral-200 pb-3 focus-within:border-neutral-500"
        >
          <Search size={18} strokeWidth={1.4} className="shrink-0 text-neutral-400" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            autoFocus
            placeholder="Search for a piece…"
            aria-label="Search products"
            className="w-full bg-transparent font-body text-neutral-500 outline-none placeholder:text-neutral-300"
          />
          <button
            type="submit"
            className="cursor-pointer shrink-0 font-heading text-[11px] uppercase tracking-[0.12em] text-brown transition-colors hover:text-neutral-500"
          >
            Search
          </button>
        </form>

        {query && (
          <p className="mt-8 text-center font-body text-sm text-neutral-300">
            {results.length > 0 ? (
              <>
                Showing <span className="font-semibold text-neutral-500">{results.length}</span>{" "}
                {results.length === 1 ? "result" : "results"} for{" "}
                <span className="font-semibold text-neutral-500">&ldquo;{query}&rdquo;</span>
              </>
            ) : (
              <>
                No pieces match{" "}
                <span className="font-semibold text-neutral-500">&ldquo;{query}&rdquo;</span>. Try a
                different search.
              </>
            )}
          </p>
        )}

        {results.length > 0 && (
          <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-8 sm:gap-y-12 lg:grid-cols-3">
            {results.map((product) => (
              <ProductCard key={product.name} {...product} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
