"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pencil } from "lucide-react";
import {
  updateProductAvailability,
  deleteProduct,
  updateStockQuantity,
} from "@/lib/admin/actions";
import type { AdminProduct } from "@/lib/data/admin";
import { formatPrice } from "@/components/sections/productFormat";

interface AdminProductsProps {
  products: AdminProduct[];
}

function AvailabilityToggle({ product }: { product: AdminProduct }) {
  const [state, action, isPending] = useActionState(updateProductAvailability, null);
  const nextValue = !product.is_available;

  return (
    <form action={action} className="inline-flex items-center gap-2">
      <input type="hidden" name="productId" value={product.id} />
      <input type="hidden" name="isAvailable" value={nextValue ? "true" : "false"} />
      <button
        type="submit"
        disabled={isPending}
        className={`cursor-pointer disabled:cursor-not-allowed rounded-sm px-3 py-1.5 font-heading text-[13px] uppercase tracking-widest transition-colors ${
          product.is_available
            ? "bg-green-100 text-green-700 hover:bg-green-200"
            : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
        }`}
      >
        {isPending ? "…" : product.is_available ? "Available" : "Unavailable"}
      </button>
      {state && (
        <p className={`font-body font-medium text-lg ${state.success ? "text-green-600" : "text-terracotta"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}

function StockQuickUpdate({ product }: { product: AdminProduct }) {
  const [editing, setEditing] = useState(false);
  const [state, action, isPending] = useActionState(updateStockQuantity, null);

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="cursor-pointer flex items-center gap-1 font-body font-medium text-lg text-neutral-500 transition-colors hover:text-neutral-500"
        title="Click to edit stock"
      >
        Stock: {product.stock_quantity}
        <Pencil size={10} strokeWidth={1.5} />
      </button>
    );
  }

  return (
    <form
      action={action}
      onSubmit={() => setEditing(false)}
      className="flex items-center gap-2"
    >
      <input type="hidden" name="productId" value={product.id} />
      <input
        name="stockQuantity"
        type="number"
        min="0"
        defaultValue={product.stock_quantity}
        autoFocus
        className="w-20 border border-neutral-200 bg-white px-2 py-1 font-body font-medium text-lg text-neutral-500 outline-none focus:border-brown"
      />
      <button
        type="submit"
        disabled={isPending}
        className="cursor-pointer disabled:cursor-not-allowed font-heading text-[12px] uppercase tracking-widest text-brown hover:text-neutral-500"
      >
        {isPending ? "…" : "Save"}
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="cursor-pointer font-heading text-[12px] uppercase tracking-widest text-neutral-500 hover:text-neutral-500"
      >
        Cancel
      </button>
      {state && (
        <p className={`font-body font-medium text-lg ${state.success ? "text-green-600" : "text-terracotta"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}

function DeleteProduct({ productId, productName }: { productId: string; productName: string }) {
  const [state, action, isPending] = useActionState(deleteProduct, null);

  return (
    <form
      action={action}
      className="inline"
      onSubmit={(e) => {
        if (!confirm(`Delete "${productName}"? This cannot be undone.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="productId" value={productId} />
      <button
        type="submit"
        disabled={isPending}
        className="cursor-pointer disabled:cursor-not-allowed font-body font-medium text-lg text-terracotta underline decoration-terracotta/30 underline-offset-4 transition-colors hover:text-terracotta/80"
      >
        {isPending ? "Deleting…" : "Delete"}
      </button>
      {state && (
        <p
          className={`ml-2 inline font-body font-medium text-lg ${state.success ? "text-green-600" : "text-terracotta"}`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

// ─── Search + Filter Bar ──────────────────────────────────────────────────────

interface FilterBarProps {
  search: string;
  onSearch: (v: string) => void;
  filter: string;
  onFilter: (v: string) => void;
}

function FilterBar({ search, onSearch, filter, onFilter }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="search"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search products…"
        className="border border-neutral-200 bg-white px-3 py-2 font-body font-medium text-lg text-neutral-500 outline-none transition-colors focus:border-neutral-500 sm:w-64"
      />
      <select
        value={filter}
        onChange={(e) => onFilter(e.target.value)}
        className="border border-neutral-200 bg-white px-3 py-2 font-body font-medium text-lg text-neutral-500 outline-none transition-colors focus:border-neutral-500"
      >
        <option value="all">All</option>
        <option value="available">Available</option>
        <option value="unavailable">Unavailable</option>
      </select>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminProducts({ products }: AdminProductsProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PER_PAGE = 12;

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "available" && p.is_available) ||
      (filter === "unavailable" && !p.is_available);
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-heading text-2xl font-light text-neutral-500">
          Products
          <span className="ml-2 font-body text-lg font-normal text-neutral-500">
            ({filtered.length})
          </span>
        </h2>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/new"
            className="bg-brown px-4 py-2 font-heading text-[13px] uppercase tracking-widest text-beige-light transition-colors hover:bg-neutral-500"
          >
            Add Product
          </Link>
          <a
            href="/api/admin/export/products"
            className="border border-neutral-200 px-4 py-2 font-heading text-[13px] uppercase tracking-widest text-neutral-500 transition-colors hover:border-brown hover:text-brown"
          >
            Export CSV
          </a>
        </div>
      </div>

      <FilterBar
        search={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        filter={filter}
        onFilter={(v) => { setFilter(v); setPage(1); }}
      />

      {paginated.length === 0 ? (
        <p className="font-body font-medium text-neutral-500">No products found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {paginated.map((product) => {
            // Same rule the storefront uses, so this grid shows the photo customers will see.
            const orderedImages = [...(product.product_images ?? [])].sort(
              (a, b) => a.position - b.position,
            );
            const image =
              orderedImages.find((img) => img.is_featured)?.url ??
              orderedImages[0]?.url ??
              "/images/logo.png";
            return (
              <div
                key={product.id}
                className="flex flex-col border border-neutral-100 bg-white p-4 transition-colors hover:border-brown/30"
              >
                <div className="relative h-48 w-full overflow-hidden bg-pink-100">
                  <Image
                    src={image}
                    alt={product.name}
                    fill
                    className="object-cover object-left"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="mt-4 flex flex-1 flex-col justify-between">
                  <div>
                    <p className="font-body text-lg font-semibold text-neutral-500">
                      {product.name}
                    </p>
                    <p className="mt-1 font-body font-medium text-lg text-neutral-500">
                      {formatPrice(product.price)}
                    </p>
                    <div className="mt-1">
                      <StockQuickUpdate product={product} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4">
                    <AvailabilityToggle product={product} />
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="font-body font-medium text-lg text-neutral-500 underline decoration-neutral-200 underline-offset-4 transition-colors hover:text-brown"
                      >
                        Edit
                      </Link>
                      <DeleteProduct productId={product.id} productName={product.name} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {/* flex-wrap: a large catalogue has enough pages to overrun a phone (and a tablet) in one row. */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="cursor-pointer disabled:cursor-not-allowed border border-neutral-200 px-3 py-1.5 font-heading text-[13px] uppercase tracking-widest text-neutral-500 transition-colors hover:border-brown hover:text-brown disabled:opacity-40"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`cursor-pointer border px-3 py-1.5 font-heading text-[13px] uppercase tracking-widest transition-colors ${
                p === page
                  ? "border-brown bg-brown text-beige-light"
                  : "border-neutral-200 text-neutral-500 hover:border-brown hover:text-brown"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="cursor-pointer disabled:cursor-not-allowed border border-neutral-200 px-3 py-1.5 font-heading text-[13px] uppercase tracking-widest text-neutral-500 transition-colors hover:border-brown hover:text-brown disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
