"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { RichText } from "@/components/ui/RichText";
import { text, type SectionValues } from "@/lib/content/sections";
import type { FaqCategory } from "@/lib/data/faqs";
import { FaqAccordionItem } from "./FaqAccordionItem";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-heading text-[11px] font-medium uppercase tracking-[0.28em] text-brown">
      {children}
    </p>
  );
}

interface FaqLayoutSidebarProps {
  categories: FaqCategory[];
  /** Admin → FAQs → "FAQ Footer CTA". Null when the section is toggled off. */
  ctaContent: SectionValues | null;
}

export function FaqLayoutSidebar({ categories, ctaContent }: FaqLayoutSidebarProps) {
  // Two categories can share a slug once titles are admin-editable ("Orders & Shipping" and
  // "Orders / Shipping" both slug to orders-shipping), and a duplicate id would break both the
  // anchor links and the scroll spy. The row id is unique by construction, so it disambiguates.
  const sections = categories.map((category) => ({
    ...category,
    anchor: `${slugify(category.title) || "faq"}-${category.id.slice(0, 8)}`,
  }));

  const [active, setActive] = useState(sections[0]?.anchor ?? "");
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
    // Re-observe when the admin adds or removes a category, otherwise the spy keeps watching
    // elements that are no longer in the document.
  }, [sections.length]);

  return (
    <main>
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
          {sections.length === 0 ? (
            <p className="text-center font-body text-neutral-300">
              Our answers are being updated — please check back shortly.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr] lg:gap-20">
              <aside className="lg:sticky lg:top-28 lg:self-start">
                <nav aria-label="FAQ categories" className="flex flex-col gap-1">
                  {sections.map((category) => {
                    const isActive = active === category.anchor;
                    return (
                      <a
                        key={category.anchor}
                        href={`#${category.anchor}`}
                        aria-current={isActive ? "true" : undefined}
                        className={`border-l-2 py-2 pl-4 font-heading text-[12.5px] uppercase tracking-widest transition-colors duration-200 ${
                          isActive
                            ? "border-brown text-brown"
                            : "border-transparent text-neutral-300 hover:text-neutral-500"
                        }`}
                      >
                        {category.title}
                      </a>
                    );
                  })}
                </nav>
              </aside>

              <div>
                {sections.map((category, i) => (
                  <div
                    key={category.anchor}
                    id={category.anchor}
                    ref={(el) => {
                      sectionRefs.current[category.anchor] = el;
                    }}
                    className={`scroll-mt-28 ${i > 0 ? "mt-16" : ""}`}
                  >
                    <h2 className="border-b border-neutral-100 pb-3 font-heading text-[12.5px] uppercase tracking-[0.14em] text-brown">
                      {category.title}
                    </h2>
                    <div>
                      {category.items.map((item, j) => (
                        <FaqAccordionItem key={item.id} item={item} defaultOpen={i === 0 && j === 0} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {ctaContent && (
        <section className="border-y border-neutral-100 bg-beige-light py-20 text-center sm:py-28">
          <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
            <Eyebrow>{text(ctaContent, "eyebrow")}</Eyebrow>
            <h2 className="mx-auto mt-3 max-w-[16ch] font-heading text-3xl text-neutral-500 sm:text-4xl">
              {text(ctaContent, "heading")}
            </h2>
            <div className="mx-auto mt-4 max-w-[52ch]">
              <RichText value={text(ctaContent, "body")} className="font-body text-neutral-300" />
            </div>
            {text(ctaContent, "buttonHref") && (
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button href={text(ctaContent, "buttonHref")} variant="primary" icon={false}>
                  {text(ctaContent, "buttonLabel")}
                </Button>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
