import type { MetadataRoute } from "next";
import { getAllProducts } from "@/lib/data/products";
import { getAllBlogPosts } from "@/lib/data/blog";
import { getAllCollections } from "@/lib/data/collections";
import { siteUrl } from "@/lib/site";

// Every dynamic entry comes from the same queries the pages themselves use, which already filter on
// is_available / is_published / published_at. Querying the tables directly here would risk listing
// a draft post or a withdrawn product — a sitemap that advertises 404s or unpublished drafts is
// worse than no sitemap at all.
//
// Deliberately excluded: /cart, /checkout, the auth screens, /account/*, /admin/*, /orders and
// /api/* (private or transactional), /search (no content of its own) and /collection (a redirect —
// redirects should never appear in a sitemap).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const staticRoutes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/products", priority: 0.9, changeFrequency: "weekly" },
    { path: "/about", priority: 0.7, changeFrequency: "monthly" },
    { path: "/blog", priority: 0.7, changeFrequency: "weekly" },
    { path: "/reviews", priority: 0.6, changeFrequency: "weekly" },
    { path: "/gifts", priority: 0.6, changeFrequency: "monthly" },
    { path: "/faqs", priority: 0.5, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
    { path: "/track-order", priority: 0.4, changeFrequency: "yearly" },
    { path: "/return", priority: 0.3, changeFrequency: "yearly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  ];

  const [products, posts, collections] = await Promise.all([
    getAllProducts(),
    getAllBlogPosts(),
    getAllCollections(),
  ]);

  const now = new Date();

  return [
    ...staticRoutes.map(({ path, priority, changeFrequency }) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
    })),
    ...collections.map((collection) => ({
      url: `${base}/collection/${collection.slug}`,
      lastModified: new Date(collection.updated_at ?? collection.created_at),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: `${base}/products/${product.slug}`,
      lastModified: new Date(product.updated_at ?? product.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...posts.map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
