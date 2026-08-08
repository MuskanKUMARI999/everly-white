import type { Metadata } from "next";
import { LegalHero } from "@/components/legal/LegalHero";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { returnIntro, returnSections } from "@/components/legal/returnContent";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Return Policy",
  description:
    "Everly White's returns, refund, and cancellation policy for handmade, mirror-inlay pieces.",
};

export default function ReturnPolicyPage() {
  return (
    <>
      <LegalHero
        breadcrumbLabel="Return Policy"
        eyebrow="Before You Order"
        title="Return Policy"
        subtitle="No returns, no exchanges, no cancellations — here's what that means and when we make it right."
      />
      <LegalLayout
        intro={returnIntro}
        sections={returnSections}
        cta={
          <Button href="/contact" icon={false}>
            Contact Us
          </Button>
        }
      />
    </>
  );
}
