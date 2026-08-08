import type { Metadata } from "next";
import { AboutContent } from "@/components/about/AboutContent";
import { getActiveBanners } from "@/lib/data/banners";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Everly White — the light bearers of a cosmic luxe lifestyle. Our story, our studio, and the craft behind bold minimalism.",
};

export default async function AboutPage() {
  const [heroBanner] = await getActiveBanners("about_hero");
  return (
    <AboutContent
      hero="signage"
      bannerImage={heroBanner?.image_url}
      bannerAlt={heroBanner?.alt ?? undefined}
    />
  );
}
