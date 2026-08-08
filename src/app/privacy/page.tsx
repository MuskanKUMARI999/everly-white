import type { Metadata } from "next";
import { LegalHero } from "@/components/legal/LegalHero";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { privacyIntro, privacySections } from "@/components/legal/privacyContent";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Everly White collects, uses, and protects your personal information when you visit or shop with us.",
};

export default function PrivacyPage() {
  return (
    <>
      <LegalHero
        breadcrumbLabel="Privacy Policy"
        eyebrow="Your Trust Matters"
        title="Privacy Policy"
        subtitle="How we collect, use, and protect your personal information."
      />
      <LegalLayout intro={privacyIntro} sections={privacySections} />
    </>
  );
}
