"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { AdminPageSections } from "@/components/admin/AdminPageSections";
import type { AdminSection } from "@/lib/data/admin";

export function AdminHome({ sections }: { sections: Record<string, AdminSection> }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-heading text-2xl font-light text-neutral-500">Home Page</h2>
        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-2 font-body text-base text-brown underline decoration-brown/30 underline-offset-4 transition-colors hover:text-neutral-500"
        >
          View the page
          <ExternalLink size={14} strokeWidth={1.6} />
        </Link>
      </div>

      <div className="border border-neutral-100 bg-pink-100/30 p-6">
        <p className="font-body text-base text-neutral-500">
          Each block below is one band of the homepage, listed top to bottom. Open a block to edit
          its wording, images and buttons, then press Save.
        </p>
        <p className="mt-3 font-body text-base text-neutral-400">
          What is <em>not</em> here is anything the site already manages elsewhere: the hero slides
          are in <strong>Banners</strong>, the products shown come from <strong>Products</strong>,
          the review cards from <strong>Reviews</strong>, and the journal pair from the
          &ldquo;Feature on homepage&rdquo; tick in <strong>Blog</strong>. Those sections only let
          you set how many to show.
        </p>
      </div>

      <AdminPageSections page="home" sections={sections} />
    </div>
  );
}
