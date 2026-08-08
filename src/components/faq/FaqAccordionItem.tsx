"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FaqItem } from "./faqData";

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
        <p className="overflow-hidden font-body text-neutral-300">{item.answer}</p>
      </div>
    </div>
  );
}
