import { CollectionEyebrow as Eyebrow } from "@/components/collection/Eyebrow";

export function ProductStoryQuote({ quote }: { quote: string }) {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
        <div className="mx-auto max-w-225 rounded-2xl bg-pink-100 px-8 py-12 text-center sm:px-12 sm:py-14">
          <Eyebrow>The Story</Eyebrow>
          <p className="mt-4 font-body text-xl italic leading-relaxed text-neutral-400 sm:text-2xl">
            &ldquo;{quote}&rdquo;
          </p>
        </div>
      </div>
    </section>
  );
}
