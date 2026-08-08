"use client"; // Error boundaries must be Client Components.

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CollectionEyebrow as Eyebrow } from "@/components/collection/Eyebrow";

// Catches runtime errors thrown while rendering any page, and replaces Next's unbranded default
// screen. This renders inside the root layout, so the header and footer stay in place.
//
// Next 16 renamed the recovery prop: it is `unstable_retry`, not `reset`. `unstable_retry()`
// re-fetches and re-renders the boundary's children, so a transient failure (a dropped Supabase
// query, a network blip) genuinely recovers rather than just clearing the error and rendering the
// same broken output again.
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // Server-side failures reach the browser with only a `digest` — the message is withheld so it
    // can't leak internals. Logging it here is what makes an error report traceable back to the
    // matching server log line.
    console.error("Page error:", error.digest ?? error.message, error);
  }, [error]);

  return (
    <main className="py-20 sm:py-28">
      <div className="mx-auto flex max-w-content flex-col items-center px-6 text-center sm:px-10 lg:px-10">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-100 text-brown">
          <RefreshCw size={26} strokeWidth={1.3} />
        </span>

        <div className="mt-6">
          <Eyebrow>Something Went Wrong</Eyebrow>
        </div>

        <h1 className="mt-3 font-heading text-3xl font-light text-neutral-500 sm:text-4xl">
          We Hit an Unexpected Snag
        </h1>

        <p className="mx-auto mt-4 max-w-[48ch] font-body text-lg text-neutral-300">
          This one is on us, not you. Try again in a moment &mdash; if it keeps happening, please
          get in touch and we&rsquo;ll sort it out.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Button type="button" variant="primary" icon={false} onClick={() => unstable_retry()}>
            Try Again
          </Button>
          <Button href="/" variant="secondary" icon={false}>
            Back to Home
          </Button>
        </div>

        {/* The reference a customer can quote to us, and the only identifier that ties their report
            to the server log. Hidden when absent, which is the case for client-side errors. */}
        {error.digest && (
          <p className="mt-8 font-body text-xs text-neutral-300">
            Reference: <span className="font-semibold text-neutral-400">{error.digest}</span>
          </p>
        )}
      </div>
    </main>
  );
}
