import { CollectionEyebrow as Eyebrow } from "@/components/collection/Eyebrow";
import { Button } from "@/components/ui/Button";
import { getPageContent } from "@/lib/data/siteContent";
import { text } from "@/lib/content/sections";

/**
 * The cream band that closes the about page, every collection page and the reviews page.
 *
 * Like the trust bar it reads its own copy rather than taking a prop, so a page that drops the band
 * in does not also have to remember to fetch and thread the section through. getPageContent is
 * request-deduplicated, so this costs no extra query on a page that already reads content.
 *
 * It is a server component, so the one client-side caller (ReviewsGrid) takes it as an element prop
 * from its page rather than importing it — importing it there would pull it into the client bundle,
 * where it cannot read the database at all.
 */
export async function ComeCloserCTA() {
  const content = await getPageContent();
  if (!content.isVisible("site_come_closer")) return null;

  const values = content.values("site_come_closer");
  const primaryLabel = text(values, "primaryLabel");
  const primaryHref = text(values, "primaryHref");
  const secondaryLabel = text(values, "secondaryLabel");
  const secondaryHref = text(values, "secondaryHref");
  const body = text(values, "body");

  const isExternal = (href: string) => !href.startsWith("/") && !href.startsWith("#");

  return (
    <section className="border-y border-neutral-100 bg-beige-light py-20 text-center sm:py-28">
      <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
        <Eyebrow>{text(values, "eyebrow")}</Eyebrow>
        <h2 className="mx-auto mt-3 max-w-[16ch] font-heading text-3xl text-neutral-500 sm:text-4xl">
          {text(values, "heading")}
        </h2>
        {body && <p className="mx-auto mt-4 max-w-[52ch] font-body text-neutral-300">{body}</p>}
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {primaryLabel && primaryHref && (
            <Button
              href={primaryHref}
              variant="primary"
              target={isExternal(primaryHref) ? "_blank" : undefined}
              rel={isExternal(primaryHref) ? "noopener noreferrer" : undefined}
            >
              {primaryLabel}
            </Button>
          )}
          {secondaryLabel && secondaryHref && (
            <Button
              href={secondaryHref}
              variant="secondary"
              icon={false}
              target={isExternal(secondaryHref) ? "_blank" : undefined}
              rel={isExternal(secondaryHref) ? "noopener noreferrer" : undefined}
            >
              {secondaryLabel}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
