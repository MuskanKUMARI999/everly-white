"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { RichText } from "@/components/ui/RichText";
import type { FaqItem } from "@/lib/data/faqs";

export function FaqAccordionItem({
  item,
  defaultOpen = false,
}: {
  item: FaqItem;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-neutral-100">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="cursor-pointer flex w-full items-center justify-between gap-6 py-5 text-left"
      >
        <span className="font-heading text-lg leading-snug text-neutral-500 sm:text-xl">
          {item.question}
        </span>
        <ChevronDown
          size={18}
          strokeWidth={1.5}
          className={`shrink-0 text-brown transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ${
          open ? "grid-rows-[1fr] pb-5 opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        {/* The collapse works by animating the row to 0fr, so whatever sits inside the grid cell
            has to clip its own overflow. An answer can now be several paragraphs, so that job
            moved from the single <p> to this wrapper. */}
        <div className="overflow-hidden">
          <RichText value={item.answer} className="font-body text-neutral-300" />
        </div>
      </div>
    </div>
  );
}
