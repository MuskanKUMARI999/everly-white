import type { Metadata } from "next";
import { FaqHero } from "@/components/faq/FaqHero";
import { FaqLayoutSidebar } from "@/components/faq/FaqLayoutSidebar";
import { getActiveBanners } from "@/lib/data/banners";
import { getFaqCategories } from "@/lib/data/faqs";
import { getPageContent } from "@/lib/data/siteContent";

export const metadata: Metadata = {
  title: "FAQs",
  description:
    "Answers to common questions about ordering, shipping, product care, and returns at Everly White.",
};

export default async function FaqsPage() {
  // Questions, answers, the hero copy and the closing CTA are all edited on Admin → FAQs.
  const [heroBanner] = await getActiveBanners("faq_hero");
  const categories = await getFaqCategories();
  const content = await getPageContent();

  return (
    <>
      <FaqHero
        content={content.values("faq_hero")}
        bannerImage={heroBanner?.image_url}
        bannerAlt={heroBanner?.alt ?? undefined}
      />
      <FaqLayoutSidebar
        categories={categories}
        ctaContent={content.isVisible("faq_cta") ? content.values("faq_cta") : null}
      />
    </>
  );
}
