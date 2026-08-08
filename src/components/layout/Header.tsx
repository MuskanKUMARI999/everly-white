"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  Menu,
  X,
  ChevronDown,
  User,
  Search,
  ShoppingBag,
  ArrowRight,
  Flame,
  Moon,
  Star,
  Waypoints,
  Link2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { useCart } from "@/components/cart/CartContext";
import { signOut } from "@/lib/auth/actions";
import type { NavCollectionData } from "@/lib/data/navigation";
import { isAdminRoute, isCheckoutFlowRoute, isMinimalChromeRoute } from "./chromeRoutes";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Products", href: "/products" },
  { label: "Blogs", href: "/blog" },
  { label: "Reviews", href: "/reviews" },
  { label: "FAQ", href: "/faqs" },
  { label: "Gifts", href: "/gifts" },
];

// Decorative icons rotate across a collection's products in order — the products themselves carry
// no icon in the database, so this is purely presentational.
const ITEM_ICONS: LucideIcon[] = [Flame, Moon, Star, Waypoints, Link2, Sparkles];

// Upcoming collections aren't published in the database yet, so they can't come from getNavCollections.
// Kept here as a teaser tab appended after the live collections, preserving the "coming soon" preview.
const UPCOMING_COLLECTIONS: NavCollectionData[] = [
  {
    key: "celestial-bloom",
    name: "Celestial Bloom",
    badge: "Coming Soon",
    image: "/images/banners/category-2.png",
    imageAlt: "A softly blurred preview of the Celestial Bloom collection",
    tagline: "Celestial Bloom is taking shape",
    href: "/products?collection=celestial-bloom",
    items: [],
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

// Hoisted out of Header: defining this inside the component body would give it a new function
// identity on every Header re-render (search/collection-dropdown/menu toggles all re-render
// Header), forcing React to remount it — which breaks the layoutId's shared-position tracking
// and made the underline glitch/jump on unrelated interactions instead of just active-route changes.
function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative pb-1.5 font-heading text-[11.5px] uppercase tracking-widest transition-colors hover:text-brown ${
        active ? "font-semibold text-brown" : "font-medium text-neutral-400"
      }`}
    >
      {label}
      {active && (
        <motion.span
          layoutId="desktop-nav-underline"
          className="absolute inset-x-0 -bottom-0 h-px bg-brown"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      )}
    </Link>
  );
}

export function Header({
  user,
  collections,
}: {
  user: SupabaseUser | null;
  collections: NavCollectionData[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);

  // Live collections first, then the coming-soon teasers.
  const allCollections = [...collections, ...UPCOMING_COLLECTIONS];
  const [activeCollectionKey, setActiveCollectionKey] = useState(allCollections[0]?.key ?? "");

  const activeCollection =
    allCollections.find((c) => c.key === activeCollectionKey) ?? allCollections[0];

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const collectionActive = pathname.startsWith("/collection");
  // Route lists live in chromeRoutes so Header, Footer and the welcome popup can't disagree.
  const isCheckoutFlow = isCheckoutFlowRoute(pathname);
  const isMinimalHeader = isMinimalChromeRoute(pathname);
  // Admin renders no storefront chrome at all — not even the minimal logo bar, since AdminShell
  // brings its own header. Checked before the minimal branch so it can't fall through to it.
  const isAdmin = isAdminRoute(pathname);

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q")?.toString().trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
  }

  if (isAdmin) return null;

  if (isMinimalHeader) {
    return (
      <header className="sticky top-0 z-40 border-b border-white/40 bg-white/60 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-lg">
        <div className="relative flex items-center justify-center px-6 py-3.5 sm:px-10 lg:px-10">
          <Link href="/">
            <Image
              src="/images/logo.png"
              alt="Everly White"
              width={1080}
              height={207}
              // fetchPriority rather than `preload` (which replaced the deprecated `priority` in
              // Next 16): the logo is above the fold and wanted early, but it is not the LCP —
              // the page hero is. A preload <link> here would compete with the hero's for
              // bandwidth on first paint. Only one of the two logos below ever renders per
              // request, since the minimal header returns early.
              fetchPriority="high"
              className="h-auto w-37.5 sm:w-45"
            />
          </Link>
          {isCheckoutFlow && (
            <Link
              href="/"
              aria-label="Close and return home"
              className="absolute right-6 top-1/2 -translate-y-1/2 p-2.5 text-neutral-400 transition-colors hover:text-brown sm:right-10 lg:right-10"
            >
              <X size={20} strokeWidth={1.4} />
            </Link>
          )}
        </div>
      </header>
    );
  }

  return (
    <>
      <div className="border-b border-neutral-100 bg-beige-light px-4 py-2.5 text-center">
        <p className="font-heading text-[11px] uppercase tracking-[0.2em] text-neutral-400">
          <span className="sm:hidden">Free Shipping &middot; 5% Off Your First Order</span>
          <span className="hidden sm:inline">
            Free Shipping on All Products Across India&nbsp;&nbsp;&middot;&nbsp;&nbsp;Get 5% Off on
            Your First Purchase
          </span>
        </p>
      </div>

      <header className="sticky top-0 z-40 border-b border-white/40 bg-white/60 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-lg">
        <div className="relative mx-auto flex max-w-content items-center justify-center px-6 pt-3 sm:px-10 lg:px-10">
          <nav className="hidden items-center gap-6 lg:flex">
            {[navLinks[0]].map((link) => (
              <NavLink key={link.href} {...link} active={isActive(link.href)} />
            ))}

            <div
              className="group relative"
              onMouseEnter={() => setCollectionOpen(true)}
              onMouseLeave={() => setCollectionOpen(false)}
            >
              <button
                type="button"
                aria-expanded={collectionOpen}
                aria-haspopup="menu"
                aria-current={collectionActive ? "page" : undefined}
                onClick={() => setCollectionOpen((o) => !o)}
                className={`cursor-pointer relative flex items-center gap-1 pb-1.5 font-heading text-[11.5px] uppercase tracking-widest transition-colors hover:text-brown ${
                  collectionActive ? "font-semibold text-brown" : "font-medium text-neutral-400"
                }`}
              >
                Collection
                <motion.span
                  animate={{ rotate: collectionOpen ? 180 : 0 }}
                  transition={{ duration: 0.2, ease: EASE }}
                  className="flex"
                >
                  <ChevronDown size={12} strokeWidth={1.5} />
                </motion.span>
                {collectionActive && (
                  <motion.span
                    layoutId="desktop-nav-underline"
                    className="absolute inset-x-0 -bottom-0 h-px bg-brown"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
              </button>
              <AnimatePresence>
                {collectionOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18, ease: EASE }}
                    className="absolute left-0 top-full z-20 pt-3"
                  >
                    <div className="flex w-[min(880px,calc(100vw-3rem))] overflow-hidden border border-neutral-100 bg-white/95 shadow-lg backdrop-blur-md">
                      <div className="relative hidden w-65 shrink-0 sm:block">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={activeCollectionKey}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.22, ease: EASE }}
                            className="absolute inset-0"
                          >
                            <Image
                              src={activeCollection.image}
                              alt={activeCollection.imageAlt}
                              fill
                              sizes="260px"
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-6">
                              <p className="font-heading text-lg leading-snug text-beige-light">
                                {activeCollection.tagline}
                              </p>
                              <Link
                                href={activeCollection.href}
                                onClick={() => setCollectionOpen(false)}
                                className="mt-4 inline-flex items-center gap-2 border border-white/70 bg-white/15 px-4 py-2 font-heading text-[10.5px] uppercase tracking-[0.12em] text-beige-light backdrop-blur-sm transition-colors hover:bg-white/25"
                              >
                                See Collection
                              </Link>
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </div>

                      <div className="flex-1 p-5">
                        <div className="relative flex flex-wrap items-center gap-6 border-b border-neutral-100">
                          {allCollections.map((c) => (
                            <button
                              key={c.key}
                              type="button"
                              onClick={() => setActiveCollectionKey(c.key)}
                              aria-pressed={activeCollectionKey === c.key}
                              className={`cursor-pointer relative -mb-px flex items-center gap-1.5 border-b-2 border-transparent pb-2.5 font-heading text-[10.5px] uppercase tracking-widest transition-colors duration-200 ${
                                activeCollectionKey === c.key
                                  ? "text-brown"
                                  : "text-neutral-400 hover:text-brown"
                              }`}
                            >
                              {c.name}
                              {c.badge && <span className="text-neutral-300">({c.badge})</span>}
                              {activeCollectionKey === c.key && (
                                <motion.span
                                  layoutId="collection-tab-underline"
                                  className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-brown"
                                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                                />
                              )}
                            </button>
                          ))}
                        </div>

                        <AnimatePresence mode="wait">
                          <motion.div
                            key={activeCollectionKey}
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            transition={{ duration: 0.16, ease: EASE }}
                          >
                            {activeCollection.items.length > 0 ? (
                              <div className="mt-6 grid grid-cols-3 gap-1">
                                {activeCollection.items.map(({ label, description, href }, index) => {
                                  const Icon = ITEM_ICONS[index % ITEM_ICONS.length];
                                  return (
                                  <Link
                                    key={label}
                                    href={href}
                                    onClick={() => setCollectionOpen(false)}
                                    className="group/item block p-4 transition-colors duration-200 hover:bg-pink-100"
                                  >
                                    <Icon size={22} strokeWidth={1.3} className="text-brown" />
                                    <p className="mt-3 font-heading text-[12.5px] uppercase tracking-widest text-neutral-500 group-hover/item:text-brown">
                                      {label}
                                    </p>
                                    <p className="mt-1.5 font-body text-[13px] leading-snug text-neutral-300">
                                      {description}
                                    </p>
                                  </Link>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="mt-6 flex min-h-50 flex-col items-center justify-center gap-3 border border-dashed border-neutral-100 p-10 text-center">
                                <Sparkles size={24} strokeWidth={1.3} className="text-brown" />
                                <p className="font-heading text-[12.5px] uppercase tracking-widest text-neutral-500">
                                  New Pieces Taking Shape
                                </p>
                                <p className="max-w-[36ch] font-body text-[13px] text-neutral-300">
                                  The {activeCollection.name} collection is being hand-finished in
                                  our studio — join our list to be first to know when it arrives.
                                </p>
                              </div>
                            )}
                          </motion.div>
                        </AnimatePresence>

                        <div className="mt-8 border-t border-neutral-100 pt-5">
                          <Link
                            href="/products"
                            onClick={() => setCollectionOpen(false)}
                            className="inline-flex items-center gap-1.5 font-heading text-[11px] uppercase tracking-widest text-neutral-400 transition-colors hover:text-brown"
                          >
                            View All Products <ArrowRight size={13} strokeWidth={1.5} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {navLinks.slice(1).map((link) => (
              <NavLink key={link.href} {...link} active={isActive(link.href)} />
            ))}
          </nav>

          <div className="absolute right-6 top-2.5 flex items-center gap-4 sm:right-10 lg:right-10">
            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/account"
                  aria-label="Account"
                  className="-m-2.5 p-2.5 text-neutral-400 transition-colors hover:text-brown"
                >
                  <User size={17} strokeWidth={1.4} />
                </Link>
                <form action={signOut}>
                  <button
                    type="submit"
                    aria-label="Sign out"
                    className="-m-2.5 cursor-pointer p-2.5 text-neutral-400 transition-colors hover:text-brown"
                  >
                    <span className="font-heading text-[10px] uppercase tracking-widest">Logout</span>
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/login"
                aria-label="Sign in"
                className="-m-2.5 p-2.5 text-neutral-400 transition-colors hover:text-brown"
              >
                <User size={17} strokeWidth={1.4} />
              </Link>
            )}
            <button
              type="button"
              aria-label="Search"
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((o) => !o)}
              className="cursor-pointer -m-2.5 p-2.5 text-neutral-400 transition-colors hover:text-brown"
            >
              <Search size={17} strokeWidth={1.4} />
            </button>
            <Link
              href="/cart"
              aria-label="Cart"
              className="-m-2.5 p-2.5 text-neutral-400 transition-colors hover:text-brown"
            >
              <span className="relative flex">
                <ShoppingBag size={17} strokeWidth={1.4} />
                {itemCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-3.75 w-3.75 items-center justify-center rounded-full bg-brown text-[9px] text-beige-light">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </span>
            </Link>
            <button
              type="button"
              aria-label="Toggle menu"
              onClick={() => setMenuOpen((o) => !o)}
              className="cursor-pointer relative -m-2.5 flex h-10 w-10 items-center justify-center text-neutral-400 transition-colors hover:text-brown lg:hidden"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={menuOpen ? "close" : "open"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2, ease: EASE }}
                  className="absolute flex"
                >
                  {menuOpen ? <X size={20} strokeWidth={1.4} /> : <Menu size={20} strokeWidth={1.4} />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: EASE }}
              className="overflow-hidden border-t border-white/40"
            >
              <div className="px-6 py-3 sm:px-10 lg:px-10">
                <form onSubmit={handleSearch} className="mx-auto flex max-w-content items-center gap-3">
                  <Search size={18} strokeWidth={1.4} className="shrink-0 text-neutral-400" />
                  <input
                    autoFocus
                    name="q"
                    type="search"
                    placeholder="Search products…"
                    aria-label="Search products"
                    className="w-full bg-transparent py-1 font-body text-neutral-500 outline-none placeholder:text-neutral-300"
                  />
                  <button
                    type="button"
                    aria-label="Close search"
                    onClick={() => setSearchOpen(false)}
                    className="cursor-pointer -m-2.5 shrink-0 p-2.5 text-neutral-400 transition-colors hover:text-brown"
                  >
                    <X size={18} strokeWidth={1.4} />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="overflow-hidden border-t border-neutral-100 bg-white/95 lg:hidden"
            >
              <nav className="flex flex-col gap-1 px-6 py-4">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.22, delay: i * 0.035, ease: EASE }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      aria-current={isActive(link.href) ? "page" : undefined}
                      className={`block py-2 font-heading text-xs uppercase tracking-widest transition-colors hover:text-brown ${
                        isActive(link.href) ? "font-semibold text-brown" : "font-medium text-neutral-400"
                      }`}
                    >
                      {link.label}
                    </Link>
                    {i === 0 && (
                      <div className="border-t border-neutral-100 py-2 pl-4">
                        {allCollections.map((c) => (
                          <div key={c.key} className="mb-3 last:mb-0">
                            <p className="font-heading text-xs uppercase tracking-[0.14em] text-neutral-300">
                              {c.name}
                              {c.badge && <span> ({c.badge})</span>}
                            </p>
                            {c.items.length > 0 ? (
                              c.items.map((item) => (
                                <Link
                                  key={item.href}
                                  href={item.href}
                                  onClick={() => setMenuOpen(false)}
                                  className="block py-1.5 font-heading text-xs uppercase tracking-widest text-neutral-400 transition-colors hover:text-brown"
                                >
                                  {item.label}
                                </Link>
                              ))
                            ) : (
                              <p className="py-1.5 font-body text-xs text-neutral-300">Coming soon.</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-center px-6 py-3.5 sm:px-10 lg:px-10">
          <Link href="/">
            <Image
              src="/images/logo.png"
              alt="Everly White"
              width={1080}
              height={207}
              // fetchPriority rather than `preload` (which replaced the deprecated `priority` in
              // Next 16): the logo is above the fold and wanted early, but it is not the LCP —
              // the page hero is. A preload <link> here would compete with the hero's for
              // bandwidth on first paint. Only one of the two logos below ever renders per
              // request, since the minimal header returns early.
              fetchPriority="high"
              className="h-auto w-37.5 sm:w-45"
            />
          </Link>
        </div>
      </header>
    </>
  );
}
