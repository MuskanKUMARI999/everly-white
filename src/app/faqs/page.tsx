import type { Metadata } from "next";
import { FaqHero } from "@/components/faq/FaqHero";
import { FaqLayoutSidebar } from "@/components/faq/FaqLayoutSidebar";
import { getActiveBanners } from "@/lib/data/banners";

export const metadata: Metadata = {
  title: "FAQs",
  description:
    "Answers to common questions about ordering, shipping, product care, and returns at Everly White.",
};

export default async function FaqsPage() {
  const [heroBanner] = await getActiveBanners("faq_hero");
  return (
    <>
      <FaqHero bannerImage={heroBanner?.image_url} bannerAlt={heroBanner?.alt ?? undefined} />
      <FaqLayoutSidebar />
    </>
  );
}
