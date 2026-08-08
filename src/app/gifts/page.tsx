import type { Metadata } from "next";
import { GiftsHero } from "@/components/gifts/GiftsHero";
import { GiftsContent } from "@/components/gifts/GiftsContent";
import { getActiveBanners } from "@/lib/data/banners";

export const metadata: Metadata = {
  title: "Gifts",
  description:
    "Corporate gifting and gifting for loved ones at Everly White — handcrafted mirror-work pieces for the people and partnerships that matter most.",
};

export default async function GiftsPage() {
  const [heroBanner] = await getActiveBanners("gifts_hero");
  return (
    <>
      <GiftsHero bannerImage={heroBanner?.image_url} bannerAlt={heroBanner?.alt ?? undefined} />
      <GiftsContent />
    </>
  );
}
