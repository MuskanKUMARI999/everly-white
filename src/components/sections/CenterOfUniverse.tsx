import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { MultilineText } from "@/components/ui/RichText";
import { text, type SectionValues } from "@/lib/content/sections";

export function CenterOfUniverse({ content }: { content: SectionValues }) {
  const primaryHref = text(content, "primaryHref");
  const secondaryHref = text(content, "secondaryHref");

  return (
    <section className="bg-white py-16 text-center sm:py-20">
      <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
        <Reveal>
          <p className="font-heading text-xs italic uppercase tracking-[0.2em] text-neutral-300">
            {text(content, "eyebrow")}
          </p>
          <h2 className="mx-auto mt-2 max-w-3xl font-heading text-2xl font-light text-neutral-500 sm:text-4xl">
            <MultilineText value={text(content, "heading")} />
          </h2>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {/* A button whose link was cleared in admin is dropped rather than rendered as a
                dead control that navigates to the current page. */}
            {primaryHref && (
              <Button href={primaryHref} variant="primary">
                {text(content, "primaryLabel")}
              </Button>
            )}
            {secondaryHref && (
              <Button href={secondaryHref} variant="secondary">
                {text(content, "secondaryLabel")}
              </Button>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
