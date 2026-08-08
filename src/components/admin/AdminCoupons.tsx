"use client";

import { useActionState } from "react";
import { createCoupon, updateCoupon, deleteCoupon } from "@/lib/admin/actions";
import { formatDate } from "@/lib/format/datetime";
import type { AdminCoupon } from "@/lib/data/admin";

interface AdminCouponsProps {
  coupons: AdminCoupon[];
}

const inputClasses =
  "border border-neutral-200 bg-white px-3 py-2 font-body font-medium text-lg text-neutral-500 outline-none transition-colors focus:border-neutral-500";
const labelClasses =
  "font-heading text-[13px] uppercase tracking-widest text-neutral-500";

function CreateCouponForm() {
  const [state, action, isPending] = useActionState(createCoupon, null);

  return (
    <form action={action} className="border border-neutral-100 bg-white p-6">
      <h3 className="font-heading text-lg font-light uppercase tracking-widest text-neutral-500">
        Create New Coupon
      </h3>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Code (e.g. WELCOME10)</label>
          <input name="code" type="text" required className={`${inputClasses} uppercase`} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Discount Type</label>
          <select name="discountType" className={inputClasses}>
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed Amount (₹)</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Discount Value</label>
          <input name="discountValue" type="number" step="0.01" min="0" required className={inputClasses} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Min Order Amount (Optional)</label>
          <input name="minOrderAmount" type="number" step="0.01" min="0" className={inputClasses} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Max Uses (Optional)</label>
          <input name="maxUses" type="number" min="1" className={inputClasses} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Expiry Date (Optional)</label>
          <input name="expiresAt" type="datetime-local" className={inputClasses} />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 font-body font-medium text-lg text-neutral-500">
          <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4 accent-brown" />
          Active immediately
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="cursor-pointer disabled:cursor-not-allowed bg-brown px-4 py-2 font-heading text-[13px] uppercase tracking-widest text-beige-light transition-colors hover:bg-neutral-500 disabled:bg-neutral-300"
        >
          {isPending ? "Creating…" : "Create Coupon"}
        </button>
        {state && (
          <p className={`font-body font-medium text-lg ${state.success ? "text-green-600" : "text-terracotta"}`}>
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}

function CouponRow({ coupon }: { coupon: AdminCoupon }) {
  const [updateState, updateAction, updatePending] = useActionState(updateCoupon, null);
  const [, deleteAction, deletePending] = useActionState(deleteCoupon, null);

  const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
  const isUsedUp = coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses;

  return (
    <div className={`border bg-white p-6 transition-colors ${!coupon.is_active || isExpired || isUsedUp ? "border-neutral-100 opacity-60" : "border-neutral-100 hover:border-brown/30"}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          {/* A long code plus its status badge is wider than a phone on one line. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h4 className="font-heading text-xl font-bold break-all text-neutral-600 uppercase tracking-widest">
              {coupon.code}
            </h4>
            {coupon.is_active && !isExpired && !isUsedUp ? (
              <span className="rounded-sm bg-green-50 px-2 py-0.5 font-heading text-[12px] uppercase tracking-widest text-green-600">Active</span>
            ) : (
              <span className="rounded-sm bg-neutral-100 px-2 py-0.5 font-heading text-[12px] uppercase tracking-widest text-neutral-500">Inactive</span>
            )}
          </div>
          <p className="mt-1 font-body font-medium text-lg text-neutral-500">
            {coupon.discount_type === "percentage" ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`}
            {coupon.min_order_amount && ` on orders over ₹${coupon.min_order_amount}`}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-body font-medium text-lg text-neutral-500">
            <span>Uses: {coupon.uses_count} {coupon.max_uses ? `/ ${coupon.max_uses}` : "(Unlimited)"}</span>
            {coupon.expires_at && (
              <span>Expires: {formatDate(coupon.expires_at)}</span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <form action={updateAction} className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="couponId" value={coupon.id} />
            {!coupon.is_active && (
              <input type="hidden" name="isActive" value="on" />
            )}
            <button
              type="submit"
              disabled={updatePending}
              className={`cursor-pointer disabled:cursor-not-allowed rounded-sm px-3 py-1.5 font-heading text-[13px] uppercase tracking-widest transition-colors ${
                coupon.is_active
                  ? "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }`}
            >
              {updatePending ? "…" : coupon.is_active ? "Deactivate" : "Activate"}
            </button>
            {updateState && (
              <p className={`font-body font-medium text-lg ${updateState.success ? "text-green-600" : "text-terracotta"}`}>
                {updateState.message}
              </p>
            )}
          </form>

          <form
            action={deleteAction}
            onSubmit={(e) => {
              if (!confirm(`Delete coupon "${coupon.code}"? This cannot be undone.`)) e.preventDefault();
            }}
          >
            <input type="hidden" name="couponId" value={coupon.id} />
            <button
              type="submit"
              disabled={deletePending}
              className="cursor-pointer disabled:cursor-not-allowed font-body font-medium text-lg text-terracotta underline decoration-terracotta/30 underline-offset-4 transition-colors hover:text-terracotta/80"
            >
              {deletePending ? "Deleting…" : "Delete"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function AdminCoupons({ coupons }: AdminCouponsProps) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-heading text-2xl font-light text-neutral-500">
        Discount Coupons
        <span className="ml-2 font-body text-lg font-normal text-neutral-500">
          ({coupons.length})
        </span>
      </h2>
      <CreateCouponForm />
      
      {coupons.length === 0 ? (
        <p className="font-body font-medium text-neutral-500">No coupons created yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {coupons.map((c) => (
            <CouponRow key={c.id} coupon={c} />
          ))}
        </div>
      )}
    </div>
  );
}
