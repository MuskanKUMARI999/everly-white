import type { Metadata } from "next";
import { ContactHero } from "@/components/contact/ContactHero";
import { ContactContent } from "@/components/contact/ContactContent";
import { getActiveBanners } from "@/lib/data/banners";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Everly White — questions about an order, a custom request, or corporate and personal gifting enquiries.",
};

export default async function ContactPage() {
  const [heroBanner] = await getActiveBanners("contact_hero");
  return (
    <>
      <ContactHero bannerImage={heroBanner?.image_url} bannerAlt={heroBanner?.alt ?? undefined} />
      <ContactContent />
    </>
  );
}
