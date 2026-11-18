"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { AdminPageSections } from "@/components/admin/AdminPageSections";
import type { AdminSection } from "@/lib/data/admin";

export function AdminAbout({ sections }: { sections: Record<string, AdminSection> }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-heading text-2xl font-light text-neutral-500">About Us Page</h2>
        <Link
          href="/about"
          target="_blank"
          className="inline-flex items-center gap-2 font-body text-base text-brown underline decoration-brown/30 underline-offset-4 transition-colors hover:text-neutral-500"
        >
          View the page
          <ExternalLink size={14} strokeWidth={1.6} />
        </Link>
      </div>

      <div className="border border-neutral-100 bg-pink-100/30 p-6">
        <p className="font-body text-base text-neutral-500">
          Each block below is one band of the About Us page, listed top to bottom. Open a block to
          edit its wording, photos, icons and links, then press Save.
        </p>
        <p className="mt-3 font-body text-base text-neutral-400">
          Two things live elsewhere: the hero photo can also be set as an &ldquo;About Us Page
          Hero&rdquo; banner in <strong>Banners</strong>, which wins over the image below when one is
          active; and the pink promises band at the very bottom is the shared trust bar, edited on{" "}
          <strong>Home Page</strong> because it closes several pages at once.
        </p>
      </div>

      <AdminPageSections page="about" sections={sections} />
    </div>
  );
}
