import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { MultilineText } from "@/components/ui/RichText";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { text, type SectionValues } from "@/lib/content/sections";
import type { Review } from "@/components/reviews/reviewTypes";

interface TestimonialsProps {
  testimonials: Review[];
  content: SectionValues;
}

export function Testimonials({ testimonials, content }: TestimonialsProps) {
  const ctaHref = text(content, "ctaHref");

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-content px-6 text-center sm:px-10 lg:px-10">
        <Reveal>
          <p className="font-heading text-xs uppercase tracking-[0.2em] text-neutral-300">
            {text(content, "eyebrow")}
          </p>
          <h2 className="mx-auto mt-3 max-w-xl font-heading text-3xl font-light leading-snug text-neutral-500 sm:text-4xl">
            <MultilineText value={text(content, "heading")} />
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-6 text-left sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((review, i) => (
            <Reveal key={`${review.name}-${i}`} delay={i * 0.1}>
              <ReviewCard review={review} />
            </Reveal>
          ))}
        </div>

        {ctaHref && (
          <div className="mt-10 flex justify-center">
            <Button href={ctaHref} variant="tertiary" icon={false}>
              {text(content, "ctaLabel")}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
