"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

interface EmptyAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface AccountEmptyStateProps {
  Icon: LucideIcon;
  title: string;
  description: string;
  action?: EmptyAction;
  /** Optional second line under the button — a related route, a reassurance. */
  footnote?: ReactNode;
  /** Tighter padding for empty regions sitting inside a page that has other content. */
  compact?: boolean;
}

// One component for all four empty regions in the account so they read as a set rather than as
// four separately-invented blocks. It borrows the section's existing panel treatment — hairline
// border over a pink wash, the same pairing used by the dashboard stat tiles and address cards —
// so an empty page still looks composed instead of like something failed to load.
export function AccountEmptyState({
  Icon,
  title,
  description,
  action,
  footnote,
  compact = false,
}: AccountEmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center border border-neutral-100 bg-pink-100/40 text-center ${
        compact ? "px-6 py-12" : "px-6 py-16 sm:py-20"
      }`}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-full bg-pink-100 text-brown ${
          compact ? "h-12 w-12" : "h-16 w-16"
        }`}
      >
        <Icon size={compact ? 20 : 26} strokeWidth={1.3} />
      </span>

      <h2
        className={`mt-6 font-heading text-neutral-500 ${compact ? "text-lg" : "text-2xl sm:text-[1.75rem]"}`}
      >
        {title}
      </h2>

      <p
        className={`mt-2.5 max-w-[46ch] font-body text-neutral-300 ${compact ? "text-sm" : ""}`}
      >
        {description}
      </p>

      {action &&
        (action.href ? (
          <Button href={action.href} variant="primary" className="mt-8">
            {action.label}
          </Button>
        ) : (
          <Button type="button" variant="primary" className="mt-8" onClick={action.onClick}>
            {action.label}
          </Button>
        ))}

      {footnote && (
        <p className="mt-5 font-body text-xs text-neutral-300">{footnote}</p>
      )}
    </div>
  );
}
