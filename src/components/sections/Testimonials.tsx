import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import type { Review } from "@/components/reviews/reviewTypes";

interface TestimonialsProps {
  testimonials: Review[];
}

export function Testimonials({ testimonials }: TestimonialsProps) {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-content px-6 text-center sm:px-10 lg:px-10">
        <Reveal>
          <p className="font-heading text-xs uppercase tracking-[0.2em] text-neutral-300">Testimonials</p>
          <h2 className="mx-auto mt-3 max-w-xl font-heading text-3xl font-light leading-snug text-neutral-500 sm:text-4xl">
            Play with lights, colors! Show us your creativity to get featured on our website.
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-6 text-left sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((review, i) => (
            <Reveal key={`${review.name}-${i}`} delay={i * 0.1}>
              <ReviewCard review={review} />
            </Reveal>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Button href="/reviews" variant="tertiary" icon={false}>
            See All
          </Button>
        </div>
      </div>
    </section>
  );
}
