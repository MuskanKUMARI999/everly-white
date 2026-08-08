import type { Metadata } from "next";
import { LegalHero } from "@/components/legal/LegalHero";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { termsIntro, termsSections } from "@/components/legal/termsContent";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "The terms and conditions governing shipping, orders, product images, and intellectual property at Everly White.",
};

export default function TermsPage() {
  return (
    <>
      <LegalHero
        breadcrumbLabel="Terms & Conditions"
        eyebrow="The Fine Print"
        title="Terms & Conditions"
        subtitle={termsIntro}
      />
      <LegalLayout sections={termsSections} />
    </>
  );
}
