import { getAllAdminBlogPosts } from "@/lib/data/admin";
import { AdminBlog } from "@/components/admin/AdminBlog";

export default async function AdminBlogPage() {
  const posts = await getAllAdminBlogPosts();

  return <AdminBlog posts={posts} />;
}
