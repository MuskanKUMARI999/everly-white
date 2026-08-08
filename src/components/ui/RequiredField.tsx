import type { ReactNode } from "react";

/** Wraps a required input with a red asterisk badge — the site's inputs are placeholder-only
 * (no visible <label>), so this is the only way to signal "required" without redesigning them. */
export function RequiredField({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <span className="pointer-events-none absolute right-3 top-2 font-body text-xs text-terracotta">
        *
      </span>
    </div>
  );
}
