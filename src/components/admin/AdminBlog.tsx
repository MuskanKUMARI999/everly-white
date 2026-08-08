"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createBlogPost, updateBlogPost, deleteBlogPost } from "@/lib/admin/actions";
import { formatDate } from "@/lib/format/datetime";
import type { AdminBlogPost } from "@/lib/data/admin";
import { ImageUrlField } from "@/components/admin/ImageUrlField";
import { BlogContentEditor } from "@/components/admin/BlogContentEditor";
import { BLOG_CATEGORIES, DEFAULT_BLOG_CATEGORY } from "@/components/blog/blogCategories";

const inputClasses =
  "border border-neutral-200 bg-white px-3 py-2 font-body font-medium text-lg text-neutral-500 outline-none transition-colors focus:border-neutral-500";
const labelClasses =
  "font-heading text-[13px] uppercase tracking-widest text-neutral-500";

// ─── Blog Form (create & edit) ────────────────────────────────────────────────

interface BlogFormProps {
  post?: AdminBlogPost;
}

export function BlogForm({ post }: BlogFormProps) {
  const action = post ? updateBlogPost : createBlogPost;
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {post && <input type="hidden" name="postId" value={post.id} />}

      <div className="flex flex-col gap-6 border border-neutral-100 bg-white p-6">
        <h3 className="font-heading text-lg font-light uppercase tracking-widest text-neutral-500">
          Post Details
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className={labelClasses}>Title</label>
            <input name="title" type="text" required defaultValue={post?.title} className={inputClasses} />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className={labelClasses}>Slug</label>
            <input
              name="slug"
              type="text"
              defaultValue={post?.slug}
              placeholder="auto-generated from title if empty"
              className={inputClasses}
            />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className={labelClasses}>Excerpt</label>
            <textarea name="excerpt" rows={2} defaultValue={post?.excerpt ?? ""} className={inputClasses} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClasses}>Author</label>
            <input
              name="author"
              type="text"
              defaultValue={post?.author ?? ""}
              placeholder="Everly White Studio"
              className={inputClasses}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClasses}>Category</label>
            <select
              name="category"
              defaultValue={
                ((post?.metadata as { category?: string } | null)?.category as string) ??
                DEFAULT_BLOG_CATEGORY
              }
              className={inputClasses}
            >
              {BLOG_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <ImageUrlField
              name="coverImage"
              label="Cover Image"
              folder="blog"
              defaultValue={post?.cover_image}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 border border-neutral-100 bg-white p-6">
        <h3 className="font-heading text-lg font-light uppercase tracking-widest text-neutral-500">
          Content
        </h3>
        <BlogContentEditor name="content" defaultValue={post?.content} />
      </div>

      <div className="flex flex-col gap-6 border border-neutral-100 bg-white p-6">
        <h3 className="font-heading text-lg font-light uppercase tracking-widest text-neutral-500">
          SEO
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className={labelClasses}>Meta Title</label>
            <input name="metaTitle" type="text" defaultValue={post?.meta_title ?? ""} className={inputClasses} />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className={labelClasses}>Meta Description</label>
            <textarea name="metaDescription" rows={2} defaultValue={post?.meta_description ?? ""} className={inputClasses} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 font-body font-medium text-lg text-neutral-500">
          <input
            type="checkbox"
            name="isPublished"
            defaultChecked={post?.is_published ?? false}
            className="h-4 w-4 accent-brown"
          />
          Published
        </label>
        {/* The homepage Journal section used to hardcode two slugs, so renaming a post silently
            emptied a card. It now shows whichever posts are ticked here (newest two), falling
            back to the most recent posts when nothing is ticked. */}
        <label className="flex items-center gap-2 font-body font-medium text-lg text-neutral-500">
          <input
            type="checkbox"
            name="featuredOnHome"
            defaultChecked={
              (((post?.metadata as Record<string, unknown> | null)?.featuredOnHome ?? false) === true)
            }
            className="h-4 w-4 accent-brown"
          />
          Feature on homepage
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="cursor-pointer disabled:cursor-not-allowed bg-brown px-6 py-3 font-heading text-[13px] uppercase tracking-widest text-beige-light transition-colors hover:bg-neutral-500 disabled:bg-neutral-300"
        >
          {isPending ? "Saving…" : post ? "Update Post" : "Create Post"}
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

// ─── Admin Blog List ──────────────────────────────────────────────────────────

interface AdminBlogProps {
  posts: AdminBlogPost[];
}

function DeletePost({ postId, postTitle }: { postId: string; postTitle: string }) {
  const [state, action, isPending] = useActionState(deleteBlogPost, null);
  return (
    <form
      action={action}
      className="inline"
      onSubmit={(e) => {
        if (!confirm(`Delete "${postTitle}"? This cannot be undone.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="postId" value={postId} />
      <button
        type="submit"
        disabled={isPending}
        className="cursor-pointer disabled:cursor-not-allowed font-body font-medium text-lg text-terracotta underline decoration-terracotta/30 underline-offset-4 transition-colors hover:text-terracotta/80"
      >
        {isPending ? "Deleting…" : "Delete"}
      </button>
      {state && (
        <span className={`ml-2 font-body font-medium text-lg ${state.success ? "text-green-600" : "text-terracotta"}`}>
          {state.message}
        </span>
      )}
    </form>
  );
}

export function AdminBlog({ posts }: AdminBlogProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-heading text-2xl font-light text-neutral-500">
          Blog Posts
          <span className="ml-2 font-body text-lg font-normal text-neutral-500">
            ({posts.length})
          </span>
        </h2>
        <Link
          href="/admin/blog/new"
          className="bg-brown px-4 py-2 font-heading text-[13px] uppercase tracking-widest text-beige-light transition-colors hover:bg-neutral-500"
        >
          New Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="font-body font-medium text-neutral-500">No blog posts yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex flex-wrap items-center justify-between gap-4 border border-neutral-100 bg-white p-5 transition-colors hover:border-brown/30"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <p className="font-body text-lg font-semibold text-neutral-500">{post.title}</p>
                {/* Status, author and date wrap rather than run off a phone. */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span
                    className={`rounded-sm px-2 py-0.5 font-heading text-[12px] uppercase tracking-widest ${
                      post.is_published
                        ? "bg-green-50 text-green-600"
                        : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {post.is_published ? "Published" : "Draft"}
                  </span>
                  {post.author && (
                    <span className="font-body font-medium text-lg text-neutral-500">by {post.author}</span>
                  )}
                  <span className="font-body font-medium text-lg text-neutral-500">
                    {formatDate(post.created_at)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href={`/admin/blog/${post.id}`}
                  className="font-body font-medium text-lg text-neutral-500 underline decoration-neutral-200 underline-offset-4 transition-colors hover:text-brown"
                >
                  Edit
                </Link>
                <DeletePost postId={post.id} postTitle={post.title} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
