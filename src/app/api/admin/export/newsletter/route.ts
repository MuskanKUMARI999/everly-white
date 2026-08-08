import { requireAdmin, getAllSubscribers } from "@/lib/data/admin";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return new Response("Unauthorized", { status: 401 });
  }

  const subscribers = await getAllSubscribers();

  // Generate CSV columns and data rows
  const headers = ["ID", "First Name", "Last Name", "Email", "Phone", "Joined Date"];
  const rows = subscribers.map((sub) => [
    sub.id,
    sub.first_name ?? "",
    sub.last_name ?? "",
    sub.email ?? "",
    sub.phone ?? "",
    new Date(sub.created_at).toISOString(),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((val) => `"${val.replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="newsletter_subscribers.csv"',
      "Cache-Control": "no-store",
    },
  });
}
