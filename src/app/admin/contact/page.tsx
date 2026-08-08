import { getAllContactSubmissions } from "@/lib/data/admin";
import { AdminContactList } from "@/components/admin/AdminContact";

export default async function AdminContactPage() {
  const submissions = await getAllContactSubmissions();

  return <AdminContactList submissions={submissions} />;
}
