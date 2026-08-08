"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { faqCategories } from "./faqData";
import { FaqAccordionItem } from "./FaqAccordionItem";

function slugify(text: string) {
  return text
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

export function FaqLayoutSidebar() {
  const [active, setActive] = useState(slugify(faqCategories[0].category));
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
  }, []);

  return (
    <main>
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr] lg:gap-20">
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <nav aria-label="FAQ categories" className="flex flex-col gap-1">
                {faqCategories.map((cat) => {
                  const slug = slugify(cat.category);
                  const isActive = active === slug;
                  return (
                    <a
                      key={slug}
                      href={`#${slug}`}
                      aria-current={isActive ? "true" : undefined}
                      className={`border-l-2 py-2 pl-4 font-heading text-[12.5px] uppercase tracking-widest transition-colors duration-200 ${
                        isActive
                          ? "border-brown text-brown"
                          : "border-transparent text-neutral-300 hover:text-neutral-500"
                      }`}
                    >
                      {cat.category}
                    </a>
                  );
                })}
              </nav>
            </aside>

            <div>
              {faqCategories.map((cat, i) => {
                const slug = slugify(cat.category);
                return (
                  <div
                    key={slug}
                    id={slug}
                    ref={(el) => {
                      sectionRefs.current[slug] = el;
                    }}
                    className={`scroll-mt-28 ${i > 0 ? "mt-16" : ""}`}
                  >
                    <h2 className="border-b border-neutral-100 pb-3 font-heading text-[12.5px] uppercase tracking-[0.14em] text-brown">
                      {cat.category}
                    </h2>
                    <div>
                      {cat.items.map((item, j) => (
                        <FaqAccordionItem
                          key={item.question}
                          item={item}
                          defaultOpen={i === 0 && j === 0}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-neutral-100 bg-beige-light py-20 text-center sm:py-28">
        <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
          <Eyebrow>Still Have Questions?</Eyebrow>
          <h2 className="mx-auto mt-3 max-w-[16ch] font-heading text-3xl text-neutral-500 sm:text-4xl">
            We&rsquo;re here to help.
          </h2>
          <p className="mx-auto mt-4 max-w-[52ch] font-body text-neutral-300">
            Can&rsquo;t find what you&rsquo;re looking for? Reach out and our team will get back to
            you personally.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button href="/contact" variant="primary" icon={false}>
              Contact Us
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
