import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BlogForm } from "@/components/admin/AdminBlog";

export default function NewBlogPostPage() {
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/blog"
        className="inline-flex items-center gap-2 font-heading text-[13px] uppercase tracking-widest text-neutral-500 transition-colors hover:text-brown"
      >
        <ArrowLeft size={14} strokeWidth={1.4} />
        Back to Blog
      </Link>
      <h2 className="font-heading text-2xl font-light text-neutral-500">Create Blog Post</h2>
      <BlogForm />
    </div>
  );
}
