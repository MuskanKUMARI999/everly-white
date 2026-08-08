import { redirect } from "next/navigation";
import { requireAdmin, getUnresolvedContactCount } from "@/lib/data/admin";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const admin = await requireAdmin();
  if (!admin) {
    redirect("/");
  }

  const unreadContactCount = await getUnresolvedContactCount();
  const adminName = admin.profile?.full_name || admin.user?.email || "Admin";

  return (
    <AdminShell adminName={adminName} unreadContactCount={unreadContactCount}>
      {children}
    </AdminShell>
  );
}
