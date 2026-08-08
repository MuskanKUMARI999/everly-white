"use client";

import { useActionState, useState, type ReactNode } from "react";
import Image from "next/image";
import { updateOrderStatus } from "@/lib/admin/actions";
import { formatDate, formatDateTime } from "@/lib/format/datetime";
import type { AdminOrder } from "@/lib/data/admin";
import { formatPrice } from "@/components/sections/productFormat";
import { describePaymentMethod } from "@/lib/invoices/paymentMethod";
import { DownloadInvoiceButton } from "@/components/invoices/DownloadInvoiceButton";

interface AdminOrdersProps {
  orders: AdminOrder[];
}

const orderStatusOptions = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

const paymentStatusOptions = ["pending", "paid", "failed", "refunded"];

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function StatusBadge({ value }: { value: string; type: "order" | "payment" }) {
  const colorMap: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-700",
    confirmed: "bg-blue-50 text-blue-700",
    processing: "bg-purple-50 text-purple-700",
    shipped: "bg-indigo-50 text-indigo-700",
    delivered: "bg-green-50 text-green-700",
    cancelled: "bg-neutral-100 text-neutral-500",
    refunded: "bg-terracotta/10 text-terracotta",
    paid: "bg-green-50 text-green-700",
    failed: "bg-terracotta/10 text-terracotta",
  };
  return (
    <span
      className={`inline-block rounded-sm px-2 py-1 font-heading text-[12px] uppercase tracking-widest ${colorMap[value] ?? "bg-pink-100 text-brown"}`}
    >
      {capitalize(value)}
    </span>
  );
}

type Address = Record<string, string> | null;

/** Section heading inside the expanded order panel. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  // The panel wrapper already draws a rule above the first section — `first:` stops it doubling up.
  return (
    <div className="mt-5 border-t border-neutral-100 pt-5 first:mt-0 first:border-t-0">
      <h4 className="font-heading text-[13px] uppercase tracking-widest text-brown">{title}</h4>
      {children}
    </div>
  );
}

/** A labelled read-only value. Falls back to an em dash so an empty field still reads as "checked". */
function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="font-heading text-[12px] uppercase tracking-widest text-neutral-400">{label}</p>
      <p className="mt-0.5 break-words font-body font-medium text-lg text-neutral-500">
        {value === null || value === undefined || value === "" ? "—" : value}
      </p>
    </div>
  );
}

function AddressBlock({ address }: { address: Address }) {
  if (!address) {
    return <p className="mt-3 font-body font-medium text-lg text-neutral-400">No address on file.</p>;
  }
  const street = [address.line1, address.line2].filter(Boolean).join(", ");
  const region = [address.city, address.state].filter(Boolean).join(", ");
  return (
    <div className="mt-3 font-body font-medium text-lg text-neutral-500">
      {address.full_name && <p className="font-semibold">{address.full_name}</p>}
      {address.phone && <p>{address.phone}</p>}
      {street && <p>{street}</p>}
      {(region || address.pin_code) && (
        <p>
          {region}
          {address.pin_code ? ` — ${address.pin_code}` : ""}
        </p>
      )}
      {address.country && <p>{address.country}</p>}
    </div>
  );
}

function OrderRow({ order }: { order: AdminOrder }) {
  const [state, action, isPending] = useActionState(updateOrderStatus, null);
  const [expanded, setExpanded] = useState(false);
  const shipping = order.shipping_address as Address;
  const billing = order.billing_address as Address;
  // Checkout writes the same object to both, so repeating it in full would just be noise —
  // it only earns its own block when the customer actually billed somewhere else.
  const billingDiffers =
    billing !== null && JSON.stringify(billing) !== JSON.stringify(shipping);

  return (
    <div className="border border-neutral-100 bg-white transition-colors hover:border-brown/30">
      {/* Summary row */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="cursor-pointer flex w-full flex-wrap items-center justify-between gap-4 p-6 text-left"
      >
        {/* min-w-0 + break-words: a customer email is easily wider than a phone screen. */}
        <div className="min-w-0 break-words">
          <p className="font-heading text-[13px] uppercase tracking-widest text-neutral-500">
            Order #{order.order_number}
          </p>
          <p className="mt-1 font-body font-medium text-lg text-neutral-500">
            {formatDate(order.created_at)}
          </p>
          {shipping?.full_name && (
            <p className="mt-1 font-body text-lg font-semibold text-neutral-500">
              {shipping.full_name}
            </p>
          )}
          <p className="mt-1 font-body font-medium text-lg text-neutral-500">
            {order.customer_email ?? "No email on file"}
            {!order.guest_email && order.user_id && (
              <span className="ml-2 rounded-sm bg-pink-100 px-2 py-0.5 font-heading text-[12px] uppercase tracking-widest text-brown">
                Account
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-heading text-2xl font-light text-neutral-500">
              {formatPrice(order.total)}
            </p>
            <div className="mt-2 flex gap-2">
              <StatusBadge value={order.status} type="order" />
              <StatusBadge value={order.payment_status} type="payment" />
            </div>
          </div>
          <span className="font-body font-medium text-lg text-neutral-500">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-neutral-100 px-6 pb-6">
          <Section title="Customer Info">
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Name" value={shipping?.full_name} />
              <Field
                label="Email"
                value={
                  order.customer_email ? (
                    <a href={`mailto:${order.customer_email}`} className="hover:text-brown">
                      {order.customer_email}
                    </a>
                  ) : null
                }
              />
              <Field
                label="Phone"
                value={
                  shipping?.phone ? (
                    <a href={`tel:${shipping.phone}`} className="hover:text-brown">
                      {shipping.phone}
                    </a>
                  ) : null
                }
              />
              <Field label="Customer Type" value={order.user_id ? "Account" : "Guest"} />
            </div>
          </Section>

          <Section title="Shipping Address">
            <AddressBlock address={shipping} />
          </Section>

          {billingDiffers && (
            <Section title="Billing Address">
              <AddressBlock address={billing} />
            </Section>
          )}

          <Section title="Order Details">
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Order ID" value={order.order_number} />
              <Field label="Date" value={formatDateTime(order.created_at)} />
              <Field label="Order Status" value={capitalize(order.status)} />
              <Field label="Payment Status" value={capitalize(order.payment_status)} />
              {/* The stored payment_method only ever says "razorpay" — the gateway, not how the
                  customer actually paid. payment_details carries the instrument, and falls back
                  gracefully for orders placed before it was captured. */}
              <Field label="Payment Method" value={describePaymentMethod(order.payment_details)} />
              <Field label="Payment ID" value={order.payment_id} />
              <Field label="Coupon Code" value={order.coupon_code} />
              <Field label="Courier" value={order.courier} />
              <Field label="Tracking No." value={order.tracking_number} />
              <Field label="Refund ID" value={order.refund_id} />
              {order.cancelled_at && (
                <Field label="Cancelled On" value={formatDateTime(order.cancelled_at)} />
              )}
              <Field label="Last Updated" value={formatDateTime(order.updated_at)} />
            </div>
            {order.notes && (
              <div className="mt-4">
                <Field label="Notes" value={order.notes} />
              </div>
            )}
          </Section>

          <Section title="Tax Invoice">
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <DownloadInvoiceButton
                orderNumber={order.order_number}
                paymentStatus={order.payment_status}
              />
              {(order.payment_status === "paid" || order.payment_status === "refunded") && (
                <p className="font-body text-sm text-neutral-400">
                  GST invoice, numbered in its own yearly series. The number is assigned once and
                  never changes.
                </p>
              )}
            </div>
          </Section>

          <Section title="Ordered Items">
            {/* Wide table: scrolls inside its own box rather than stretching the admin page. */}
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-neutral-100">
                    {["Image", "Product", "Qty", "Price", "Subtotal"].map((heading, i) => (
                      <th
                        key={heading}
                        className={`pb-2 font-heading text-[12px] uppercase tracking-widest text-neutral-400 ${
                          i > 1 ? "text-right" : ""
                        }`}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="font-body font-medium text-lg text-neutral-500">
                  {order.order_items.map((item) => (
                    <tr key={item.id} className="border-b border-neutral-100 last:border-b-0">
                      <td className="py-3 pr-4">
                        <div className="relative h-16 w-16 overflow-hidden border border-neutral-100 bg-pink-100/40">
                          <Image
                            src={item.product_image || "/images/logo.png"}
                            alt={item.product_name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                      </td>
                      <td className="py-3 pr-4">{item.product_name}</td>
                      <td className="py-3 pr-4 text-right">{item.quantity}</td>
                      <td className="py-3 pr-4 text-right">{formatPrice(item.price)}</td>
                      <td className="py-3 text-right">{formatPrice(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="mt-4 ml-auto flex w-full max-w-xs flex-col gap-1 font-body font-medium text-lg text-neutral-500">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatPrice(order.subtotal)}</dd>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-terracotta">
                  <dt>Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}</dt>
                  <dd>−{formatPrice(order.discount_amount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt>Shipping</dt>
                <dd>{order.shipping_amount > 0 ? formatPrice(order.shipping_amount) : "Free"}</dd>
              </div>
              <div className="mt-1 flex justify-between border-t border-neutral-100 pt-2 font-semibold">
                <dt>Total</dt>
                <dd>{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </Section>

          <form
            action={action}
            // Moving an order to cancelled/refunded now returns stock and releases the coupon
            // use, so it needs the same confirmation as the other destructive admin actions.
            onSubmit={(e) => {
              const next = new FormData(e.currentTarget).get("status");
              const entering =
                (next === "cancelled" || next === "refunded") && !order.cancelled_at;
              if (
                entering &&
                !confirm(
                  `Mark order #${order.order_number} as ${next}?\n\nThis returns the items to stock and releases any coupon use. The payment itself is not refunded here — issue that in Razorpay.`,
                )
              ) {
                e.preventDefault();
              }
            }}
            className="mt-5 flex flex-wrap items-end gap-3 border-t border-neutral-100 pt-5"
          >
            {/* w-full so the heading claims its own row of the wrapping flex line. */}
            <h4 className="w-full font-heading text-[13px] uppercase tracking-widest text-brown">
              Update Order
            </h4>
            <input type="hidden" name="orderId" value={order.id} />
            <div className="flex flex-col gap-1">
              <label className="font-heading text-[13px] uppercase tracking-widest text-neutral-500">
                Order Status
              </label>
              <select
                name="status"
                defaultValue={order.status}
                className="border border-neutral-200 bg-white px-3 py-2 font-body font-medium text-lg text-neutral-500 outline-none transition-colors focus:border-neutral-500"
              >
                <option value="">No change</option>
                {orderStatusOptions.map((s) => (
                  <option key={s} value={s}>
                    {capitalize(s)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-heading text-[13px] uppercase tracking-widest text-neutral-500">
                Payment Status
              </label>
              <select
                name="paymentStatus"
                defaultValue={order.payment_status}
                className="border border-neutral-200 bg-white px-3 py-2 font-body font-medium text-lg text-neutral-500 outline-none transition-colors focus:border-neutral-500"
              >
                <option value="">No change</option>
                {paymentStatusOptions.map((s) => (
                  <option key={s} value={s}>
                    {capitalize(s)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-heading text-[13px] uppercase tracking-widest text-neutral-500">
                Courier
              </label>
              <input
                type="text"
                name="courier"
                defaultValue={order.courier ?? ""}
                placeholder="e.g. Blue Dart"
                className="border border-neutral-200 bg-white px-3 py-2 font-body font-medium text-lg text-neutral-500 outline-none transition-colors focus:border-neutral-500 sm:w-44"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-heading text-[13px] uppercase tracking-widest text-neutral-500">
                Tracking No.
              </label>
              <input
                type="text"
                name="trackingNumber"
                defaultValue={order.tracking_number ?? ""}
                placeholder="e.g. 1234567890"
                className="border border-neutral-200 bg-white px-3 py-2 font-body font-medium text-lg text-neutral-500 outline-none transition-colors focus:border-neutral-500 sm:w-48"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-heading text-[13px] uppercase tracking-widest text-neutral-500">
                Refund ID
              </label>
              <input
                type="text"
                name="refundId"
                defaultValue={order.refund_id ?? ""}
                placeholder="from Razorpay"
                className="border border-neutral-200 bg-white px-3 py-2 font-body font-medium text-lg text-neutral-500 outline-none transition-colors focus:border-neutral-500 sm:w-44"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="cursor-pointer disabled:cursor-not-allowed bg-brown px-4 py-2 font-heading text-[13px] uppercase tracking-widest text-beige-light transition-colors hover:bg-neutral-500 disabled:bg-neutral-300"
            >
              {isPending ? "Saving…" : "Update"}
            </button>
            {state && (
              <p
                className={`font-body font-medium text-lg ${state.success ? "text-green-600" : "text-terracotta"}`}
              >
                {state.message}
              </p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}

export function AdminOrders({ orders }: AdminOrdersProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const filtered = orders.filter((o) => {
    // Searching on guest_email alone meant an account customer's order could not be found by their
    // email at all, since the orders table never stored it.
    const term = search.toLowerCase();
    const matchesSearch =
      o.order_number.toLowerCase().includes(term) ||
      (o.customer_email ?? "").toLowerCase().includes(term);
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    const matchesPayment = paymentFilter === "all" || o.payment_status === paymentFilter;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-heading text-2xl font-light text-neutral-500">
          Orders
          <span className="ml-2 font-body text-lg font-normal text-neutral-500">
            ({filtered.length})
          </span>
        </h2>
        <a
          href="/api/admin/export/orders"
          className="border border-neutral-200 px-4 py-2 font-heading text-[13px] uppercase tracking-widest text-neutral-500 transition-colors hover:border-brown hover:text-brown"
        >
          Export CSV
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search order # or email…"
          className="border border-neutral-200 bg-white px-3 py-2 font-body font-medium text-lg text-neutral-500 outline-none transition-colors focus:border-neutral-500 sm:w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-neutral-200 bg-white px-3 py-2 font-body font-medium text-lg text-neutral-500 outline-none transition-colors focus:border-neutral-500"
        >
          <option value="all">All Statuses</option>
          {orderStatusOptions.map((s) => (
            <option key={s} value={s}>{capitalize(s)}</option>
          ))}
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
          className="border border-neutral-200 bg-white px-3 py-2 font-body font-medium text-lg text-neutral-500 outline-none transition-colors focus:border-neutral-500"
        >
          <option value="all">All Payments</option>
          {paymentStatusOptions.map((s) => (
            <option key={s} value={s}>{capitalize(s)}</option>
          ))}
        </select>
      </div>

      {paginated.length === 0 ? (
        <p className="font-body font-medium text-neutral-500">No orders found.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {paginated.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </div>
      )}

      {/* flex-wrap: a busy shop has enough pages to overrun a phone (and a tablet) in one row. */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="cursor-pointer disabled:cursor-not-allowed border border-neutral-200 px-3 py-1.5 font-heading text-[13px] uppercase tracking-widest text-neutral-500 transition-colors hover:border-brown hover:text-brown disabled:opacity-40"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`cursor-pointer border px-3 py-1.5 font-heading text-[13px] uppercase tracking-widest transition-colors ${
                p === page
                  ? "border-brown bg-brown text-beige-light"
                  : "border-neutral-200 text-neutral-500 hover:border-brown hover:text-brown"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="cursor-pointer disabled:cursor-not-allowed border border-neutral-200 px-3 py-1.5 font-heading text-[13px] uppercase tracking-widest text-neutral-500 transition-colors hover:border-brown hover:text-brown disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
