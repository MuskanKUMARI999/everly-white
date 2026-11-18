"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink, Plus } from "lucide-react";
import {
  createFaqCategory,
  createFaqItem,
  deleteFaqCategory,
  deleteFaqItem,
  updateFaqCategory,
  updateFaqItem,
} from "@/lib/admin/actions";
import { AdminPageSections } from "@/components/admin/AdminPageSections";
import type { AdminFaqCategory, AdminFaqItem, AdminSection } from "@/lib/data/admin";

const inputClasses =
  "border border-neutral-200 bg-white px-3 py-2 font-body font-medium text-base text-neutral-500 outline-none transition-colors focus:border-neutral-500";
const labelClasses = "font-heading text-sm uppercase tracking-widest text-neutral-500";
const helpClasses = "font-body text-sm text-neutral-400";
const primaryButton =
  "cursor-pointer disabled:cursor-not-allowed bg-brown px-4 py-2 font-heading text-sm uppercase tracking-widest text-beige-light transition-colors hover:bg-neutral-500 disabled:bg-neutral-300";
const deleteButton =
  "cursor-pointer disabled:cursor-not-allowed font-body font-medium text-base text-terracotta underline decoration-terracotta/30 underline-offset-4 transition-colors hover:text-terracotta/80";

const ANSWER_HELP =
  "Plain text. Leave a blank line between paragraphs, and write a link as [return policy](/return) — internal paths start with a slash, external ones with https://.";

function Result({ state }: { state: { success: boolean; message: string } | null }) {
  if (!state) return null;
  return (
    <span className={`font-body text-base ${state.success ? "text-green-600" : "text-terracotta"}`}>
      {state.message}
    </span>
  );
}

function QuestionRow({
  item,
  categories,
}: {
  item: AdminFaqItem;
  categories: AdminFaqCategory[];
}) {
  const [updateState, updateAction, updatePending] = useActionState(updateFaqItem, null);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteFaqItem, null);
  const [open, setOpen] = useState(false);

  return (
    <div className={`border border-neutral-100 ${item.is_active ? "bg-white" : "bg-white opacity-60"}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="cursor-pointer flex w-full items-center justify-between gap-4 p-4 text-left"
      >
        <span className="min-w-0">
          <span className="font-body font-medium text-base text-neutral-500">{item.question}</span>
          {!item.is_active && (
            <span className="ml-3 border border-neutral-200 px-2 py-0.5 font-heading text-xs uppercase tracking-widest text-neutral-400">
              Hidden
            </span>
          )}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={1.6}
          className={`shrink-0 text-brown transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-neutral-100 p-4">
          <form action={updateAction} className="flex flex-col gap-4">
            <input type="hidden" name="itemId" value={item.id} />

            <div className="flex flex-col gap-1">
              <label className={labelClasses}>Question</label>
              <input name="question" type="text" defaultValue={item.question} className={inputClasses} />
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClasses}>Answer</label>
              <textarea
                name="answer"
                rows={5}
                defaultValue={item.answer}
                className={`${inputClasses} resize-y`}
              />
              <p className={helpClasses}>{ANSWER_HELP}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className={labelClasses}>Category</label>
                <select name="categoryId" defaultValue={item.category_id} className={inputClasses}>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClasses}>Position (lower shows first)</label>
                <input
                  name="position"
                  type="number"
                  min="0"
                  defaultValue={item.position}
                  className={inputClasses}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 font-body font-medium text-lg text-neutral-500">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={item.is_active}
                  className="h-4 w-4 accent-brown"
                />
                Show on the site
              </label>
              <button type="submit" disabled={updatePending} className={primaryButton}>
                {updatePending ? "Saving…" : "Save"}
              </button>
              <Result state={updateState} />
            </div>
          </form>

          <form
            action={deleteAction}
            onSubmit={(e) => {
              if (!confirm("Delete this question? This cannot be undone.")) e.preventDefault();
            }}
            className="mt-4 inline-flex items-center gap-3"
          >
            <input type="hidden" name="itemId" value={item.id} />
            <button type="submit" disabled={deletePending} className={deleteButton}>
              {deletePending ? "Deleting…" : "Delete question"}
            </button>
            <Result state={deleteState} />
          </form>
        </div>
      )}
    </div>
  );
}

function AddQuestionForm({ categoryId, nextPosition }: { categoryId: string; nextPosition: number }) {
  const [state, action, isPending] = useActionState(createFaqItem, null);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer inline-flex items-center gap-2 border border-neutral-200 bg-white px-3 py-2 font-heading text-sm uppercase tracking-widest text-neutral-500 transition-colors hover:border-brown hover:text-brown"
      >
        <Plus size={14} strokeWidth={1.8} />
        Add question
      </button>
    );
  }

  return (
    <form action={action} className="border border-brown/30 bg-white p-4">
      <input type="hidden" name="categoryId" value={categoryId} />
      <input type="hidden" name="position" value={nextPosition} />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Question</label>
          <input name="question" type="text" className={inputClasses} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Answer</label>
          <textarea name="answer" rows={5} className={`${inputClasses} resize-y`} />
          <p className={helpClasses}>{ANSWER_HELP}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 font-body font-medium text-lg text-neutral-500">
            <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4 accent-brown" />
            Show on the site
          </label>
          <button type="submit" disabled={isPending} className={primaryButton}>
            {isPending ? "Adding…" : "Add question"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="cursor-pointer font-body font-medium text-base text-neutral-400 underline decoration-neutral-200 underline-offset-4 transition-colors hover:text-brown"
          >
            Cancel
          </button>
          <Result state={state} />
        </div>
      </div>
    </form>
  );
}

function CategoryBlock({
  category,
  categories,
}: {
  category: AdminFaqCategory;
  categories: AdminFaqCategory[];
}) {
  const [updateState, updateAction, updatePending] = useActionState(updateFaqCategory, null);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteFaqCategory, null);

  // New questions land at the end of the category rather than sharing position 0 with the first
  // one, where the order between them would come down to whatever the database returned first.
  const nextPosition = category.items.reduce((max, item) => Math.max(max, item.position + 1), 0);

  return (
    <div className="border border-neutral-100 bg-pink-100/20 p-6">
      <form action={updateAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input type="hidden" name="categoryId" value={category.id} />
        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Category name</label>
          <input name="title" type="text" defaultValue={category.title} className={inputClasses} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Position (lower shows first)</label>
          <input
            name="position"
            type="number"
            min="0"
            defaultValue={category.position}
            className={inputClasses}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
          <label className="flex items-center gap-2 font-body font-medium text-lg text-neutral-500">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={category.is_active}
              className="h-4 w-4 accent-brown"
            />
            Show on the site
          </label>
          <button type="submit" disabled={updatePending} className={primaryButton}>
            {updatePending ? "Saving…" : "Save category"}
          </button>
          <Result state={updateState} />
        </div>
      </form>

      <div className="mt-5 flex flex-col gap-3">
        {category.items.length === 0 ? (
          <p className={helpClasses}>
            No questions in this category yet — it stays off the page until it has one.
          </p>
        ) : (
          category.items.map((item) => (
            <QuestionRow key={item.id} item={item} categories={categories} />
          ))
        )}
        <AddQuestionForm categoryId={category.id} nextPosition={nextPosition} />
      </div>

      <form
        action={deleteAction}
        onSubmit={(e) => {
          if (
            !confirm(
              `Delete "${category.title}" and its ${category.items.length} question(s)? This cannot be undone.`,
            )
          ) {
            e.preventDefault();
          }
        }}
        className="mt-5 inline-flex items-center gap-3 border-t border-neutral-100 pt-4"
      >
        <input type="hidden" name="categoryId" value={category.id} />
        <button type="submit" disabled={deletePending} className={deleteButton}>
          {deletePending ? "Deleting…" : "Delete category"}
        </button>
        <Result state={deleteState} />
      </form>
    </div>
  );
}

function CreateCategoryForm({ nextPosition }: { nextPosition: number }) {
  const [state, action, isPending] = useActionState(createFaqCategory, null);

  return (
    <form action={action} className="border border-neutral-100 bg-white p-6">
      <h3 className="font-heading text-lg font-light uppercase tracking-widest text-neutral-500">
        Add Category
      </h3>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Category name</label>
          <input name="title" type="text" placeholder="Gifting" className={inputClasses} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Position (lower shows first)</label>
          <input
            name="position"
            type="number"
            min="0"
            defaultValue={nextPosition}
            className={inputClasses}
          />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 font-body font-medium text-lg text-neutral-500">
          <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4 accent-brown" />
          Show on the site
        </label>
        <button type="submit" disabled={isPending} className={primaryButton}>
          {isPending ? "Creating…" : "Create category"}
        </button>
        <Result state={state} />
      </div>
    </form>
  );
}

interface AdminFaqsProps {
  categories: AdminFaqCategory[];
  sections: Record<string, AdminSection>;
}

export function AdminFaqs({ categories, sections }: AdminFaqsProps) {
  const questionCount = categories.reduce((total, category) => total + category.items.length, 0);
  const nextCategoryPosition = categories.reduce(
    (max, category) => Math.max(max, category.position + 1),
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-heading text-2xl font-light text-neutral-500">
          FAQs
          <span className="ml-2 font-body text-lg font-normal text-neutral-500">
            ({questionCount})
          </span>
        </h2>
        <Link
          href="/faqs"
          target="_blank"
          className="inline-flex items-center gap-2 font-body text-base text-brown underline decoration-brown/30 underline-offset-4 transition-colors hover:text-neutral-500"
        >
          View the page
          <ExternalLink size={14} strokeWidth={1.6} />
        </Link>
      </div>

      <div className="border border-neutral-100 bg-pink-100/30 p-6">
        <p className="font-body text-base text-neutral-500">
          The two blocks below are the top and bottom of the FAQ page; the questions themselves
          follow. A category with no visible questions is left off the page entirely rather than
          shown as an empty heading.
        </p>
      </div>

      <AdminPageSections page="faqs" sections={sections} />

      <h3 className="mt-2 font-heading text-xl font-light uppercase tracking-widest text-neutral-500">
        Questions
      </h3>

      <CreateCategoryForm nextPosition={nextCategoryPosition} />

      {categories.length === 0 ? (
        <p className="font-body text-base text-neutral-500">No categories yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {categories.map((category) => (
            <CategoryBlock key={category.id} category={category} categories={categories} />
          ))}
        </div>
      )}
    </div>
  );
}
