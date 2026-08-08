"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { BlogCard } from "./BlogCard";
import { BLOG_FILTER_TABS } from "./blogCategories";
import type { BlogPost } from "@/lib/data/blog";

const EASE = [0.22, 1, 0.36, 1] as const;
const categories = BLOG_FILTER_TABS;

const PAGE_SIZE = 6;

interface BlogGridProps {
  posts: BlogPost[];
}

export function BlogGrid({ posts }: BlogGridProps) {
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]>("All");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [featured, ...rest] = posts;
  const filtered =
    activeCategory === "All" ? rest : rest.filter((post) => post.category === activeCategory);
  const visible = filtered.slice(0, visibleCount);

  if (!featured) return null;

  return (
    <section className="bg-beige-light py-16 sm:py-20">
      <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
        <Reveal>
          <Link
            href={`/blog/${featured.slug}`}
            className="group grid items-center gap-8 sm:grid-cols-2 sm:gap-12"
          >
            <div className="relative aspect-4/3 overflow-hidden bg-neutral-100">
              <Image
                src={featured.image}
                alt={featured.title}
                fill
                sizes="(min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div>
              <p className="font-heading text-[11px] font-medium uppercase tracking-[0.28em] text-brown">
                Editor&apos;s Pick &middot; {featured.category}
              </p>
              <h2 className="mt-3 font-heading text-2xl text-neutral-500 sm:text-3xl">
                {featured.title}
              </h2>
              <p className="mt-4 font-body text-neutral-300">{featured.excerpt}</p>
              <p className="mt-4 font-heading text-[11px] uppercase tracking-[0.12em] text-neutral-300">
                {featured.date} &middot; {featured.readTime}
              </p>
              <span className="mt-5 inline-flex items-center gap-2 font-heading text-xs uppercase tracking-[0.14em] text-brown transition-all group-hover:gap-3">
                Read Full Story
                <ArrowRight size={14} strokeWidth={1.5} />
              </span>
            </div>
          </Link>
        </Reveal>

        <div className="mt-16 flex gap-6 overflow-x-auto border-b border-neutral-100 pb-px sm:mt-20 sm:justify-center">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setActiveCategory(cat);
                setVisibleCount(PAGE_SIZE);
              }}
              className={`cursor-pointer relative -mb-px shrink-0 border-b-2 border-transparent pb-4 font-heading text-[11px] uppercase tracking-[0.12em] transition-colors sm:text-xs ${
                activeCategory === cat ? "text-brown" : "text-neutral-300 hover:text-neutral-500"
              }`}
            >
              {cat}
              {activeCategory === cat && (
                <motion.span
                  layoutId="blog-tabs-underline"
                  className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-brown"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="mt-12 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3"
          >
            {visible.length > 0 ? (
              visible.map((post) => <BlogCard key={post.id} post={post} />)
            ) : (
              <p className="col-span-full py-12 text-center font-body text-neutral-300">
                No posts in this category yet.
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        {visibleCount < filtered.length && (
          <div className="mt-12 flex justify-center">
            <Button
              variant="secondary"
              icon={false}
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            >
              See All
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
