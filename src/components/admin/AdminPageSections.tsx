"use client";

import { AdminSectionForm } from "@/components/admin/AdminSectionForm";
import { sectionsForPage, type SectionSchema } from "@/lib/content/sections";
import type { AdminSection } from "@/lib/data/admin";

/**
 * Every editable section of one storefront page, in the order it appears on that page.
 *
 * The list comes from the schema rather than the database, so a section nobody has ever edited
 * still gets a form — pre-filled with the copy the site is currently showing.
 */
export function AdminPageSections({
  page,
  sections,
}: {
  page: SectionSchema["page"];
  sections: Record<string, AdminSection>;
}) {
  const schemas = sectionsForPage(page);

  return (
    <div className="flex flex-col gap-4">
      {schemas.map((schema) => {
        const section = sections[schema.key];
        if (!section) return null;
        return <AdminSectionForm key={schema.key} schema={schema} section={section} />;
      })}
    </div>
  );
}
