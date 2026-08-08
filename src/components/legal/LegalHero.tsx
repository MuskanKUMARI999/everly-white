import Link from "next/link";
import { CollectionEyebrow as Eyebrow } from "@/components/collection/Eyebrow";

interface LegalHeroProps {
  breadcrumbLabel: string;
  eyebrow: string;
  title: string;
  subtitle: string;
}

export function LegalHero({ breadcrumbLabel, eyebrow, title, subtitle }: LegalHeroProps) {
  return (
    <section className="border-b border-neutral-100 bg-beige-light">
      <div className="mx-auto max-w-content px-6 py-16 sm:px-10 sm:py-20 lg:px-10">
        <nav
          aria-label="Breadcrumb"
          className="mb-5 flex items-center gap-2 font-heading text-[10px] uppercase tracking-[0.18em]"
        >
          <Link href="/" className="text-neutral-400 hover:text-brown">
            Home
          </Link>
          <span className="text-neutral-300">/</span>
          <span aria-current="page" className="text-brown">
            {breadcrumbLabel}
          </span>
        </nav>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-3 font-heading text-4xl font-light text-neutral-500 sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-[60ch] font-body text-lg italic text-neutral-400">{subtitle}</p>
      </div>
    </section>
  );
}
