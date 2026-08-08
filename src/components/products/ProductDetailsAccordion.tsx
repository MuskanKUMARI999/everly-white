"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

function AccordionItem({
  label,
  content,
  defaultOpen = false,
}: {
  label: string;
  content: ReactNode;
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
        <span
          className={`font-heading text-[13px] uppercase tracking-widest ${
            open ? "text-brown" : "text-neutral-500"
          }`}
        >
          {label}
        </span>
        <Plus
          size={16}
          strokeWidth={1.4}
          className={`shrink-0 text-brown transition-transform duration-300 ${open ? "rotate-45" : ""}`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ${
          open ? "grid-rows-[1fr] pb-5 opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        {/* A div rather than a p: a row may now stack several lines, and nesting a <p> inside a
            <p> is invalid HTML — the browser closes the outer one early and the layout breaks. */}
        <div className="overflow-hidden font-body text-neutral-300">{content}</div>
      </div>
    </div>
  );
}

// Boilerplate that holds across the whole catalog — hoisted so it isn't rebuilt on each render.
const PRODUCT_DISCLAIMER =
  "Each Everly White piece is lovingly handmade, embracing the beauty of what is natural, soulful, and imperfect. No two pieces are ever exactly alike — slight variations in color, texture, or mirror placement are a reflection of the human hands behind each creation, making yours a one-of-one.";

const STANDARD_DELIVERY = (
  <>
    Complimentary shipping across India. See our{" "}
    <Link href="/return" className="text-brown underline hover:no-underline">
      Return Policy
    </Link>{" "}
    for details on exchanges and returns.
  </>
);

/** Stacks the parts of a row, dropping any that the admin left empty. */
function DetailLines({ children }: { children: ReactNode[] }) {
  const lines = children.filter(Boolean);
  return (
    <div className="flex flex-col gap-3">
      {lines.map((line, index) => (
        <span key={index} className="block">
          {line}
        </span>
      ))}
    </div>
  );
}

/** A per-product value shown under a short label, so it reads as a spec rather than loose text. */
function Labelled({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="text-neutral-400">{label}:</span> {value}
    </>
  );
}

export const DEFAULT_COMPOSITION =
  "Inspired by the cosmic theme of the Center of the Universe collection, this mirrored art piece is hand-finished in five refined layers of premium materials and set with over 500 radiant mirrors that catch and multiply light like distant stars. Each piece takes at least 100 hours of artisan craftsmanship from base to finish, using dustproof, non-toxic, alcohol-free, water-resistant pigments — clean with a dry brush or damp cloth, no fuss required. Built to last generations; a gentle repaint after 15–20 years brings it back to full shine.";

// weight, careInstructions, makingTime and shippingInfo are all editable in Admin → Products but
// used to render nowhere at all — the form collected them and the storefront never asked for them.
// Each is optional and only appears once filled in, so a product that leaves them blank looks
// exactly as it did before.
export function ProductDetailsAccordion({
  dimensions,
  composition = DEFAULT_COMPOSITION,
  weight,
  careInstructions,
  makingTime,
  shippingInfo,
}: {
  dimensions: string;
  composition?: string;
  weight?: string;
  careInstructions?: string;
  makingTime?: string;
  shippingInfo?: string;
}) {
  const sections = [
    {
      label: "Dimensions & What's Included",
      content: (
        <DetailLines>
          {dimensions}
          {weight ? <Labelled label="Weight" value={weight} /> : null}
        </DetailLines>
      ),
    },
    {
      label: "Composition & Care",
      content: (
        <DetailLines>
          {composition}
          {careInstructions ? <Labelled label="Care" value={careInstructions} /> : null}
        </DetailLines>
      ),
    },
    { label: "Product Disclaimer", content: PRODUCT_DISCLAIMER },
    {
      label: "Delivery & Returns",
      content: (
        <DetailLines>
          {makingTime ? <Labelled label="Making time" value={makingTime} /> : null}
          {/* A product-specific shipping note replaces the standard line rather than sitting
              beside it — otherwise the two can contradict each other. */}
          {shippingInfo || STANDARD_DELIVERY}
        </DetailLines>
      ),
    },
  ];

  return (
    <div className="mt-10 border-t border-neutral-100">
      {sections.map((section) => (
        <AccordionItem key={section.label} {...section} />
      ))}
    </div>
  );
}
