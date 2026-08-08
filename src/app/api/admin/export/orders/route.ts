import { requireAdmin, getAllOrders } from "@/lib/data/admin";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return new Response("Unauthorized", { status: 401 });
  }

  const orders = await getAllOrders();

  const headers = [
    "Order ID",
    "Order Number",
    "Date",
    "Email",
    "Status",
    "Payment Status",
    "Total (INR)",
    "Items",
  ];

  const rows = orders.map((o) => {
    const itemsStr = o.order_items
      .map((item) => `${item.product_name} (x${item.quantity})`)
      .join("; ");

    return [
      o.id,
      o.order_number,
      new Date(o.created_at).toISOString(),
      // Resolved for account customers too, not just guest checkouts.
      o.customer_email ?? "",
      o.status,
      o.payment_status,
      o.total,
      itemsStr,
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="orders.csv"',
      "Cache-Control": "no-store",
    },
  });
}
