"use client";

import { useActionState } from "react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/admin/actions";
import type { AdminCategory } from "@/lib/data/admin";

interface AdminCategoriesProps {
  categories: AdminCategory[];
}

function CreateCategoryForm() {
  const [state, action, isPending] = useActionState(createCategory, null);

  return (
    <form action={action} className="border border-neutral-100 bg-white p-6">
      <h3 className="font-heading text-lg font-light uppercase tracking-widest text-neutral-500">
        Add Category
      </h3>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="font-heading text-[13px] uppercase tracking-widest text-neutral-500">
            Label
          </label>
          <input
            name="label"
            type="text"
            required
            placeholder="e.g. Earrings"
            className="border border-neutral-200 bg-white px-3 py-2 font-body font-medium text-lg text-neutral-500 outline-none transition-colors focus:border-neutral-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-heading text-[13px] uppercase tracking-widest text-neutral-500">
            Key
          </label>
          <input
            name="key"
            type="text"
            placeholder="auto-generated if empty"
            className="border border-neutral-200 bg-white px-3 py-2 font-body font-medium text-lg text-neutral-500 outline-none transition-colors focus:border-neutral-500"
          />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="cursor-pointer disabled:cursor-not-allowed bg-brown px-4 py-2 font-heading text-[13px] uppercase tracking-widest text-beige-light transition-colors hover:bg-neutral-500 disabled:bg-neutral-300"
        >
          {isPending ? "Creating…" : "Create Category"}
        </button>
        {state && (
          <p className={`font-body font-medium text-lg ${state.success ? "text-green-600" : "text-terracotta"}`}>
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}

function CategoryRow({ category }: { category: AdminCategory }) {
  const [updateState, updateAction, updatePending] = useActionState(updateCategory, null);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteCategory, null);

  return (
    <div className="border border-neutral-100 bg-white p-6 transition-colors hover:border-brown/30">
      <form action={updateAction} className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <input type="hidden" name="categoryId" value={category.id} />
        <div className="flex flex-1 flex-col gap-1">
          <label className="font-heading text-[13px] uppercase tracking-widest text-neutral-500">
            Label
          </label>
          <input
            name="label"
            type="text"
            defaultValue={category.label}
            required
            className="border border-neutral-200 bg-white px-3 py-2 font-body font-medium text-lg text-neutral-500 outline-none transition-colors focus:border-neutral-500"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="font-heading text-[13px] uppercase tracking-widest text-neutral-500">
            Key
          </label>
          <input
            name="key"
            type="text"
            defaultValue={category.key}
            required
            className="border border-neutral-200 bg-white px-3 py-2 font-body font-medium text-lg text-neutral-500 outline-none transition-colors focus:border-neutral-500"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={updatePending}
            className="cursor-pointer disabled:cursor-not-allowed bg-brown px-4 py-2 font-heading text-[13px] uppercase tracking-widest text-beige-light transition-colors hover:bg-neutral-500 disabled:bg-neutral-300"
          >
            {updatePending ? "Saving…" : "Save"}
          </button>
          {updateState && (
            <p className={`font-body font-medium text-lg ${updateState.success ? "text-green-600" : "text-terracotta"}`}>
              {updateState.message}
            </p>
          )}
        </div>
      </form>

      <form
        action={deleteAction}
        className="mt-4 inline-flex items-center gap-3"
        onSubmit={(e) => {
          if (!confirm(`Delete category "${category.label}"? This cannot be undone.`)) e.preventDefault();
        }}
      >
        <input type="hidden" name="categoryId" value={category.id} />
        <button
          type="submit"
          disabled={deletePending}
          className="cursor-pointer disabled:cursor-not-allowed font-body font-medium text-lg text-terracotta underline decoration-terracotta/30 underline-offset-4 transition-colors hover:text-terracotta/80"
        >
          {deletePending ? "Deleting…" : "Delete"}
        </button>
        {deleteState && (
          <p className={`font-body font-medium text-lg ${deleteState.success ? "text-green-600" : "text-terracotta"}`}>
            {deleteState.message}
          </p>
        )}
      </form>
    </div>
  );
}

export function AdminCategories({ categories }: AdminCategoriesProps) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-heading text-2xl font-light text-neutral-500">Categories</h2>
      <CreateCategoryForm />
      {categories.length === 0 ? (
        <p className="font-body font-medium text-neutral-500">No categories found.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {categories.map((category) => (
            <CategoryRow key={category.id} category={category} />
          ))}
        </div>
      )}
    </div>
  );
}
