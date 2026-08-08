import { CollectionEyebrow as Eyebrow } from "@/components/collection/Eyebrow";
import { Button } from "@/components/ui/Button";

export function ComeCloserCTA() {
  return (
    <section className="border-y border-neutral-100 bg-beige-light py-20 text-center sm:py-28">
      <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
        <Eyebrow>Come Closer</Eyebrow>
        <h2 className="mx-auto mt-3 max-w-[16ch] font-heading text-3xl text-neutral-500 sm:text-4xl">
          Step into the Cosmic Luxe Experience.
        </h2>
        <p className="mx-auto mt-4 max-w-[52ch] font-body text-neutral-300">
          We don&rsquo;t create for everyone. We create for those who feel it — join a small,
          intentional community built around pieces that mean something.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button href="/products" variant="primary">
            Explore Products
          </Button>
          <Button
            href="https://www.instagram.com/everlywhitestudios/"
            variant="secondary"
            icon={false}
            target="_blank"
            rel="noopener noreferrer"
          >
            Explore Our Community
          </Button>
        </div>
      </div>
    </section>
  );
}
