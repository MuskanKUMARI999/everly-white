"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteSubscriber } from "@/lib/admin/actions";
import { formatDateTime } from "@/lib/format/datetime";
import type { AdminSubscriber } from "@/lib/data/admin";

interface AdminNewsletterProps {
  subscribers: AdminSubscriber[];
}

// The table stores no unsubscribed flag — the row's existence is the subscription — so honouring an
// unsubscribe or removal request means deleting the row.
function RemoveSubscriber({ id, email }: { id: string; email: string }) {
  const [state, action, isPending] = useActionState(deleteSubscriber, null);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Remove ${email} from the newsletter? This cannot be undone.`)) {
          e.preventDefault();
        }
      }}
      className="flex items-center gap-2"
    >
      <input type="hidden" name="subscriberId" value={id} />
      <button
        type="submit"
        disabled={isPending}
        className="cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-1 font-heading text-[12px] uppercase tracking-widest text-terracotta underline decoration-terracotta/30 underline-offset-4 transition-colors hover:text-terracotta/80"
      >
        <Trash2 size={12} strokeWidth={1.6} />
        {isPending ? "Removing…" : "Remove"}
      </button>
      {state && !state.success && (
        <span className="font-body text-sm text-terracotta">{state.message}</span>
      )}
    </form>
  );
}

export function AdminNewsletter({ subscribers }: AdminNewsletterProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 25;

  const fullName = (sub: AdminSubscriber) =>
    [sub.first_name, sub.last_name].filter(Boolean).join(" ").trim();

  const filtered = subscribers.filter((sub) => {
    const haystack = [sub.email, fullName(sub), sub.phone]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-heading text-2xl font-light text-neutral-500">
          Newsletter Subscribers
          <span className="ml-2 font-body text-lg font-normal text-neutral-500">
            ({filtered.length})
          </span>
        </h2>
        <a
          href="/api/admin/export/newsletter"
          className="bg-brown px-4 py-2 font-heading text-[13px] uppercase tracking-widest text-beige-light transition-colors hover:bg-neutral-500"
        >
          Export CSV
        </a>
      </div>

      {/* Search Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name, email, or phone…"
          className="border border-neutral-200 bg-white px-3 py-2 font-body font-medium text-lg text-neutral-500 outline-none transition-colors focus:border-neutral-500 sm:w-64"
        />
      </div>

      {/* List / Table */}
      {paginated.length === 0 ? (
        <p className="font-body font-medium text-neutral-500">No subscribers found.</p>
      ) : (
        // relative: the Actions column's sr-only label is position:absolute, and without a
        // positioned ancestor it resolves against the page — escaping this scroller and
        // stretching the whole document to the table's width on a phone.
        <div className="relative border border-neutral-100 bg-white overflow-x-auto">
          {/* min-w keeps the five columns at a readable width and lets the wrapper above scroll
              them on a phone — w-full alone squeezes emails down to one word per line. */}
          <table className="w-full min-w-[820px] text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/50">
                <th className="p-4 font-heading text-[13px] uppercase tracking-widest text-neutral-500">
                  Name
                </th>
                <th className="p-4 font-heading text-[13px] uppercase tracking-widest text-neutral-500">
                  Email Address
                </th>
                <th className="p-4 font-heading text-[13px] uppercase tracking-widest text-neutral-500">
                  Phone
                </th>
                <th className="p-4 font-heading text-[13px] uppercase tracking-widest text-neutral-500">
                  Joined Date
                </th>
                <th className="p-4 font-heading text-[13px] uppercase tracking-widest text-neutral-500">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((sub) => (
                <tr
                  key={sub.id}
                  className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50/30 transition-colors"
                >
                  <td className="p-4 font-body font-medium text-lg text-neutral-500">
                    {fullName(sub) || <span className="text-neutral-300">—</span>}
                  </td>
                  <td className="p-4 font-body font-medium text-lg text-neutral-500">
                    <a
                      href={`mailto:${sub.email}`}
                      className="hover:text-brown transition-colors"
                    >
                      {sub.email}
                    </a>
                  </td>
                  <td className="p-4 font-body font-medium text-lg text-neutral-500">
                    {sub.phone ? (
                      <a href={`tel:${sub.phone}`} className="hover:text-brown transition-colors">
                        {sub.phone}
                      </a>
                    ) : (
                      <span className="text-neutral-300">—</span>
                    )}
                  </td>
                  <td className="p-4 font-body font-medium text-lg text-neutral-500">
                    {formatDateTime(sub.created_at)}
                  </td>
                  <td className="p-4">
                    <RemoveSubscriber id={sub.id} email={sub.email} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {/* flex-wrap: a long list has enough pages to overrun a phone (and a tablet) in one row. */}
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
