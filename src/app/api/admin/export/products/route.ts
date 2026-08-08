import { requireAdmin, getAllProducts } from "@/lib/data/admin";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return new Response("Unauthorized", { status: 401 });
  }

  const products = await getAllProducts();

  const headers = [
    "Product ID",
    "Name",
    "Slug",
    "Price",
    "Stock",
    "Available",
    "Created At",
  ];

  const rows = products.map((p) => [
    p.id,
    p.name,
    p.slug,
    p.price,
    p.stock_quantity,
    p.is_available ? "Yes" : "No",
    new Date(p.created_at).toISOString(),
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
      "Content-Disposition": 'attachment; filename="products.csv"',
      "Cache-Control": "no-store",
    },
  });
}
