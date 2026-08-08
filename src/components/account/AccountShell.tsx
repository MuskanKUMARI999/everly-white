"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LayoutGrid, LogOut, MapPin, Package, UserRound, type LucideIcon } from "lucide-react";
import { useWishlist } from "@/components/wishlist/WishlistContext";
import { signOut } from "@/lib/auth/actions";

interface NavItem {
  label: string;
  href: string;
  Icon: LucideIcon;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/account", Icon: LayoutGrid },
  { label: "Orders", href: "/account/orders", Icon: Package },
  { label: "Wishlist", href: "/account/wishlist", Icon: Heart },
  { label: "Address", href: "/account/address", Icon: MapPin },
  { label: "Account Details", href: "/account/details", Icon: UserRound },
];

export interface AccountIdentity {
  name: string;
  email: string;
}

function initialsFrom(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

function AccountSidebar({
  identity,
  initialWishlistCount,
}: {
  identity: AccountIdentity;
  initialWishlistCount: number;
}) {
  const pathname = usePathname();
  // The badge is server-rendered from the start and only defers to the client store once that
  // has caught up, so the count never blinks from 0 to its real value on load.
  const { count, loaded } = useWishlist();
  const wishlistCount = loaded ? count : initialWishlistCount;
  const initials = initialsFrom(identity.name, identity.email);

  return (
    <aside className="lg:sticky lg:top-28 lg:self-start">
      <div className="flex items-center gap-3 border-b border-neutral-100 pb-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pink-100 font-heading text-sm text-brown">
          {initials || "?"}
        </span>
        <div className="min-w-0">
          <p className="truncate font-body text-sm text-neutral-500">{identity.name}</p>
          <p className="truncate font-body text-xs text-neutral-300">{identity.email}</p>
        </div>
      </div>

      <nav
        aria-label="Account"
        className="mt-6 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] lg:flex-col lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden"
      >
        {navItems.map(({ label, href, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 font-heading text-[11.5px] uppercase tracking-[0.1em] transition-colors duration-200 lg:gap-3 lg:border-b-0 lg:border-l-2 lg:px-0 lg:pl-4 ${
                active
                  ? "border-brown text-brown"
                  : "border-transparent text-neutral-400 hover:text-neutral-500"
              }`}
            >
              <Icon size={15} strokeWidth={1.5} className="shrink-0" />
              {label}
              {label === "Wishlist" && wishlistCount > 0 && (
                <span className="font-body text-[11px] normal-case tracking-normal text-neutral-300 lg:ml-auto">
                  {wishlistCount}
                </span>
              )}
            </Link>
          );
        })}

        {/* Real sign-out, not a link to /login — clears the Supabase session server-side. */}
        <form action={signOut} className="shrink-0 lg:mt-4">
          <button
            type="submit"
            className="cursor-pointer flex w-full shrink-0 items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 font-heading text-[11.5px] uppercase tracking-[0.1em] text-neutral-300 transition-colors duration-200 hover:text-terracotta lg:gap-3 lg:border-b-0 lg:border-l-2 lg:px-0 lg:pl-4"
          >
            <LogOut size={15} strokeWidth={1.5} className="shrink-0" />
            Log Out
          </button>
        </form>
      </nav>
    </aside>
  );
}

export function AccountShell({
  identity,
  wishlistCount,
  children,
}: {
  identity: AccountIdentity;
  wishlistCount: number;
  children: React.ReactNode;
}) {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[260px_1fr] lg:gap-16">
          <AccountSidebar identity={identity} initialWishlistCount={wishlistCount} />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </section>
  );
}
