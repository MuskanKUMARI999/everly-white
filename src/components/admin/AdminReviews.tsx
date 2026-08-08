"use client";

import { useActionState } from "react";
import { approveReview, deleteReview, approveAllReviews } from "@/lib/admin/actions";
import { formatDate } from "@/lib/format/datetime";
import type { AdminReview } from "@/lib/data/admin";

interface AdminReviewsProps {
  reviews: AdminReview[];
}

function ApproveAllButton({ count }: { count: number }) {
  const [state, action, isPending] = useActionState(approveAllReviews, null);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Approve all ${count} pending review(s)?`)) e.preventDefault();
      }}
      className="inline-flex items-center gap-3"
    >
      <button
        type="submit"
        disabled={isPending}
        className="cursor-pointer disabled:cursor-not-allowed bg-brown px-4 py-2 font-heading text-sm uppercase tracking-widest text-beige-light transition-colors hover:bg-neutral-500 disabled:bg-neutral-300"
      >
        {isPending ? "Approving…" : "Approve All"}
      </button>
      {state && (
        <span className={`font-body text-base ${state.success ? "text-green-600" : "text-terracotta"}`}>
          {state.message}
        </span>
      )}
    </form>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="font-body font-medium text-lg text-brown">
      {"★".repeat(rating)}
      <span className="text-neutral-200">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

function ReviewRow({ review }: { review: AdminReview }) {
  const [approveState, approveAction, approvePending] = useActionState(approveReview, null);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteReview, null);

  return (
    <div
      className={`border bg-white p-6 transition-colors ${
        review.is_approved
          ? "border-neutral-100 hover:border-brown/30"
          : "border-yellow-200 bg-yellow-50/30"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          {/* Name, stars and the two badges wrap rather than run off a phone. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="font-body text-lg font-semibold text-neutral-500">
              {review.reviewer_name}
            </p>
            <StarRating rating={review.rating} />
            {!review.is_approved && (
              <span className="rounded-sm bg-yellow-100 px-2 py-0.5 font-heading text-[12px] uppercase tracking-widest text-yellow-700">
                Pending
              </span>
            )}
            {review.is_verified_purchase && (
              <span className="rounded-sm bg-green-50 px-2 py-0.5 font-heading text-[12px] uppercase tracking-widest text-green-600">
                Verified
              </span>
            )}
          </div>
          {review.title && (
            <p className="font-body text-lg font-medium text-neutral-500">{review.title}</p>
          )}
          <p className="font-body font-medium text-lg text-neutral-500">{review.body}</p>
          {review.product && (
            <p className="font-body font-medium text-lg text-neutral-500">
              Product: {review.product.name}
            </p>
          )}
        </div>
        <p className="font-body font-medium text-lg text-neutral-500">
          {formatDate(review.created_at)}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-neutral-100 pt-4">
        {!review.is_approved && (
          <form action={approveAction}>
            <input type="hidden" name="reviewId" value={review.id} />
            <button
              type="submit"
              disabled={approvePending}
              className="cursor-pointer disabled:cursor-not-allowed bg-brown px-3 py-1.5 font-heading text-[13px] uppercase tracking-widest text-beige-light transition-colors hover:bg-neutral-500 disabled:bg-neutral-300"
            >
              {approvePending ? "Approving…" : "Approve"}
            </button>
            {approveState && (
              <span className={`ml-2 font-body font-medium text-lg ${approveState.success ? "text-green-600" : "text-terracotta"}`}>
                {approveState.message}
              </span>
            )}
          </form>
        )}
        <form
          action={deleteAction}
          onSubmit={(e) => {
            if (!confirm(`Delete this review by ${review.reviewer_name}? This cannot be undone.`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="reviewId" value={review.id} />
          <button
            type="submit"
            disabled={deletePending}
            className="cursor-pointer disabled:cursor-not-allowed font-body font-medium text-lg text-terracotta underline decoration-terracotta/30 underline-offset-4 transition-colors hover:text-terracotta/80"
          >
            {deletePending ? "Deleting…" : "Delete"}
          </button>
          {deleteState && (
            <span className={`ml-2 font-body font-medium text-lg ${deleteState.success ? "text-green-600" : "text-terracotta"}`}>
              {deleteState.message}
            </span>
          )}
        </form>
      </div>
    </div>
  );
}

export function AdminReviews({ reviews }: AdminReviewsProps) {
  const pending = reviews.filter((r) => !r.is_approved);
  const approved = reviews.filter((r) => r.is_approved);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-heading text-2xl font-light text-neutral-500">
          Reviews
          <span className="ml-2 font-body text-lg font-normal text-neutral-500">
            ({reviews.length} total · {pending.length} pending)
          </span>
        </h2>
      </div>

      {pending.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-heading text-lg font-light uppercase tracking-widest text-neutral-500">
              Awaiting Approval
            </h3>
            <ApproveAllButton count={pending.length} />
          </div>
          {pending.map((r) => <ReviewRow key={r.id} review={r} />)}
        </div>
      )}

      {approved.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-heading text-lg font-light uppercase tracking-widest text-neutral-500">
            Approved
          </h3>
          {approved.map((r) => <ReviewRow key={r.id} review={r} />)}
        </div>
      )}

      {reviews.length === 0 && (
        <p className="font-body font-medium text-neutral-500">No reviews yet.</p>
      )}
    </div>
  );
}
