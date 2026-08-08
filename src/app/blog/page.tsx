import type { Metadata } from "next";
import { BlogHero } from "@/components/blog/BlogHero";
import { BlogGrid } from "@/components/blog/BlogGrid";
import { getAllBlogPosts } from "@/lib/data/blog";
import { getActiveBanners } from "@/lib/data/banners";

export const metadata: Metadata = {
  title: "Blog",
  description: "Stories on craft, meaning, and mindful living, straight from the Everly White studio.",
};

export default async function BlogPage() {
  const posts = await getAllBlogPosts();
  const [heroBanner] = await getActiveBanners("blog_hero");
  return (
    <>
      <BlogHero bannerImage={heroBanner?.image_url} bannerAlt={heroBanner?.alt ?? undefined} />
      <BlogGrid posts={posts} />
    </>
  );
}
