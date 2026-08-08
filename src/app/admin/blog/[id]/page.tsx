import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdminBlogPostById } from "@/lib/data/admin";
import { BlogForm } from "@/components/admin/AdminBlog";

interface EditBlogPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBlogPostPage({ params }: EditBlogPostPageProps) {
  const { id } = await params;
  const post = await getAdminBlogPostById(id);

  if (!post) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/blog"
        className="inline-flex items-center gap-2 font-heading text-[13px] uppercase tracking-widest text-neutral-500 transition-colors hover:text-brown"
      >
        <ArrowLeft size={14} strokeWidth={1.4} />
        Back to Blog
      </Link>
      <h2 className="font-heading text-2xl font-light text-neutral-500">Edit Blog Post</h2>
      <BlogForm post={post} />
    </div>
  );
}
