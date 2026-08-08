import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { DEFAULT_BLOG_CATEGORY } from "@/components/blog/blogCategories";
import { formatDate } from "@/lib/format/datetime";
import type { Tables } from "@/lib/supabase/database.types";

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  content: { type: string; text?: string; src?: string; alt?: string; caption?: string; items?: string[] }[];
  image: string;
  date: string;
  readTime: string;
  author: string;
  authorRole: string;
  /** SEO overrides from Admin → Blog. Null when unset; title/excerpt are the fallbacks. */
  metaTitle: string | null;
  metaDescription: string | null;
  /** Ticked in Admin → Blog. Drives the homepage Journal pair. */
  featuredOnHome: boolean;
  /** ISO timestamp for sitemap <lastmod>. Distinct from `date`, which is display copy. */
  updatedAt: string;
};

function mapBlogPost(post: Tables<"blog_posts">): BlogPost {
  const metadata = (post.metadata as Record<string, unknown>) ?? {};
  const content = (() => {
    try {
      return JSON.parse(post.content) as BlogPost["content"];
    } catch {
      return [];
    }
  })();

  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    category: (metadata.category as string) ?? DEFAULT_BLOG_CATEGORY,
    excerpt: post.excerpt ?? "",
    content,
    image: post.cover_image ?? "",
    date:
      (metadata.date as string) ??
      formatDate(post.published_at ?? post.created_at, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    readTime: (metadata.readTime as string) ?? "6 min read",
    author: post.author ?? "Everly White Studio",
    authorRole: (metadata.authorRole as string) ?? "Studio Team",
    metaTitle: post.meta_title,
    metaDescription: post.meta_description,
    featuredOnHome: (metadata.featuredOnHome ?? false) === true,
    updatedAt: post.updated_at ?? post.published_at ?? post.created_at,
  };
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("is_published", true)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Error fetching blog posts:", error);
    return [];
  }

  return (data ?? []).map(mapBlogPost);
}

export async function getBlogPostBySlug(
  slug: string,
): Promise<BlogPost | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error) {
    console.error("Error fetching blog post by slug:", error);
    return null;
  }

  return data ? mapBlogPost(data) : null;
}

export async function getBlogSlugs(): Promise<string[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("is_published", true)
    .lte("published_at", new Date().toISOString());

  if (error) {
    console.error("Error fetching blog slugs:", error);
    return [];
  }

  return data?.map((post) => post.slug) ?? [];
}
