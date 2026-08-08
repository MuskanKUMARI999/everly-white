"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export interface LegalSection {
  heading: string;
  body: ReactNode;
}

interface LegalLayoutProps {
  intro?: ReactNode;
  sections: LegalSection[];
  cta?: ReactNode;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function LegalLayout({ intro, sections, cta }: LegalLayoutProps) {
  const [active, setActive] = useState(slugify(sections[0].heading));
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
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
          {intro && (
            <p className="mb-12 max-w-[70ch] font-body text-neutral-400">{intro}</p>
          )}

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_1fr] lg:gap-20">
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <nav aria-label="Sections" className="flex flex-col gap-1">
                {sections.map((s) => {
                  const slug = slugify(s.heading);
                  const isActive = active === slug;
                  return (
                    <a
                      key={slug}
                      href={`#${slug}`}
                      aria-current={isActive ? "true" : undefined}
                      className={`border-l-2 py-2 pl-4 font-heading text-[11.5px] uppercase tracking-widest transition-colors duration-200 ${
                        isActive
                          ? "border-brown text-brown"
                          : "border-transparent text-neutral-300 hover:text-neutral-500"
                      }`}
                    >
                      {s.heading}
                    </a>
                  );
                })}
              </nav>
            </aside>

            <div className="max-w-180 space-y-12">
              {sections.map((s) => {
                const slug = slugify(s.heading);
                return (
                  <div
                    key={slug}
                    id={slug}
                    ref={(el) => {
                      sectionRefs.current[slug] = el;
                    }}
                    className="scroll-mt-28"
                  >
                    <h2 className="font-heading text-xl text-neutral-500">{s.heading}</h2>
                    <div className="mt-4 space-y-4 font-body leading-relaxed text-neutral-400">
                      {s.body}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {cta && <div className="mt-16 flex justify-center">{cta}</div>}
        </div>
      </section>
    </main>
  );
}
