import type { Metadata } from "next";
import { AboutContent } from "@/components/about/AboutContent";
import { getActiveBanners } from "@/lib/data/banners";
import { getPageContent } from "@/lib/data/siteContent";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Everly White — the light bearers of a cosmic luxe lifestyle. Our story, our studio, and the craft behind bold minimalism.",
};

export default async function AboutPage() {
  // Every band on this page — its wording, images, icons and links — is edited on Admin → About Us.
  const [heroBanner] = await getActiveBanners("about_hero");
  const content = await getPageContent();

  return (
    <AboutContent
      content={content}
      bannerImage={heroBanner?.image_url}
      bannerAlt={heroBanner?.alt ?? undefined}
    />
  );
}
