import { getAllAdminReviews } from "@/lib/data/admin";
import { AdminReviews } from "@/components/admin/AdminReviews";

export default async function AdminReviewsPage() {
  const reviews = await getAllAdminReviews();

  return <AdminReviews reviews={reviews} />;
}
