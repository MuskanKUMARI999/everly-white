"use client"; // Error boundaries must be Client Components.

import { useEffect } from "react";
import "./globals.css";

// Last-resort boundary: this fires only when the ROOT LAYOUT itself failed, which means the header,
// footer, cart provider and font setup never rendered. It therefore replaces the root layout
// entirely and must supply its own <html> and <body>.
//
// Deliberately dependency-light for that reason — no Button, no next/link, no context consumers.
// Anything imported here is code that could be implicated in the very failure being reported. The
// colour tokens come from globals.css (:root), so they still apply; `--font-cinzel` is injected by
// the root layout that just died, so the headings fall back to `serif` by design.
//
// `metadata` exports are not supported in a client component, so the tab title is set with React's
// built-in <title>.
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Root layout error:", error.digest ?? error.message, error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-beige-light">
        <title>Something Went Wrong — Everly White</title>
        <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
          <p className="font-heading text-[11px] font-medium uppercase tracking-[0.28em] text-brown">
            Everly White
          </p>

          <h1 className="mt-5 font-heading text-3xl font-light text-neutral-500 sm:text-4xl">
            Something Went Wrong
          </h1>

          <p className="mt-4 font-body text-lg text-neutral-300">
            We couldn&rsquo;t load the site just now. Please try again in a moment.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => unstable_retry()}
              className="cursor-pointer border border-brown bg-brown px-8 py-4 font-heading text-xs uppercase tracking-[0.14em] text-beige-light transition-colors hover:border-neutral-500 hover:bg-neutral-500"
            >
              Try Again
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- deliberate: this
                boundary replaces the root layout, so the App Router shell a <Link> would navigate
                through is exactly what failed. A full document load is the only reliable way out. */}
            <a
              href="/"
              className="border border-neutral-500 px-8 py-4 font-heading text-xs uppercase tracking-[0.14em] text-neutral-500 transition-colors hover:bg-pink-200 hover:border-pink-200"
            >
              Back to Home
            </a>
          </div>

          {error.digest && (
            <p className="mt-8 font-body text-xs text-neutral-300">
              Reference: <span className="font-semibold text-neutral-400">{error.digest}</span>
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
