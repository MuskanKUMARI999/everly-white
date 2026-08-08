"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, MapPin, Package, UserRound, type LucideIcon } from "lucide-react";
import { CollectionEyebrow as Eyebrow } from "@/components/collection/Eyebrow";
import { formatPrice } from "@/components/sections/productFormat";
import { formatDate as formatIstDate } from "@/lib/format/datetime";
import { useWishlist } from "@/components/wishlist/WishlistContext";
import { AccountEmptyState } from "./AccountEmptyState";
import { statusColorClass, statusLabel } from "./orderStatus";

const quickLinks: { label: string; description: string; href: string; Icon: LucideIcon }[] = [
  {
    label: "Orders",
    description: "Track and review your past purchases.",
    href: "/account/orders",
    Icon: Package,
  },
  {
    label: "Wishlist",
    description: "Revisit the pieces you've saved for later.",
    href: "/account/wishlist",
    Icon: Heart,
  },
  {
    label: "Address",
    description: "Manage where your orders are delivered.",
    href: "/account/address",
    Icon: MapPin,
  },
  {
    label: "Account Details",
    // Email is read-only on that page, so it can't be listed here as something you can update.
    description: "Update your name, phone number, or password.",
    href: "/account/details",
    Icon: UserRound,
  },
];

export interface DashboardOrder {
  id: string;
  orderNumber: string;
  date: string;
  status: string;
  total: number;
  items: { name: string; image: string | null }[];
}

function formatDate(date: string) {
  return formatIstDate(date, { day: "numeric", month: "short", year: "numeric" });
}

export function DashboardContent({
  firstName,
  orders,
  orderCount,
  addressCount,
  wishlistCount: initialWishlistCount,
}: {
  firstName: string;
  orders: DashboardOrder[];
  orderCount: number;
  addressCount: number;
  wishlistCount: number;
}) {
  // The server count renders first; the client store takes over once it has loaded, so saving a
  // piece in another tab is reflected here without the tile flashing 0 in the meantime.
  const { count, loaded } = useWishlist();
  const wishlistCount = loaded ? count : initialWishlistCount;

  const stats: { label: string; value: number; Icon: LucideIcon }[] = [
    { label: "Orders Placed", value: orderCount, Icon: Package },
    { label: "Wishlist Items", value: wishlistCount, Icon: Heart },
    { label: "Saved Addresses", value: addressCount, Icon: MapPin },
  ];

  return (
    <div>
      <Eyebrow>My Account</Eyebrow>
      <h1 className="mt-3 font-heading text-3xl text-neutral-500 sm:text-4xl">
        Welcome Back, {firstName}
      </h1>
      <p className="mt-2 font-body text-neutral-300">
        Here&rsquo;s a quick look at your orders, saved pieces, and account details.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, Icon }) => (
          <div
            key={label}
            className="flex items-center gap-4 border border-neutral-100 bg-pink-100/40 p-6"
          >
            <Icon size={22} strokeWidth={1.4} className="shrink-0 text-brown" />
            <div>
              <p className="font-heading text-2xl text-neutral-500">{value}</p>
              <p className="font-body text-xs uppercase tracking-[0.08em] text-neutral-300">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h2 className="font-heading text-sm uppercase tracking-[0.14em] text-neutral-500">
            Recent Orders
          </h2>
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-1.5 font-heading text-[11px] uppercase tracking-[0.1em] text-neutral-400 transition-colors hover:text-brown"
          >
            View All <ArrowRight size={13} strokeWidth={1.5} />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="mt-6">
            <AccountEmptyState
              compact
              Icon={Package}
              title="No Orders Yet"
              description="Your most recent orders will appear here once you've placed one."
              action={{ label: "Shop Now", href: "/products" }}
            />
          </div>
        ) : (
          <ul className="mt-2 divide-y divide-neutral-100">
            {orders.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {order.items.slice(0, 3).map((item, i) => (
                      <div
                        key={i}
                        className="relative h-12 w-11 shrink-0 overflow-hidden border-2 border-beige-light bg-white"
                      >
                        {item.image && (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="44px"
                            className="object-cover object-left"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="font-body text-[13px] uppercase tracking-[0.04em] text-neutral-500">
                      #{order.orderNumber}
                    </p>
                    <p className="mt-0.5 font-body text-xs text-neutral-300">
                      {formatDate(order.date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span
                    className={`font-heading text-[10.5px] uppercase tracking-[0.1em] ${statusColorClass(order.status)}`}
                  >
                    {statusLabel(order.status)}
                  </span>
                  <span className="font-body text-sm text-neutral-500">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {quickLinks.map(({ label, description, href, Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-start gap-4 border border-neutral-100 p-6 transition-colors duration-200 hover:bg-pink-100/40"
          >
            <Icon size={20} strokeWidth={1.4} className="mt-0.5 shrink-0 text-brown" />
            <div>
              <p className="font-heading text-[12.5px] uppercase tracking-[0.1em] text-neutral-500 group-hover:text-brown">
                {label}
              </p>
              <p className="mt-1.5 font-body text-sm text-neutral-300">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
