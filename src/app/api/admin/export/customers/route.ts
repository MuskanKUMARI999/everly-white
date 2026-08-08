import { requireAdmin, getAllCustomers } from "@/lib/data/admin";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return new Response("Unauthorized", { status: 401 });
  }

  const customers = await getAllCustomers();

  const headers = ["ID", "Full Name", "Email", "Phone", "Role", "Joined Date"];
  const rows = customers.map((c) => [
    c.id,
    c.full_name ?? "",
    c.email ?? "",
    c.phone ?? "",
    c.is_admin ? "Admin" : "Customer",
    new Date(c.created_at).toISOString(),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="customers.csv"',
      "Cache-Control": "no-store",
    },
  });
}
