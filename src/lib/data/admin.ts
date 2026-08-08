import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { istDayKey } from "@/lib/format/datetime";
import type { Tables } from "@/lib/supabase/database.types";

export type AdminCategory = Tables<"categories">;

export type AdminCollection = Tables<"collections">;

export type AdminOrder = Tables<"orders"> & {
  order_items: Tables<"order_items">[];
  /**
   * Who to contact about this order. `guest_email` for guest checkouts; for signed-in customers the
   * orders table holds only `user_id`, so the address is resolved from auth.users — without it the
   * admin panel showed "Logged-in user" and no way to reach them.
   */
  customer_email: string | null;
};

export type AdminProduct = Tables<"products"> & {
  product_images: Tables<"product_images">[];
  product_videos?: Tables<"product_videos">[];
};

export type AdminCoupon = Tables<"coupons">;

// PostgREST caps any single response at db-max-rows (1000 by default), and it does so silently —
// no error, just a short array. Every admin list below drives a table with client-side paging, so a
// truncated fetch would simply hide rows past the cap. This walks the range window until a page
// comes back short, so "get all" means all.
const PAGE_SIZE = 1000;

async function fetchAllRows<T>(
  runPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  label: string,
): Promise<T[]> {
  const rows: T[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await runPage(from, from + PAGE_SIZE - 1);
    if (error) {
      console.error(`Error fetching ${label}:`, error);
      // Return what was collected rather than nothing — a partial list beats an empty screen.
      return rows;
    }
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }

  return rows;
}

// Emails live in auth.users, not in `profiles` or `orders`, and the admin API pages separately from
// PostgREST. Asking for perPage 1000 returned exactly the first 1000 users with no indication there
// were more, so anyone past that silently showed up with a blank email rather than an error.
//
// Fetched in one bulk pass rather than a getUserById per row: a page listing N orders would
// otherwise fire N sequential admin API calls.
async function fetchUserEmailMap(
  supabase: ReturnType<typeof createServiceClient>,
): Promise<Map<string, string | undefined>> {
  const emails = new Map<string, string | undefined>();
  const AUTH_PAGE_SIZE = 1000;

  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: AUTH_PAGE_SIZE,
    });
    if (error) {
      console.error("Error fetching user emails:", error);
      break;
    }
    const users = data?.users ?? [];
    users.forEach((user) => emails.set(user.id, user.email));
    if (users.length < AUTH_PAGE_SIZE) break;
  }

  return emails;
}

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (!profile?.is_admin) return null;

  return { user: userData.user, profile };
}

export async function getAllOrders(): Promise<AdminOrder[]> {
  if (!(await requireAdmin())) return [];

  const supabase = createServiceClient();
  const orders = await fetchAllRows<Omit<AdminOrder, "customer_email">>(
    (from, to) =>
      supabase
        .from("orders")
        .select(
          `
      *,
      order_items (*)
    `,
        )
        .order("created_at", { ascending: false })
        .range(from, to)
        .overrideTypes<Omit<AdminOrder, "customer_email">[]>(),
    "admin orders",
  );

  // Skip the auth lookup entirely when every order is a guest checkout.
  const hasAccountOrders = orders.some((order) => !order.guest_email && order.user_id);
  const emails = hasAccountOrders
    ? await fetchUserEmailMap(supabase)
    : new Map<string, string | undefined>();

  return orders.map((order) => ({
    ...order,
    customer_email:
      order.guest_email ?? (order.user_id ? (emails.get(order.user_id) ?? null) : null),
  }));
}

export async function getAllCategories(): Promise<AdminCategory[]> {
  if (!(await requireAdmin())) return [];

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("label", { ascending: true });

  if (error) {
    console.error("Error fetching admin categories:", error);
    return [];
  }

  return (data as AdminCategory[]) ?? [];
}

export async function getAllProducts(): Promise<AdminProduct[]> {
  if (!(await requireAdmin())) return [];

  const supabase = createServiceClient();
  return fetchAllRows<AdminProduct>(
    (from, to) =>
      supabase
        .from("products")
        .select(
          `
      *,
      product_images (*)
    `,
        )
        .order("created_at", { ascending: false })
        .range(from, to)
        .overrideTypes<AdminProduct[]>(),
    "admin products",
  );
}

const LOW_STOCK_THRESHOLD = 5;

export async function getLowStockProducts(): Promise<AdminProduct[]> {
  if (!(await requireAdmin())) return [];

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      product_images (*)
    `,
    )
    .eq("is_available", true)
    .lte("stock_quantity", LOW_STOCK_THRESHOLD)
    .order("stock_quantity", { ascending: true });

  if (error) {
    console.error("Error fetching low-stock products:", error);
    return [];
  }

  return (data as AdminProduct[]) ?? [];
}

export async function getAllCollections(): Promise<AdminCollection[]> {
  if (!(await requireAdmin())) return [];

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .order("title", { ascending: true });

  if (error) {
    console.error("Error fetching admin collections:", error);
    return [];
  }

  return (data as AdminCollection[]) ?? [];
}

export async function getProductById(id: string): Promise<AdminProduct | null> {
  if (!(await requireAdmin())) return null;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      product_images (*),
      product_videos (*)
    `,
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching admin product:", error);
    return null;
  }

  return (data as AdminProduct) ?? null;
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export type AdminReview = Tables<"reviews"> & {
  product: Pick<Tables<"products">, "id" | "name"> | null;
};

export async function getAllAdminReviews(): Promise<AdminReview[]> {
  if (!(await requireAdmin())) return [];

  const supabase = createServiceClient();
  return fetchAllRows<AdminReview>(
    (from, to) =>
      supabase
        .from("reviews")
        .select("*, product:products (id, name)")
        .order("created_at", { ascending: false })
        .range(from, to)
        .overrideTypes<AdminReview[]>(),
    "admin reviews",
  );
}

// ─── Blog Posts ───────────────────────────────────────────────────────────────

export type AdminBlogPost = Tables<"blog_posts">;

export async function getAllAdminBlogPosts(): Promise<AdminBlogPost[]> {
  if (!(await requireAdmin())) return [];

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching admin blog posts:", error);
    return [];
  }
  return (data as AdminBlogPost[]) ?? [];
}

export async function getAdminBlogPostById(id: string): Promise<AdminBlogPost | null> {
  if (!(await requireAdmin())) return null;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching admin blog post:", error);
    return null;
  }
  return (data as AdminBlogPost) ?? null;
}

// ─── Contact Submissions ──────────────────────────────────────────────────────

export type AdminContact = Tables<"contact_submissions">;

export async function getAllContactSubmissions(): Promise<AdminContact[]> {
  if (!(await requireAdmin())) return [];

  const supabase = createServiceClient();
  return fetchAllRows<AdminContact>(
    (from, to) =>
      supabase
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to),
    "contact submissions",
  );
}

export async function getUnresolvedContactCount(): Promise<number> {
  if (!(await requireAdmin())) return 0;

  const supabase = createServiceClient();
  const { count, error } = await supabase
    .from("contact_submissions")
    .select("id", { count: "exact", head: true })
    .eq("is_resolved", false);

  if (error) {
    console.error("Error counting unresolved contact submissions:", error);
    return 0;
  }
  return count ?? 0;
}

// ─── Newsletter Subscribers ───────────────────────────────────────────────────

export type AdminSubscriber = Tables<"newsletter_subscribers">;

export async function getAllSubscribers(): Promise<AdminSubscriber[]> {
  if (!(await requireAdmin())) return [];

  const supabase = createServiceClient();
  return fetchAllRows<AdminSubscriber>(
    (from, to) =>
      supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to),
    "subscribers",
  );
}

// ─── Customers ────────────────────────────────────────────────────────────────

export type AdminCustomer = {
  id: string;
  full_name: string | null;
  phone: string | null;
  is_admin: boolean;
  created_at: string;
  email: string | null;
};

export async function getAllCustomers(): Promise<AdminCustomer[]> {
  if (!(await requireAdmin())) return [];

  const supabase = createServiceClient();

  const profiles = await fetchAllRows<{
    id: string;
    full_name: string | null;
    phone: string | null;
    is_admin: boolean;
    created_at: string;
  }>(
    (from, to) =>
      supabase
        .from("profiles")
        .select("id, full_name, phone, is_admin, created_at")
        .order("created_at", { ascending: false })
        .range(from, to),
    "customers",
  );

  const emailMap = await fetchUserEmailMap(supabase);

  return profiles.map((profile) => ({
    ...profile,
    email: emailMap.get(profile.id) ?? null,
  }));
}

// ─── Coupons ──────────────────────────────────────────────────────────────────

export async function getAllCoupons(): Promise<AdminCoupon[]> {
  if (!(await requireAdmin())) return [];

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) console.error("Error fetching coupons:", error);
  return data ?? [];
}

// ─── Banners ──────────────────────────────────────────────────────────────────

export type AdminBanner = Tables<"banners">;

export async function getAllBanners(): Promise<AdminBanner[]> {
  if (!(await requireAdmin())) return [];

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .order("placement", { ascending: true })
    .order("position", { ascending: true });

  if (error) {
    console.error("Error fetching banners:", error);
    return [];
  }
  return data ?? [];
}

// ─── Sales Chart ──────────────────────────────────────────────────────────────

export type SalesChartDay = {
  date: string;
  revenue: number;
  orders: number;
};

const CHART_DAYS = 30;

export async function getSalesChartData(): Promise<SalesChartDay[]> {
  if (!(await requireAdmin())) return [];

  const supabase = createServiceClient();

  const { data, error } = await supabase.rpc("admin_sales_chart", { p_days: CHART_DAYS });

  if (!error && data) {
    return data.map((row) => ({
      date: row.day,
      revenue: Number(row.revenue),
      orders: Number(row.orders),
    }));
  }

  console.error("Error fetching sales chart data, falling back:", error);
  return salesChartFallback(supabase);
}

// Used only until migration 032 has been applied. Same rule as the SQL — paid orders only — so the
// figures do not jump when the function appears.
async function salesChartFallback(
  supabase: ReturnType<typeof createServiceClient>,
): Promise<SalesChartDay[]> {
  // Buckets by IST day, matching admin_sales_chart after migration 035 — otherwise the figures
  // would shift depending on whether the RPC or this fallback served the request.
  // Reaches back an extra day because an IST day starts 5.5h before the UTC one.
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - CHART_DAYS);
  since.setUTCHours(0, 0, 0, 0);

  const orders = await fetchAllRows<{ created_at: string; total: number }>(
    (from, to) =>
      supabase
        .from("orders")
        .select("created_at, total")
        .eq("payment_status", "paid")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true })
        .range(from, to),
    "sales chart data",
  );

  const map = new Map<string, SalesChartDay>();
  for (let i = CHART_DAYS - 1; i >= 0; i--) {
    const day = new Date();
    day.setUTCDate(day.getUTCDate() - i);
    const key = istDayKey(day);
    map.set(key, { date: key, revenue: 0, orders: 0 });
  }

  orders.forEach((order) => {
    // The IST day the order landed on, not the UTC one its timestamp starts with.
    const entry = map.get(istDayKey(order.created_at));
    if (entry) {
      entry.revenue += Number(order.total);
      entry.orders += 1;
    }
  });

  return Array.from(map.values());
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export type AdminDashboardStats = {
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalProducts: number;
  availableProducts: number;
};

// Counted in SQL rather than by fetching every row and reducing in JS. Two reasons: revenue must
// only count orders that were actually paid for, and count(*) has no response-row ceiling to be
// silently truncated by.
export async function getDashboardStats(): Promise<AdminDashboardStats> {
  if (!(await requireAdmin())) {
    return {
      totalOrders: 0,
      paidOrders: 0,
      pendingOrders: 0,
      totalRevenue: 0,
      totalProducts: 0,
      availableProducts: 0,
    };
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("admin_dashboard_stats");

  const row = data?.[0];
  if (!error && row) {
    return {
      totalOrders: Number(row.total_orders),
      paidOrders: Number(row.paid_orders),
      pendingOrders: Number(row.pending_orders),
      totalRevenue: Number(row.total_revenue),
      totalProducts: Number(row.total_products),
      availableProducts: Number(row.available_products),
    };
  }

  console.error("Error fetching dashboard stats, falling back:", error);
  return dashboardStatsFallback(supabase);
}

// Used only until migration 032 has been applied. Exact counts via head-only count queries, so it
// still never pulls whole tables across the wire.
async function dashboardStatsFallback(
  supabase: ReturnType<typeof createServiceClient>,
): Promise<AdminDashboardStats> {
  const countOf = async (
    build: () => PromiseLike<{ count: number | null; error: { message: string } | null }>,
  ) => {
    const { count, error } = await build();
    if (error) console.error("Error counting dashboard stat:", error);
    return count ?? 0;
  };

  const [totalOrders, paidOrders, pendingOrders, totalProducts, availableProducts] =
    await Promise.all([
      countOf(() => supabase.from("orders").select("id", { count: "exact", head: true })),
      countOf(() =>
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("payment_status", "paid"),
      ),
      countOf(() =>
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ),
      countOf(() => supabase.from("products").select("id", { count: "exact", head: true })),
      countOf(() =>
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("is_available", true),
      ),
    ]);

  // Revenue is the one figure that needs the rows themselves, since summing is not a count.
  const paidTotals = await fetchAllRows<{ total: number }>(
    (from, to) =>
      supabase.from("orders").select("total").eq("payment_status", "paid").range(from, to),
    "paid order totals",
  );

  return {
    totalOrders,
    paidOrders,
    pendingOrders,
    totalRevenue: paidTotals.reduce((sum, order) => sum + Number(order.total), 0),
    totalProducts,
    availableProducts,
  };
}

