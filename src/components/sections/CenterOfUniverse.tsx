import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

export function CenterOfUniverse() {
  return (
    <section className="bg-white py-16 text-center sm:py-20">
      <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
        <Reveal>
          <p className="font-heading text-xs italic uppercase tracking-[0.2em] text-neutral-300">
            Center of the Universe
          </p>
          <h2 className="mx-auto mt-2 max-w-3xl font-heading text-2xl font-light text-neutral-500 sm:text-4xl">
            Luxe designs that are loud in the eyes, quiet in the essence
          </h2>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button href="/products" variant="primary">
              Shop Now
            </Button>
            <Button href="/collection/center-of-the-universe" variant="secondary">
              See our Collection
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
