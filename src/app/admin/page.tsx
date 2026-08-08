import Link from "next/link";
import {
  ShoppingBag,
  CheckCircle2,
  Clock,
  Wallet,
  Package,
  PackageCheck,
  ArrowUpRight,
  AlertTriangle,
  CircleCheck,
} from "lucide-react";
import {
  getDashboardStats,
  getSalesChartData,
  getLowStockProducts,
  requireAdmin,
} from "@/lib/data/admin";
import { formatPrice } from "@/components/sections/productFormat";
import { SalesChart } from "@/components/admin/SalesChart";

export default async function AdminHomePage() {
  // The tiles are counted in SQL now, so the dashboard no longer drags the whole orders and
  // products tables over the wire just to reduce them here.
  const [admin, stats, chartData, lowStockProducts] = await Promise.all([
    requireAdmin(),
    getDashboardStats(),
    getSalesChartData(),
    getLowStockProducts(),
  ]);

  const adminName = admin?.profile?.full_name || admin?.user?.email || "Admin";

  const tiles = [
    { label: "Total Orders", value: stats.totalOrders.toString(), icon: ShoppingBag, accent: "bg-pink-100 text-brown" },
    { label: "Paid Orders", value: stats.paidOrders.toString(), icon: CheckCircle2, accent: "bg-green-50 text-green-600" },
    { label: "Pending Orders", value: stats.pendingOrders.toString(), icon: Clock, accent: "bg-yellow-50 text-yellow-600" },
    // Paid orders only — an unpaid or refunded order is not revenue.
    { label: "Revenue (Paid)", value: formatPrice(stats.totalRevenue), icon: Wallet, accent: "bg-pink-100 text-brown" },
    { label: "Products", value: stats.totalProducts.toString(), icon: Package, accent: "bg-neutral-100 text-neutral-500" },
    { label: "Available Products", value: stats.availableProducts.toString(), icon: PackageCheck, accent: "bg-green-50 text-green-600" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-light text-neutral-500 sm:text-3xl">Dashboard</h1>
        <p className="mt-1 font-body text-lg text-neutral-500">Welcome back, {adminName}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-4 rounded-lg border border-neutral-100 bg-white p-6 transition-colors hover:border-brown/30 hover:shadow-sm"
          >
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${stat.accent}`}>
              <stat.icon size={22} strokeWidth={1.6} />
            </span>
            <div>
              <p className="font-heading text-sm uppercase tracking-widest text-neutral-500">
                {stat.label}
              </p>
              <p className="mt-1 font-heading text-2xl font-light text-neutral-500">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-neutral-100 bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 font-heading text-lg font-light text-neutral-500">
            {lowStockProducts.length > 0 ? (
              <AlertTriangle size={20} strokeWidth={1.8} className="text-yellow-600" />
            ) : (
              <CircleCheck size={20} strokeWidth={1.8} className="text-green-600" />
            )}
            Low Stock
          </h2>
          <Link
            href="/admin/products"
            className="font-heading text-sm uppercase tracking-widest text-neutral-500 underline decoration-neutral-200 underline-offset-4 hover:text-brown"
          >
            All Products
          </Link>
        </div>

        {lowStockProducts.length === 0 ? (
          <p className="mt-4 font-body text-base text-neutral-500">
            All available products are well stocked.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col divide-y divide-neutral-100">
            {lowStockProducts.map((product) => (
              <li
                key={product.id}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <Link
                  href={`/admin/products/${product.id}`}
                  className="font-body text-base text-neutral-500 hover:text-brown"
                >
                  {product.name}
                </Link>
                <span
                  className={`font-heading text-sm uppercase tracking-widest ${
                    product.stock_quantity === 0 ? "text-terracotta" : "text-yellow-600"
                  }`}
                >
                  {product.stock_quantity === 0 ? "Out of stock" : `${product.stock_quantity} left`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-neutral-100 bg-white p-6">
        <SalesChart data={chartData} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/admin/orders"
          className="group flex items-center justify-between rounded-lg bg-brown px-6 py-5 font-heading text-sm uppercase tracking-widest text-beige-light transition-colors hover:bg-neutral-500"
        >
          View Orders
          <ArrowUpRight size={18} strokeWidth={1.8} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
        <Link
          href="/admin/products"
          className="group flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-6 py-5 font-heading text-sm uppercase tracking-widest text-neutral-500 transition-colors hover:border-brown hover:text-brown"
        >
          View Products
          <ArrowUpRight size={18} strokeWidth={1.8} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </div>
  );
}
