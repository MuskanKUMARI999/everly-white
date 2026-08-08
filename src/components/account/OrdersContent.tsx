"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Package } from "lucide-react";
import { CollectionEyebrow as Eyebrow } from "@/components/collection/Eyebrow";
import { formatPrice } from "@/components/sections/productFormat";
import { CancelOrderControl } from "@/components/orders/CancelOrderControl";
import { DownloadInvoiceButton } from "@/components/invoices/DownloadInvoiceButton";
import { AccountEmptyState } from "./AccountEmptyState";
import { statusColorClass, statusLabel } from "./orderStatus";
import { formatDate as formatIstDate } from "@/lib/format/datetime";
import type { OrderWithItems } from "@/lib/data/orders";

function formatDate(date: string) {
  return formatIstDate(date, { day: "numeric", month: "long", year: "numeric" });
}

// Orders store the delivery address as a JSON snapshot taken at checkout, so it reflects where the
// order actually went even if the customer has since edited or deleted that saved address.
function formatShippingAddress(address: unknown) {
  if (!address || typeof address !== "object") return null;
  const a = address as Record<string, unknown>;
  const parts = [
    a.fullName ?? a.full_name,
    a.line1 ?? a.address1,
    a.line2 ?? a.address2,
    a.city,
    a.state,
    a.pinCode ?? a.pin_code ?? a.pin,
  ]
    .filter((part): part is string => typeof part === "string" && part.trim() !== "")
    .map((part) => part.trim());

  return parts.length > 0 ? parts.join(", ") : null;
}

export function OrdersContent({ orders }: { orders: OrderWithItems[] }) {
  const [openId, setOpenId] = useState<string | null>(orders[0]?.id ?? null);

  return (
    <div>
      <Eyebrow>My Account</Eyebrow>
      <h1 className="mt-3 font-heading text-3xl text-neutral-500 sm:text-4xl">Orders</h1>
      <p className="mt-2 font-body text-neutral-300">
        Track, review, and revisit the pieces you&rsquo;ve purchased.
      </p>

      {orders.length === 0 ? (
        <div className="mt-10">
          <AccountEmptyState
            Icon={Package}
            title="No Orders Yet"
            description="Once you place an order it lives here — every piece you bought, where it's going, and how far along it is."
            action={{ label: "Shop Now", href: "/products" }}
            footnote={
              <>
                Ordered without an account?{" "}
                <Link
                  href="/track-order"
                  className="text-brown underline decoration-brown/30 underline-offset-4 transition-colors hover:text-neutral-500"
                >
                  Track it with your order number
                </Link>
                .
              </>
            }
          />
        </div>
      ) : (
        <ul className="mt-10 flex flex-col divide-y divide-neutral-100 border-y border-neutral-100">
          {orders.map((order) => {
            const isOpen = openId === order.id;
            const address = formatShippingAddress(order.shipping_address);
            return (
              <li key={order.id} className="py-6">
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : order.id)}
                  aria-expanded={isOpen}
                  className="cursor-pointer flex w-full flex-wrap items-center justify-between gap-4 text-left"
                >
                  <div>
                    <p className="font-body text-[13px] uppercase tracking-[0.04em] text-neutral-500">
                      Order #{order.order_number}
                    </p>
                    <p className="mt-1 font-body text-xs text-neutral-300">
                      Placed on {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <span
                      className={`font-heading text-[10.5px] uppercase tracking-[0.1em] ${statusColorClass(order.status)}`}
                    >
                      {statusLabel(order.status)}
                    </span>
                    <span className="font-body text-sm text-neutral-500">
                      {formatPrice(Number(order.total))}
                    </span>
                    <ChevronDown
                      size={16}
                      strokeWidth={1.5}
                      className={`text-neutral-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-6 flex flex-col gap-6 border-t border-neutral-100 pt-6">
                    <ul className="flex flex-col gap-4">
                      {order.order_items.map((item) => {
                        // Link through the product's live slug, never through the frozen
                        // product_name — renaming a piece in admin would otherwise turn every past
                        // order into a 404. No product row (deleted, or an order placed before
                        // product_id was recorded) means there's nothing to link to, so the item
                        // degrades to plain text rather than a dead link.
                        const href = item.product ? `/products/${item.product.slug}` : null;
                        const thumbnailClasses =
                          "relative h-16 w-14 shrink-0 overflow-hidden bg-pink-100";
                        const thumbnail = item.product_image && (
                          <Image
                            src={item.product_image}
                            alt={item.product_name}
                            fill
                            sizes="56px"
                            className="object-cover object-left"
                          />
                        );

                        return (
                          <li key={item.id} className="flex items-center gap-4">
                            {href ? (
                              <Link href={href} className={thumbnailClasses}>
                                {thumbnail}
                              </Link>
                            ) : (
                              <div className={thumbnailClasses}>{thumbnail}</div>
                            )}
                            <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                              <div>
                                {href ? (
                                  <Link
                                    href={href}
                                    className="font-body text-[13px] uppercase tracking-[0.04em] text-neutral-500 hover:text-brown"
                                  >
                                    {item.product_name}
                                  </Link>
                                ) : (
                                  <span className="font-body text-[13px] uppercase tracking-[0.04em] text-neutral-500">
                                    {item.product_name}
                                  </span>
                                )}
                                <p className="mt-1 font-body text-xs text-neutral-300">
                                  Qty {item.quantity}
                                </p>
                              </div>
                              <span className="font-body text-sm text-neutral-400">
                                {formatPrice(Number(item.total))}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>

                    {address && (
                      <div className="flex flex-col gap-1 border-t border-neutral-100 pt-4 font-body text-sm text-neutral-400">
                        <p className="font-heading text-[10.5px] uppercase tracking-[0.1em] text-neutral-300">
                          Delivery Address
                        </p>
                        <p>{address}</p>
                      </div>
                    )}

                    {order.tracking_number && (
                      <div className="flex flex-col gap-1 border-t border-neutral-100 pt-4 font-body text-sm text-neutral-400">
                        <p className="font-heading text-[10.5px] uppercase tracking-[0.1em] text-neutral-300">
                          Tracking
                        </p>
                        <p>
                          {order.courier ? `${order.courier} · ` : ""}
                          {order.tracking_number}
                        </p>
                      </div>
                    )}

                    {/* Only rendered once the payment has landed — the component itself explains
                        the wait rather than showing a button that cannot work yet. */}
                    <div className="border-t border-neutral-100 pt-4">
                      <p className="font-heading text-[10.5px] uppercase tracking-[0.1em] text-neutral-300">
                        Tax Invoice
                      </p>
                      <div className="mt-2">
                        <DownloadInvoiceButton
                          orderNumber={order.order_number}
                          paymentStatus={order.payment_status}
                        />
                      </div>
                    </div>

                    <CancelOrderControl order={order} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
