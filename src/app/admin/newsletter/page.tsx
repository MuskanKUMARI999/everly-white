import { getAllSubscribers } from "@/lib/data/admin";
import { AdminNewsletter } from "@/components/admin/AdminNewsletter";

export default async function AdminNewsletterPage() {
  const subscribers = await getAllSubscribers();

  return <AdminNewsletter subscribers={subscribers} />;
}
