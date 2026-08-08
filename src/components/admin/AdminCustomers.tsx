"use client";

import { useState } from "react";
import { formatDate } from "@/lib/format/datetime";
import type { AdminCustomer } from "@/lib/data/admin";

interface AdminCustomersProps {
  customers: AdminCustomer[];
}

export function AdminCustomers({ customers }: AdminCustomersProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 25;

  const filtered = customers.filter((customer) => {
    const term = search.toLowerCase();
    return (
      (customer.full_name || "").toLowerCase().includes(term) ||
      (customer.email || "").toLowerCase().includes(term) ||
      (customer.phone || "").toLowerCase().includes(term)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-heading text-2xl font-light text-neutral-500">
          Customers
          <span className="ml-2 font-body text-lg font-normal text-neutral-500">
            ({filtered.length})
          </span>
        </h2>
        <a
          href="/api/admin/export/customers"
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
          placeholder="Search name, email, or phone…"
          className="border border-neutral-200 bg-white px-3 py-2 font-body font-medium text-lg text-neutral-500 outline-none transition-colors focus:border-neutral-500 sm:w-64"
        />
      </div>

      {/* Table */}
      {paginated.length === 0 ? (
        <p className="font-body font-medium text-neutral-500">No customers found.</p>
      ) : (
        <div className="border border-neutral-100 bg-white overflow-x-auto">
          {/* min-w keeps the five columns at a readable width and lets the wrapper above scroll
              them on a phone — w-full alone squeezes emails down to one word per line. */}
          <table className="w-full min-w-[760px] text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/50">
                <th className="p-4 font-heading text-[13px] uppercase tracking-widest text-neutral-500">
                  Full Name
                </th>
                <th className="p-4 font-heading text-[13px] uppercase tracking-widest text-neutral-500">
                  Email
                </th>
                <th className="p-4 font-heading text-[13px] uppercase tracking-widest text-neutral-500">
                  Phone
                </th>
                <th className="p-4 font-heading text-[13px] uppercase tracking-widest text-neutral-500">
                  Role
                </th>
                <th className="p-4 font-heading text-[13px] uppercase tracking-widest text-neutral-500">
                  Joined Date
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((cust) => (
                <tr
                  key={cust.id}
                  className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50/30 transition-colors"
                >
                  <td className="p-4 font-body text-lg font-semibold text-neutral-500">
                    {cust.full_name || <span className="text-neutral-500 italic">No Name</span>}
                  </td>
                  <td className="p-4 font-body font-medium text-lg text-neutral-500">
                    {cust.email ? (
                      <a href={`mailto:${cust.email}`} className="hover:text-brown transition-colors">
                        {cust.email}
                      </a>
                    ) : (
                      <span className="text-neutral-500 italic">No Email</span>
                    )}
                  </td>
                  <td className="p-4 font-body font-medium text-lg text-neutral-500">
                    {cust.phone || <span className="text-neutral-500">—</span>}
                  </td>
                  <td className="p-4 font-body font-medium text-lg">
                    {cust.is_admin ? (
                      <span className="rounded-sm bg-brown px-2 py-0.5 font-heading text-[12px] uppercase tracking-widest text-beige-light">
                        Admin
                      </span>
                    ) : (
                      <span className="rounded-sm bg-neutral-100 px-2 py-0.5 font-heading text-[12px] uppercase tracking-widest text-neutral-500">
                        Customer
                      </span>
                    )}
                  </td>
                  <td className="p-4 font-body font-medium text-lg text-neutral-500">
                    {formatDate(cust.created_at)}
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
