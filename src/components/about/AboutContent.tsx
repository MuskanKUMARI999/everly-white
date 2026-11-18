import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { ComeCloserCTA } from "@/components/sections/ComeCloserCTA";
import { CollectionTrustBar } from "@/components/collection/CollectionTrustBar";
import { ContentIcon } from "@/components/ui/ContentIcon";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { MultilineText, RichText } from "@/components/ui/RichText";
import { list, text, type SectionValues } from "@/lib/content/sections";
import type { PageContent } from "@/lib/data/siteContent";

/**
 * Every band of /about, rendered from the copy saved in Admin → About Us.
 *
 * Each section reads its own values and is skipped when the admin has hidden it, so the page has no
 * fixed shape beyond the hero. The closing pink promises band is the shared trust bar (edited on
 * Admin → Home Page) and the cream CTA above it is shared with the collection and reviews pages —
 * both read their own copy, which is why neither takes a prop here.
 */

function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={`font-heading text-[11px] font-medium uppercase tracking-[0.28em] text-brown ${className}`}
    >
      {children}
    </p>
  );
}

function HeroText({ content }: { content: SectionValues }) {
  const intro = text(content, "intro");

  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className="mb-5 flex items-center gap-2 font-heading text-[10px] uppercase tracking-[0.18em]"
      >
        <Link href="/" className="text-neutral-400 hover:text-brown">
          Home
        </Link>
        <span className="text-neutral-300">/</span>
        <span aria-current="page" className="text-brown">
          {text(content, "breadcrumbLabel")}
        </span>
      </nav>
      <Eyebrow className="tracking-[0.22em] sm:whitespace-nowrap">
        {text(content, "eyebrow")}
      </Eyebrow>
      <h1 className="mt-3 font-heading text-4xl font-light text-neutral-500 sm:text-5xl">
        {text(content, "heading")}
      </h1>
      {intro && (
        <p className="mt-4 hidden font-body text-lg italic text-neutral-400 sm:block">{intro}</p>
      )}
    </>
  );
}

function AboutHero({
  content,
  bannerImage,
  bannerAlt,
}: {
  content: SectionValues;
  bannerImage?: string;
  bannerAlt?: string;
}) {
  const image = bannerImage || text(content, "image");
  const alt = bannerAlt || text(content, "imageAlt");

  return (
    <section>
      {/* Mobile & tablet: stacked frames — full banner, then a glass card overlapping its base.
          Both branches below use fetchPriority="high", NOT `preload`. Next 16 deprecated
          `priority` in favour of `preload`, but preload is explicitly wrong for this pattern: two
          <Image> tags render the same photo and CSS hides one, so preloading would insert a <link>
          for both and download the hero twice. fetchPriority keeps default lazy loading (which
          skips the hidden variant) while still prioritising the visible one. Same call as the six
          other stacked heroes — please don't "fix" these to preload. */}
      <div className="xl:hidden">
        {image && (
          <div className="relative aspect-16/9 w-full">
            <Image
              src={image}
              alt={alt}
              fill
              fetchPriority="high"
              sizes="100vw"
              className="object-cover"
            />
          </div>
        )}
        <div
          className={`relative z-10 mx-auto w-[calc(100%-2.5rem)] max-w-140 border border-white/60 bg-white/75 p-7 shadow-[0_10px_40px_rgba(0,0,0,0.14)] backdrop-blur-xl sm:p-9 ${
            // With no banner there is nothing to overlap, so the negative pull would hoist the
            // card off the top of the page.
            image ? "-mt-12 sm:-mt-16" : "mt-10"
          }`}
        >
          <HeroText content={content} />
        </div>
      </div>

      {/* Desktop: glass card overlaid on a full-bleed banner */}
      <div className="relative hidden min-h-150 items-end overflow-hidden xl:flex">
        {image && (
          <>
            <Image
              src={image}
              alt={alt}
              fill
              fetchPriority="high"
              sizes="100vw"
              className="object-cover"
              style={{ objectPosition: "center" }}
            />
            <div className="absolute inset-0 bg-linear-to-r from-black/40 via-black/5 to-transparent" />
          </>
        )}
        <div className="relative z-10 mx-auto w-full max-w-content px-6 pb-16 sm:px-10 lg:px-10">
          <div className="w-fit max-w-100 border border-white/60 bg-white/70 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:p-10">
            <HeroText content={content} />
          </div>
        </div>
      </div>
    </section>
  );
}

function StorySection({ content }: { content: SectionValues }) {
  const features = list(content, "craftFeatures").filter((item) => item.label);

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
        <Eyebrow>{text(content, "eyebrow")}</Eyebrow>
        <h2 className="mt-3 max-w-[20ch] font-heading text-3xl leading-snug text-neutral-500 sm:text-4xl">
          <MultilineText value={text(content, "heading")} />
        </h2>

        <div className="mt-14 grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-[8vw]">
          <div>
            <h4 className="font-heading text-xs uppercase tracking-[0.14em] text-neutral-500">
              {text(content, "philosophyTitle")}
            </h4>
            <div className="mt-4">
              <RichText value={text(content, "philosophyBody")} className="font-body text-neutral-300" />
            </div>
          </div>
          <div>
            <h4 className="font-heading text-xs uppercase tracking-[0.14em] text-neutral-500">
              {text(content, "craftTitle")}
            </h4>
            <div className="mt-4">
              <RichText value={text(content, "craftBody")} className="font-body text-neutral-300" />
            </div>
            {features.length > 0 && (
              <div className="mt-7 flex flex-wrap gap-x-9 gap-y-5">
                {features.map((item, i) => (
                  <div key={`${i}-${item.label}`} className="flex items-center gap-3">
                    <ContentIcon
                      name={item.icon}
                      size={26}
                      strokeWidth={1.3}
                      className="shrink-0 text-brown"
                    />
                    <span className="font-heading text-[11.5px] uppercase tracking-[0.06em] text-neutral-500">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function QuoteSection({ content }: { content: SectionValues }) {
  const image = text(content, "image");
  const videoLabel = text(content, "videoLabel");
  const videoHref = text(content, "videoHref");

  // The play button has always been decorative. It only becomes a real link once a film URL is
  // saved, so an empty field leaves the band exactly as it was rather than shipping a dead anchor.
  const play = (
    <>
      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/50 bg-white/25 shadow-[0_4px_20px_rgba(0,0,0,0.15)] backdrop-blur-md">
        <Play size={20} className="ml-0.5 fill-beige-light text-beige-light" />
      </span>
      {videoLabel && (
        <span className="mt-3 font-heading text-xs uppercase tracking-[0.16em] text-beige-light">
          {videoLabel}
        </span>
      )}
    </>
  );

  return (
    <section className="pb-20 sm:pb-28">
      <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
        <div className="grid grid-cols-1 overflow-hidden md:grid-cols-[1fr_1.4fr]">
          <div className="flex items-center bg-pink-100 p-10 sm:p-12">
            <div className="border border-white/60 bg-white/55 p-7 backdrop-blur-xl">
              <Eyebrow>{text(content, "eyebrow")}</Eyebrow>
              <div className="mt-3">
                <RichText
                  value={text(content, "quote")}
                  className="font-body text-lg italic leading-relaxed text-neutral-500"
                />
              </div>
            </div>
          </div>
          <div className="relative flex min-h-70 items-center justify-center">
            {image && (
              <>
                <Image
                  src={image}
                  alt={text(content, "imageAlt")}
                  fill
                  sizes="(min-width: 768px) 58vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/25" />
              </>
            )}
            {videoHref ? (
              <a
                href={videoHref}
                target={videoHref.startsWith("/") || videoHref.startsWith("#") ? undefined : "_blank"}
                rel="noopener noreferrer"
                className="relative z-10 flex flex-col items-center"
              >
                {play}
              </a>
            ) : (
              <div className="relative z-10 flex flex-col items-center">{play}</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function FounderSection({ content }: { content: SectionValues }) {
  const image = text(content, "image");
  const quote = text(content, "quote");
  const quoteTagline = text(content, "quoteTagline");
  const gallery = list(content, "gallery").filter((item) => item.image);
  const socials = list(content, "socials").filter((item) => item.href);

  return (
    <section id="craft" className="pb-20 sm:pb-28">
      <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
        <div className="grid grid-cols-1 overflow-hidden border border-neutral-100 bg-beige-light lg:grid-cols-[0.9fr_1.1fr]">
          {image && (
            <div className="relative min-h-85 lg:min-h-full">
              <Image
                src={image}
                alt={text(content, "imageAlt")}
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover [transform:scaleX(-1)]"
              />
              <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_60px_30px_var(--color-beige-light)]" />
            </div>
          )}
          <div className="p-8 sm:p-12 lg:p-14">
            <Eyebrow>{text(content, "eyebrow")}</Eyebrow>
            <h3 className="mt-3 font-heading text-2xl text-neutral-500 sm:text-3xl">
              {text(content, "heading")}
            </h3>
            <div className="mt-5">
              <RichText value={text(content, "body")} className="font-body text-neutral-300" />
            </div>

            {(quote || quoteTagline) && (
              <div className="mt-6 border-l-2 border-brown pl-5">
                {quote && (
                  <p className="font-body text-lg italic leading-relaxed text-neutral-500">{quote}</p>
                )}
                {quoteTagline && (
                  <p className="mt-2 font-heading text-xs uppercase tracking-[0.14em] text-brown">
                    {quoteTagline}
                  </p>
                )}
              </div>
            )}

            <div className="mt-6">
              <p className="font-heading text-[13px] uppercase tracking-[0.08em] text-neutral-500">
                {text(content, "name")}
              </p>
              <p className="font-body text-sm text-neutral-300">{text(content, "role")}</p>
            </div>

            {gallery.length > 0 && (
              <>
                <span className="mt-8 block font-heading text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                  {text(content, "galleryLabel")}
                </span>
                <div className="mt-4 grid grid-cols-3 gap-2.5">
                  {gallery.map((item, i) => (
                    <div
                      key={`${i}-${item.image}`}
                      className="relative aspect-square overflow-hidden bg-pink-100"
                    >
                      <Image
                        src={item.image}
                        alt={item.alt}
                        fill
                        sizes="(min-width: 1024px) 18vw, 30vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </>
            )}

            {socials.length > 0 && (
              <>
                <span className="mt-8 block font-heading text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                  {text(content, "socialsLabel")}
                </span>
                <div className="mt-3 flex gap-3">
                  {socials.map((item, i) => (
                    <a
                      key={`${i}-${item.href}`}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.label || item.icon}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-100 text-brown transition-colors hover:bg-pink-100"
                    >
                      <SocialIcon name={item.icon} size={14} />
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ValuesSection({ content }: { content: SectionValues }) {
  const items = list(content, "items").filter((item) => item.title);
  if (items.length === 0) return null;

  return (
    <section className="pb-20 text-center sm:pb-28">
      <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
        <div className="mx-auto max-w-xl">
          <Eyebrow>{text(content, "eyebrow")}</Eyebrow>
          <h2 className="mt-3 font-heading text-3xl text-neutral-500 sm:text-4xl">
            {text(content, "heading")}
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 border border-neutral-100 md:grid-cols-3">
          {items.map((item, i) => (
            <div
              key={`${i}-${item.title}`}
              className="border-b border-neutral-100 bg-beige-light p-10 text-left transition-colors duration-300 last:border-b-0 hover:bg-pink-200 md:border-b-0 md:border-r md:last:border-r-0"
            >
              <ContentIcon name={item.icon} size={30} strokeWidth={1.3} className="text-brown" />
              <h3 className="mt-6 font-heading text-[15px] uppercase tracking-widest text-neutral-500">
                {item.title}
              </h3>
              <p className="mt-3 font-body text-[15px] text-neutral-300">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CommitmentSection({ content }: { content: SectionValues }) {
  const linkLabel = text(content, "linkLabel");
  const linkHref = text(content, "linkHref");
  const backImage = text(content, "backImage");
  const frontImage = text(content, "frontImage");

  return (
    <section className="bg-pink-100 py-20 sm:py-28">
      <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-[6vw]">
          <div>
            <Eyebrow>{text(content, "eyebrow")}</Eyebrow>
            <h2 className="mt-3 max-w-[14ch] font-heading text-3xl leading-snug text-neutral-500 sm:text-4xl">
              <MultilineText value={text(content, "heading")} />
            </h2>
            <div className="mt-5 max-w-[48ch]">
              <RichText value={text(content, "body")} className="font-body text-neutral-400" />
            </div>
            {linkLabel && linkHref && (
              <Link
                href={linkHref}
                className="mt-6 inline-block border-b border-brown font-heading text-[11.5px] uppercase tracking-[0.14em] text-brown"
              >
                {linkLabel} →
              </Link>
            )}
          </div>
          {(backImage || frontImage) && (
            <div className="relative h-80 sm:h-95">
              {backImage && (
                <div className="absolute left-0 top-0 h-[78%] w-[74%] overflow-hidden">
                  <Image
                    src={backImage}
                    alt={text(content, "backImageAlt")}
                    fill
                    sizes="(min-width: 1024px) 35vw, 70vw"
                    className="object-cover"
                  />
                </div>
              )}
              {frontImage && (
                <div className="absolute bottom-0 right-0 h-[56%] w-[52%] overflow-hidden shadow-[0_16px_34px_rgba(120,60,50,0.18)]">
                  <Image
                    src={frontImage}
                    alt={text(content, "frontImageAlt")}
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

interface AboutContentProps {
  content: PageContent;
  /** The active "About Us Page Hero" banner, when there is one. It wins over the section's image. */
  bannerImage?: string;
  bannerAlt?: string;
}

export function AboutContent({ content, bannerImage, bannerAlt }: AboutContentProps) {
  return (
    <main>
      <AboutHero
        content={content.values("about_hero")}
        bannerImage={bannerImage}
        bannerAlt={bannerAlt}
      />
      {content.isVisible("about_story") && <StorySection content={content.values("about_story")} />}
      {content.isVisible("about_quote") && <QuoteSection content={content.values("about_quote")} />}
      {content.isVisible("about_founder") && (
        <FounderSection content={content.values("about_founder")} />
      )}
      {content.isVisible("about_values") && (
        <ValuesSection content={content.values("about_values")} />
      )}
      {content.isVisible("about_commitment") && (
        <CommitmentSection content={content.values("about_commitment")} />
      )}
      <ComeCloserCTA />
      <CollectionTrustBar />
    </main>
  );
}
