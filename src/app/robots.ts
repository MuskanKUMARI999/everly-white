import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Disallow is not a security control — /admin and /account are gated by the proxy and their own
// layout guards. This only keeps private and transactional pages out of search results, where they
// would waste crawl budget and could surface a customer's order page in an index.
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/account/",
        "/api/",
        "/auth/",
        "/cart",
        "/checkout",
        "/orders",
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
        // Query-driven and infinite; nothing here is worth indexing on its own.
        "/search",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
