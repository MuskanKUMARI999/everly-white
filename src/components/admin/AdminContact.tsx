"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import {
  resolveContactSubmission,
  resolveAllContactSubmissions,
  deleteContactSubmission,
} from "@/lib/admin/actions";
import { formatDateTime } from "@/lib/format/datetime";
import type { AdminContact } from "@/lib/data/admin";

interface AdminContactProps {
  submissions: AdminContact[];
}

function ResolveAllButton({ count }: { count: number }) {
  const [state, action, isPending] = useActionState(resolveAllContactSubmissions, null);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Mark all ${count} new message(s) as resolved?`)) e.preventDefault();
      }}
      className="inline-flex items-center gap-3"
    >
      <button
        type="submit"
        disabled={isPending}
        className="cursor-pointer disabled:cursor-not-allowed bg-brown px-4 py-2 font-heading text-sm uppercase tracking-widest text-beige-light transition-colors hover:bg-neutral-500 disabled:bg-neutral-300"
      >
        {isPending ? "Updating…" : "Mark All Resolved"}
      </button>
      {state && (
        <span className={`font-body text-base ${state.success ? "text-green-600" : "text-terracotta"}`}>
          {state.message}
        </span>
      )}
    </form>
  );
}

function ContactRow({ submission }: { submission: AdminContact }) {
  const [state, action, isPending] = useActionState(resolveContactSubmission, null);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteContactSubmission, null);

  return (
    <div
      className={`border bg-white p-6 transition-colors ${
        submission.is_resolved
          ? "border-neutral-100"
          : "border-pink-300 bg-pink-100/30"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          {/* Name, address and badge wrap rather than run off a phone — a real customer email is
              easily wider than the screen on its own, so it also has to be breakable. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="font-body text-lg font-semibold text-neutral-500">
              {submission.name}
            </p>
            <a
              href={`mailto:${submission.email}`}
              className="font-body font-medium text-lg break-all text-neutral-500 hover:text-brown"
            >
              {submission.email}
            </a>
            {submission.is_resolved && (
              <span className="rounded-sm bg-neutral-100 px-2 py-0.5 font-heading text-[12px] uppercase tracking-widest text-neutral-500">
                Resolved
              </span>
            )}
            {!submission.is_resolved && (
              <span className="rounded-sm bg-pink-200 px-2 py-0.5 font-heading text-[12px] uppercase tracking-widest text-brown">
                New
              </span>
            )}
          </div>
          {submission.subject && (
            <p className="font-body text-lg font-medium text-neutral-500">
              Subject: {submission.subject}
            </p>
          )}
          <p className="mt-2 font-body font-medium text-lg text-neutral-500 whitespace-pre-wrap">
            {submission.message}
          </p>
        </div>
        <p className="font-body font-medium text-lg text-neutral-500 whitespace-nowrap">
          {formatDateTime(submission.created_at)}
        </p>
      </div>

      {/* The bar itself is always drawn now — a resolved message can still need deleting, so it
          can no longer be hidden along with "Mark Resolved". */}
      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-neutral-100 pt-4">
        {!submission.is_resolved && (
          <form action={action}>
            <input type="hidden" name="submissionId" value={submission.id} />
            <button
              type="submit"
              disabled={isPending}
              className="cursor-pointer disabled:cursor-not-allowed bg-brown px-3 py-1.5 font-heading text-[13px] uppercase tracking-widest text-beige-light transition-colors hover:bg-neutral-500 disabled:bg-neutral-300"
            >
              {isPending ? "Updating…" : "Mark Resolved"}
            </button>
            {state && (
              <span
                className={`ml-2 font-body font-medium text-lg ${state.success ? "text-green-600" : "text-terracotta"}`}
              >
                {state.message}
              </span>
            )}
          </form>
        )}

        <form
          action={deleteAction}
          onSubmit={(e) => {
            if (
              !confirm(
                `Delete this message from ${submission.name}? This cannot be undone.`,
              )
            ) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="submissionId" value={submission.id} />
          <button
            type="submit"
            disabled={deletePending}
            className="cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-1 font-heading text-[13px] uppercase tracking-widest text-terracotta underline decoration-terracotta/30 underline-offset-4 transition-colors hover:text-terracotta/80"
          >
            <Trash2 size={12} strokeWidth={1.6} />
            {deletePending ? "Deleting…" : "Delete"}
          </button>
          {deleteState && (
            <span
              className={`ml-2 font-body font-medium text-lg ${deleteState.success ? "text-green-600" : "text-terracotta"}`}
            >
              {deleteState.message}
            </span>
          )}
        </form>
      </div>
    </div>
  );
}

export function AdminContactList({ submissions }: AdminContactProps) {
  const newSubmissions = submissions.filter((s) => !s.is_resolved);
  const resolvedSubmissions = submissions.filter((s) => s.is_resolved);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-heading text-2xl font-light text-neutral-500">
          Contact Inbox
          <span className="ml-2 font-body text-lg font-normal text-neutral-500">
            ({submissions.length} total · {newSubmissions.length} new)
          </span>
        </h2>
      </div>

      {newSubmissions.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-heading text-lg font-light uppercase tracking-widest text-neutral-500">
              New Messages
            </h3>
            <ResolveAllButton count={newSubmissions.length} />
          </div>
          {newSubmissions.map((s) => (
            <ContactRow key={s.id} submission={s} />
          ))}
        </div>
      )}

      {resolvedSubmissions.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-heading text-lg font-light uppercase tracking-widest text-neutral-500">
            Resolved
          </h3>
          {resolvedSubmissions.map((s) => (
            <ContactRow key={s.id} submission={s} />
          ))}
        </div>
      )}

      {submissions.length === 0 && (
        <p className="font-body font-medium text-neutral-500">No contact submissions yet.</p>
      )}
    </div>
  );
}
