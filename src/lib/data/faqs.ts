import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface FaqItem {
  id: string;
  question: string;
  /** Plain text with [label](/path) inline links — render it through <RichText>. */
  answer: string;
}

export interface FaqCategory {
  id: string;
  title: string;
  items: FaqItem[];
}

/**
 * The FAQ accordion, in display order. Categories and questions are managed in Admin → FAQs;
 * RLS hides the ones toggled off, so this only ever returns what should be public.
 *
 * A category with no active questions is dropped rather than rendered as a heading above nothing —
 * the same treatment the homepage gives an empty testimonials grid.
 */
export async function getFaqCategories(): Promise<FaqCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("faq_categories")
    .select("id, title, faq_items(id, question, answer, position, is_active)")
    .order("position", { ascending: true });

  if (error) {
    console.error("Error fetching FAQs:", error);
    return [];
  }

  return (data ?? [])
    .map((category) => ({
      id: category.id,
      title: category.title,
      items: (category.faq_items ?? [])
        // Ordering an embedded table through PostgREST is possible but easy to get wrong on a
        // join; the row count here is tiny, so sort it where it is obvious.
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((item) => ({ id: item.id, question: item.question, answer: item.answer })),
    }))
    .filter((category) => category.items.length > 0);
}
