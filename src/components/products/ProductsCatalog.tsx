"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { ProductCard } from "@/components/sections/ProductCard";
import { CollectionEyebrow as Eyebrow } from "@/components/collection/Eyebrow";
import { productCategories, type CatalogProduct } from "./productTypes";

interface PriceBand {
  value: string;
  label: string;
  matches: (price: number) => boolean;
}

// Whole rupees, no decimals — matches the original hand-written labels. formatPrice() is the
// product-facing formatter and always shows paise, which reads wrong in a filter.
const bandPrice = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/**
 * Price bands derived from the catalogue's own spread, rather than three rupee figures hardcoded
 * to today's five products. With the old fixed list, adding a ₹20,000 piece left "Above ₹8,500" as
 * the only bucket that could ever match it and "Under ₹8,000" quietly stopped meaning "the
 * affordable end". Against the current catalogue this reproduces the previous bands exactly.
 */
function buildPriceBands(prices: number[]): PriceBand[] {
  if (prices.length < 2) return [];
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return [];

  const STEP = 500;
  const roundToStep = (n: number) => Math.round(n / STEP) * STEP;
  const lower = roundToStep(min + (max - min) / 3);
  const upper = roundToStep(min + ((max - min) * 2) / 3);

  // A narrow spread can round both thirds onto the same figure, which would render two bands with
  // identical labels and one that can never match. Collapse to two.
  if (upper <= lower) {
    return [
      { value: "under", label: `Under ${bandPrice(lower)}`, matches: (p) => p < lower },
      { value: "over", label: `${bandPrice(lower)} & Above`, matches: (p) => p >= lower },
    ];
  }

  return [
    { value: "under", label: `Under ${bandPrice(lower)}`, matches: (p) => p < lower },
    {
      value: "mid",
      label: `${bandPrice(lower)} – ${bandPrice(upper)}`,
      matches: (p) => p >= lower && p <= upper,
    },
    { value: "over", label: `Above ${bandPrice(upper)}`, matches: (p) => p > upper },
  ];
}

const sortOptions = [
  // "Featured", not "Popularity": this option applies no sort of its own, it keeps the order the
  // products arrive in — products.sort_order, which the client sets as "Display Order" in
  // Admin → Products. Nothing here has ever measured popularity.
  { value: "featured", label: "Sort: Featured" },
  { value: "price-asc", label: "Sort: Price, Low to High" },
  { value: "price-desc", label: "Sort: Price, High to Low" },
  { value: "name-asc", label: "Sort: Name, A–Z" },
];


export function ProductsCatalog({
  products,
  initialCategory = "all",
}: {
  products: CatalogProduct[];
  initialCategory?: string;
}) {
  const [category, setCategory] = useState(initialCategory);
  const [price, setPrice] = useState("");
  const [sort, setSort] = useState("featured");

  const isDefault = category === "all" && price === "" && sort === "featured";

  const priceBands = useMemo(
    () => buildPriceBands(products.map((product) => product.price)),
    [products],
  );

  const filtered = useMemo(() => {
    const band = priceBands.find((b) => b.value === price);
    const list = products
      .filter((product) => category === "all" || product.category === category)
      .filter((product) => (band ? band.matches(product.price) : true));

    if (sort === "price-asc") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") return [...list].sort((a, b) => b.price - a.price);
    if (sort === "name-asc") return [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, category, price, sort, priceBands]);

  function reset() {
    setCategory("all");
    setPrice("");
    setSort("featured");
  }

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
        <div className="text-center">
          <Eyebrow>{products.length} Pieces</Eyebrow>
          <h2 className="mt-3 font-heading text-3xl text-neutral-500 sm:text-4xl">
            Every Piece, In Full
          </h2>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-b border-neutral-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body text-sm text-neutral-300">
            Showing <span className="font-semibold text-neutral-500">{filtered.length}</span> of{" "}
            <span className="font-semibold text-neutral-500">{products.length}</span> pieces
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {productCategories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setCategory(cat.key)}
                aria-pressed={category === cat.key}
                className={`cursor-pointer border px-5 py-2.5 font-heading text-[11px] uppercase tracking-[0.12em] transition-colors duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-brown focus-visible:ring-offset-2 focus-visible:ring-offset-beige-light ${
                  category === cat.key
                    ? "border-brown bg-pink-200 text-brown"
                    : "border-neutral-100 text-neutral-400 hover:border-brown hover:text-brown"
                }`}
              >
                {cat.label}
              </button>
            ))}

            {/* Hidden when every piece costs the same (or there is only one), where a price
                filter can only ever return everything or nothing. */}
            {priceBands.length > 0 && (
              <div className="relative">
                <select
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  aria-label="Filter by price"
                  className="appearance-none border border-neutral-100 bg-transparent px-5 py-2.5 pr-10 font-heading text-[11px] uppercase tracking-[0.12em] text-neutral-400 transition-colors duration-200 hover:border-brown hover:text-brown focus:outline-none"
                >
                  <option value="">Filter By Price</option>
                  {priceBands.map((band) => (
                    <option key={band.value} value={band.value}>
                      {band.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brown"
                  strokeWidth={1.5}
                />
              </div>
            )}

            <div className="relative">
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                aria-label="Sort products"
                className="appearance-none border border-neutral-100 bg-transparent px-5 py-2.5 pr-10 font-heading text-[11px] uppercase tracking-[0.12em] text-neutral-400 transition-colors duration-200 hover:border-brown hover:text-brown focus:outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brown"
                strokeWidth={1.5}
              />
            </div>

            <button
              type="button"
              onClick={reset}
              disabled={isDefault}
              className="cursor-pointer disabled:cursor-not-allowed font-heading text-[11px] uppercase tracking-[0.12em] text-neutral-300 underline underline-offset-4 transition-colors duration-200 hover:text-brown disabled:pointer-events-none disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-8 sm:gap-y-12 lg:grid-cols-3">
            {filtered.map((product) => (
              <ProductCard key={product.name} {...product} />
            ))}
          </div>
        ) : (
          <p className="mt-16 text-center font-body text-neutral-300">
            New pieces are on their way — check back soon.
          </p>
        )}
      </div>
    </section>
  );
}
