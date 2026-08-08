import type { Metadata } from "next";
import Link from "next/link";
import { Compass, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CollectionEyebrow as Eyebrow } from "@/components/collection/Eyebrow";

export const metadata: Metadata = {
  title: "Page Not Found",
  // A 404 has nothing worth indexing, and letting it into search results competes with the real
  // pages. The status code alone is not always enough — Next streams 200 for streamed responses.
  robots: { index: false, follow: true },
};

// Renders inside the root layout, so the header, footer and cart badge stay put — a mistyped URL
// should feel like a wrong turn inside the shop, not like the site fell over. Replaces Next's stock
// black-and-white "404: This page could not be found." screen.
const suggestions = [
  { label: "All Products", href: "/products", note: "Every piece, in full" },
  {
    label: "Center of the Universe",
    href: "/collection/center-of-the-universe",
    note: "The debut collection",
  },
  { label: "Journal", href: "/blog", note: "Stories from the studio" },
  { label: "Contact Us", href: "/contact", note: "We'll help you find it" },
];

export default function NotFound() {
  return (
    <main className="py-20 sm:py-28">
      <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-100 text-brown">
            <Compass size={26} strokeWidth={1.3} />
          </span>

          <div className="mt-6">
            <Eyebrow>Error 404</Eyebrow>
          </div>

          <h1 className="mt-3 font-heading text-3xl font-light text-neutral-500 sm:text-4xl">
            This Page Has Wandered Off
          </h1>

          <p className="mx-auto mt-4 max-w-[48ch] font-body text-lg text-neutral-300">
            The page you&rsquo;re looking for doesn&rsquo;t exist, or has moved somewhere new.
            Nothing is lost &mdash; let&rsquo;s get you back to something beautiful.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Button href="/" variant="primary" icon={false}>
              Back to Home
            </Button>
            <Button href="/products" variant="secondary" icon={false}>
              Browse the Collection
            </Button>
          </div>

          {/* No-JS GET form, same as /search — a 404 is exactly where someone wants to search. */}
          <form
            action="/search"
            method="get"
            role="search"
            className="mx-auto mt-12 flex w-full max-w-md items-center gap-3 border-b border-neutral-200 pb-3 focus-within:border-neutral-500"
          >
            <Search size={18} strokeWidth={1.4} className="shrink-0 text-neutral-400" />
            <input
              type="search"
              name="q"
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
        </div>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {suggestions.map(({ label, href, note }) => (
            <Link
              key={href}
              href={href}
              className="group border border-neutral-100 p-6 text-left transition-colors duration-200 hover:bg-pink-100/40"
            >
              <p className="font-heading text-[12.5px] uppercase tracking-[0.1em] text-neutral-500 group-hover:text-brown">
                {label}
              </p>
              <p className="mt-1.5 font-body text-sm text-neutral-300">{note}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
