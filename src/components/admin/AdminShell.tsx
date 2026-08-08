"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Tags,
  Layers,
  Star,
  Newspaper,
  Mail,
  MessageSquare,
  Users,
  Ticket,
  Image as ImageIcon,
  Bell,
  Menu,
  X,
  ArrowLeft,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/collections", label: "Collections", icon: Layers },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { href: "/admin/contact", label: "Contact", icon: MessageSquare },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function ContactBell({
  unreadContactCount,
  className = "",
}: {
  unreadContactCount: number;
  className?: string;
}) {
  const hasUnread = unreadContactCount > 0;
  return (
    <Link
      href="/admin/contact"
      className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors ${
        hasUnread
          ? "border-terracotta/40 text-terracotta hover:border-terracotta hover:text-terracotta"
          : "border-neutral-100 text-neutral-400 hover:border-brown hover:text-brown"
      } ${className}`}
      title={hasUnread ? `${unreadContactCount} new contact message(s)` : "Contact messages"}
    >
      <Bell size={18} strokeWidth={1.6} className={hasUnread ? "animate-bell-ring" : ""} />
      {hasUnread && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta px-1 font-heading text-xs text-white">
          {unreadContactCount > 9 ? "9+" : unreadContactCount}
        </span>
      )}
    </Link>
  );
}

function NavList({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`group flex items-center gap-3 rounded-md px-4 py-3 font-heading text-sm uppercase tracking-widest transition-colors ${
              active
                ? "bg-brown text-beige-light"
                : "text-neutral-500 hover:bg-pink-100/50 hover:text-brown"
            }`}
          >
            <Icon
              size={18}
              strokeWidth={1.6}
              className={active ? "text-beige-light" : "text-neutral-400 group-hover:text-brown"}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({
  children,
  adminName,
  unreadContactCount,
}: {
  children: React.ReactNode;
  adminName: string;
  unreadContactCount: number;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-beige-light lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-72 shrink-0 border-r border-neutral-100 bg-white lg:flex lg:flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-6 py-6">
          <div>
            <p className="font-heading text-lg font-light text-neutral-500">Everly White</p>
            <p className="font-body text-sm text-neutral-500">Admin Panel</p>
          </div>
          <ContactBell unreadContactCount={unreadContactCount} />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <NavList pathname={pathname} />
        </div>

        <div className="border-t border-neutral-100 p-4">
          <p className="px-2 pb-3 font-body text-sm text-neutral-500">Signed in as {adminName}</p>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md px-4 py-3 font-heading text-sm uppercase tracking-widest text-neutral-500 transition-colors hover:bg-pink-100/50 hover:text-brown"
          >
            <ArrowLeft size={16} strokeWidth={1.6} />
            Back to Site
          </Link>
        </div>
      </aside>

      {/* Mobile topbar */}
      <div className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-white/40 bg-white/70 px-4 py-4 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-lg lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-md border border-neutral-100 text-neutral-500"
          aria-label="Open navigation"
        >
          <Menu size={20} strokeWidth={1.6} />
        </button>
        <p className="font-heading text-lg font-light text-neutral-500">Admin Panel</p>
        <ContactBell unreadContactCount={unreadContactCount} />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex w-72 max-w-[80vw] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-6">
              <p className="font-heading text-lg font-light text-neutral-500">Menu</p>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-md text-neutral-400 hover:text-brown"
                aria-label="Close navigation"
              >
                <X size={20} strokeWidth={1.6} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <NavList pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="border-t border-neutral-100 p-4">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-md px-4 py-3 font-heading text-sm uppercase tracking-widest text-neutral-500 hover:bg-pink-100/50 hover:text-brown"
              >
                <ArrowLeft size={16} strokeWidth={1.6} />
                Back to Site
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Content — min-w-0 because a flex item defaults to min-width:auto, which lets a wide
          child (the customer/subscriber tables, the sales chart) push this column past the
          viewport and scroll the whole page sideways instead of scrolling inside its own box. */}
      <div className="min-w-0 flex-1">
        <div className="mx-auto max-w-content px-6 py-8 sm:px-10">{children}</div>
      </div>
    </div>
  );
}
