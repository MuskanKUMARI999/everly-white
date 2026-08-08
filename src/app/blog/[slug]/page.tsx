import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CollectionEyebrow as Eyebrow } from "@/components/collection/Eyebrow";
import { BlogCard } from "@/components/blog/BlogCard";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { getAllBlogPosts, getBlogPostBySlug, getBlogSlugs } from "@/lib/data/blog";

const SITE_URL = "https://everlywhite.com";

export async function generateStaticParams() {
  return getBlogSlugs().then((slugs) => slugs.map((slug) => ({ slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return {};

  // Admin → Blog carries the same SEO section as the product form, and it was equally inert: the
  // title and excerpt were used regardless of what was written there. `absolute` bypasses the root
  // layout's "%s | Everly White" template so a hand-written meta title is used exactly as typed.
  const metaTitle = post.metaTitle?.trim();
  const metaDescription = post.metaDescription?.trim();

  return {
    title: metaTitle ? { absolute: metaTitle } : post.title,
    description: metaDescription || post.excerpt || undefined,
  };
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const allPosts = await getAllBlogPosts();
  const sameCategory = allPosts.filter((p) => p.id !== post.id && p.category === post.category);
  const similar = (sameCategory.length > 0 ? sameCategory : allPosts.filter((p) => p.id !== post.id)).slice(
    0,
    3,
  );

  const postUrl = `${SITE_URL}/blog/${post.slug}`;

  return (
    <main>
      <div className="mx-auto max-w-content px-6 pt-8 sm:px-10 sm:pt-10 lg:px-10">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 font-heading text-[10px] uppercase tracking-[0.18em]"
        >
          <Link href="/" className="text-neutral-400 hover:text-brown">
            Home
          </Link>
          <span className="text-neutral-300">/</span>
          <Link href="/blog" className="text-neutral-400 hover:text-brown">
            Blog
          </Link>
          <span className="text-neutral-300">/</span>
          <span aria-current="page" className="max-w-[60vw] truncate text-brown">
            {post.title}
          </span>
        </nav>
      </div>

      {/* Full-bleed cover image with an inset, left-aligned title card overlapping its base */}
      <div className="relative mt-6 h-120 w-full overflow-hidden bg-neutral-100 sm:h-140 lg:h-160">
        <Image src={post.image} alt={post.title} fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-250 px-6 sm:px-10">
            <div className="bg-white px-6 py-8 sm:px-10 sm:py-10">
              <p className="font-heading text-[11px] uppercase tracking-[0.18em] text-neutral-300">
                {post.date} <span className="text-brown">&bull;</span> {post.category}
              </p>
              <h1 className="mt-4 font-heading text-3xl font-light text-neutral-500 sm:text-[42px] sm:leading-[1.12]">
                {post.title}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Byline + article body + share, one left-aligned column aligned with the card text */}
      <div className="mx-auto max-w-250 px-6 sm:px-10">
        <div className="bg-white px-6 sm:px-10">
          <p className="pt-6 font-body text-sm text-neutral-400">
            <span className="text-neutral-500">{post.author}</span>
            <span className="mx-2.5 text-neutral-200">&middot;</span>
            {post.readTime}
          </p>

          <article className="py-12 sm:py-14">
            {post.content.map((block, i) => {
              switch (block.type) {
                case "heading":
                  return (
                    <h2
                      key={i}
                      className="mt-14 font-body text-2xl font-semibold text-neutral-500 first:mt-0 sm:text-[26px]"
                    >
                      {block.text}
                    </h2>
                  );
                case "image":
                  return (
                    <figure key={i} className="mt-10">
                      <div className="relative h-100 w-full overflow-hidden bg-neutral-100">
                        <Image
                          src={block.src ?? ""}
                          alt={block.alt ?? ""}
                          fill
                          sizes="(min-width: 1000px) 840px, 100vw"
                          className="object-cover"
                        />
                      </div>
                      {block.caption && (
                        <figcaption className="mt-3 font-body text-sm italic text-neutral-300">
                          {block.caption}
                        </figcaption>
                      )}
                    </figure>
                  );
                case "list":
                  return (
                    <ul key={i} className="mt-6 flex flex-col gap-3">
                      {block.items?.map((item, j) => (
                        <li
                          key={j}
                          className="relative pl-6 font-body text-[17px] leading-relaxed text-neutral-400"
                        >
                          <span className="absolute left-0 top-[0.7em] h-1.5 w-1.5 rounded-full bg-brown" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  );
                default:
                  return (
                    <p
                      key={i}
                      className="mt-6 font-body text-[17px] leading-relaxed text-neutral-400 first:mt-0"
                    >
                      {block.text}
                    </p>
                  );
              }
            })}
          </article>

          <div className="flex flex-wrap items-center gap-4 border-t border-neutral-100 pb-14 pt-8 sm:pb-16">
            <span className="font-heading text-[11px] uppercase tracking-[0.14em] text-neutral-300">
              Share This Story
            </span>
            <ShareButtons postUrl={postUrl} title={post.title} image={`${SITE_URL}${post.image}`} />
          </div>
        </div>
      </div>

      <section className="bg-beige-light py-16 sm:py-20">
        <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
          <div className="text-center">
            <Eyebrow>Keep Reading</Eyebrow>
            <h2 className="mt-3 font-heading text-3xl text-neutral-500 sm:text-4xl">
              Similar Stories
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((p) => (
              <BlogCard key={p.id} post={p} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
