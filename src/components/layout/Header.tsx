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
  ChevronRight,
  Layers,
  Infinity as InfinityIcon,
  Archive,
  FileText,
  CircleHelp,
  Gift,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { useState, type ComponentType } from "react";
import { useCart } from "@/components/cart/CartContext";
import { useHideOnScroll } from "@/hooks/useHideOnScroll";
import { signOut } from "@/lib/auth/actions";
import type { NavCollectionData } from "@/lib/data/navigation";
import {
  isAdminRoute,
  isCheckoutFlowRoute,
  isMinimalChromeRoute,
  isProductDetailRoute,
} from "./chromeRoutes";
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

type IconProps = { size?: number; strokeWidth?: number; className?: string };

// Lucide has no butterfly or lotus, so these two are drawn inline in the same 24px stroke style.
function ButterflyIcon({ size = 24, strokeWidth = 2, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 8v11" />
      <path d="M12 8 10.5 5M12 8l1.5-3" />
      <path d="M12 11C10 6 4.5 3.5 3 5.5c-1.5 2 .5 6.5 9 7" />
      <path d="M12 11c2-5 7.5-7.5 9-5.5 1.5 2-.5 6.5-9 7" />
      <path d="M12 13c-4 .5-7 2.5-6 5s4.5 1.5 6-3" />
      <path d="M12 13c4 .5 7 2.5 6 5s-4.5 1.5-6-3" />
    </svg>
  );
}

function LotusIcon({ size = 24, strokeWidth = 2, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 20c-2.5-1.8-3.5-4.5-3.5-7.5S10 6.5 12 4c2 2.5 3.5 5.5 3.5 8.5S14.5 18.2 12 20Z" />
      <path d="M12 20c-3.5 0-7-2.5-7-8 1.8.2 3.2.9 4.2 1.9" />
      <path d="M12 20c3.5 0 7-2.5 7-8-1.8.2-3.2.9-4.2 1.9" />
      <path d="M12 20c-4.5.3-8.5-1.2-10-4.5 1.6-.6 3.3-.6 4.8-.1" />
      <path d="M12 20c4.5.3 8.5-1.2 10-4.5-1.6-.6-3.3-.6-4.8-.1" />
    </svg>
  );
}

// The mobile drawer follows its own mock: flame, moon, star, butterfly, infinity.
const MOBILE_ITEM_ICONS: ComponentType<IconProps>[] = [
  Flame,
  Moon,
  Star,
  ButterflyIcon,
  InfinityIcon,
  Sparkles,
];

// Home is left out of the drawer: the logo directly below it already links home.
const mobileNavLinks: { label: string; href: string; icon: ComponentType<IconProps> }[] = [
  { label: "About Us", href: "/about", icon: User },
  { label: "Products", href: "/products", icon: Archive },
  { label: "Blogs", href: "/blog", icon: FileText },
  { label: "Reviews", href: "/reviews", icon: Star },
  { label: "FAQ", href: "/faqs", icon: CircleHelp },
  { label: "Gifts", href: "/gifts", icon: Gift },
];

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
  const [mobileCollectionsOpen, setMobileCollectionsOpen] = useState(true);

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

  // Product pages only: the bar slides away on scroll-down and comes back the moment the reader
  // scrolls up. Suspended while the search or mobile-menu panel is open — both live inside the
  // header, so hiding it would yank the panel the reader is using off the screen.
  const hidden = useHideOnScroll(isProductDetailRoute(pathname) && !menuOpen && !searchOpen);

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

  // Rendered in two places, and never both at once — the hidden one is display:none, so it stays
  // out of the accessibility tree rather than duplicating the control. On phones the drawer
  // toggle sits at the LEFT edge of the bar; from md up it stays in the right-hand icon cluster.
  // The caller supplies the position utility: Tailwind orders .relative after .absolute, so a
  // base `relative` here would silently win over an `absolute` passed in through className.
  const menuToggle = (className: string, withLabel = false) => (
    <button
      type="button"
      aria-label="Toggle menu"
      onClick={() => setMenuOpen((o) => !o)}
      className={`cursor-pointer -m-2.5 h-10 w-10 items-center justify-center text-neutral-400 transition-colors hover:text-brown ${className}`}
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
      {withLabel && (
        <span className="absolute left-1/2 top-full -mt-1 -translate-x-1/2 font-heading text-[9px] uppercase tracking-[0.18em] text-brown">
          Menu
        </span>
      )}
    </button>
  );

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

      <header
        className={`sticky top-0 z-40 border-b border-white/40 bg-white/60 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-lg transition-transform duration-300 ease-out motion-reduce:transition-none ${
          hidden ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        {/* pt-0 below md lifts the logo up level with the icons: this row is empty on phones
            (the nav is lg-only and both icon clusters are absolute), so its padding is doing
            nothing but pushing the logo row down. The icons are positioned from this element's
            border-box top, so they stay put. md and up keeps the original spacing. */}
        <div className="relative mx-auto flex max-w-content items-center justify-center px-6 pt-0 sm:px-10 md:pt-3 lg:px-10">
          {menuToggle("absolute left-6 top-2.5 flex sm:left-10 md:hidden", true)}

          <nav className="hidden items-center gap-6 lg:flex">
            {[navLinks[0]].map((link) => (
              <NavLink key={link.href} {...link} active={isActive(link.href)} />
            ))}

            <div
              className="group relative"
              onMouseEnter={() => setCollectionOpen(true)}
              onMouseLeave={() => setCollectionOpen(false)}
            >
              {/* Hover opens the dropdown; a click goes straight to the collection page. */}
              <Link
                href={collections[0]?.href ?? "/collection"}
                aria-expanded={collectionOpen}
                aria-haspopup="menu"
                aria-current={collectionActive ? "page" : undefined}
                onClick={() => setCollectionOpen(false)}
                onFocus={() => setCollectionOpen(true)}
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
              </Link>
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
            {/* Account actions move into the hamburger drawer below md — see the drawer
                below. On a phone the top bar cannot fit the account icon plus the Logout
                label alongside search, cart and the menu button without crowding the logo. */}
            {user ? (
              <div className="hidden items-center gap-4 md:flex">
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
                className="hidden -m-2.5 p-2.5 text-neutral-400 transition-colors hover:text-brown md:block"
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
            {menuToggle("relative hidden md:flex lg:hidden")}
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
              className="overflow-hidden bg-beige-light pt-16 md:pt-0 lg:hidden"
            >
              {/* The header is sticky, so a drawer taller than the screen could never be scrolled
                  into view — the drawer scrolls internally instead. */}
              <nav className="max-h-[calc(100dvh-7rem)] overflow-y-auto px-6 pb-4 sm:px-10">
                <div className="border-t border-neutral-100">
                  <button
                    type="button"
                    aria-expanded={mobileCollectionsOpen}
                    onClick={() => setMobileCollectionsOpen((o) => !o)}
                    className={`flex w-full cursor-pointer items-center gap-4 py-4 font-heading text-[15px] uppercase tracking-[0.12em] transition-colors hover:text-brown ${
                      collectionActive ? "text-brown" : "text-neutral-500"
                    }`}
                  >
                    <Layers size={20} strokeWidth={1.3} className="shrink-0 text-brown" />
                    <span className="flex-1 text-left">Collections</span>
                    <motion.span
                      animate={{ rotate: mobileCollectionsOpen ? 180 : 0 }}
                      transition={{ duration: 0.2, ease: EASE }}
                      className="flex text-neutral-300"
                    >
                      <ChevronDown size={16} strokeWidth={1.4} />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {mobileCollectionsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: EASE }}
                        className="overflow-hidden"
                      >
                        {allCollections.map((c, ci) =>
                          c.items.length > 0 ? (
                            <div key={c.key} className="mb-2">
                              <Link
                                href={c.href}
                                onClick={() => setMenuOpen(false)}
                                className="group/card relative block h-37 overflow-hidden rounded-sm border border-neutral-100/70 bg-beige-light"
                              >
                                <Image
                                  src={c.image}
                                  alt={c.imageAlt}
                                  fill
                                  sizes="(min-width: 768px) 60vw, 90vw"
                                  className="object-cover object-right transition-transform duration-500 group-hover/card:scale-[1.03]"
                                />
                                <div className="absolute inset-0 bg-linear-to-r from-beige-light from-30% via-beige-light/80 to-transparent" />
                                <div className="relative flex h-full max-w-[72%] flex-col justify-center px-5">
                                  <p className="text-balance font-heading text-[18px] uppercase leading-tight tracking-[0.04em] text-neutral-500">
                                    {c.name}
                                  </p>
                                  <p className="mt-3 inline-flex items-center gap-2 whitespace-nowrap font-body text-[13.5px] text-neutral-400">
                                    {ci === 0 ? "Explore the debut collection" : "Explore the collection"}
                                    <ArrowRight size={14} strokeWidth={1.4} className="shrink-0 text-brown" />
                                  </p>
                                </div>
                              </Link>

                              <ul>
                                {c.items.map((item, index) => {
                                  const Icon = MOBILE_ITEM_ICONS[index % MOBILE_ITEM_ICONS.length];
                                  const active = pathname === item.href;
                                  return (
                                    <li key={item.href} className="border-b border-neutral-100/70 last:border-b-0">
                                      <Link
                                        href={item.href}
                                        onClick={() => setMenuOpen(false)}
                                        aria-current={active ? "page" : undefined}
                                        className={`flex items-center gap-4 py-4 pl-2 font-heading text-[13px] uppercase tracking-[0.15em] transition-colors hover:text-brown ${
                                          active ? "font-semibold text-brown" : "text-neutral-500"
                                        }`}
                                      >
                                        <Icon size={20} strokeWidth={1.3} className="w-10 shrink-0 text-brown" />
                                        <span className="flex-1">{item.label}</span>
                                        <ChevronRight size={16} strokeWidth={1.4} className="text-neutral-300" />
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          ) : (
                            // Upcoming collections have nothing to link to yet, so they render as
                            // a muted, non-interactive teaser row.
                            <div
                              key={c.key}
                              aria-disabled="true"
                              className="flex items-center gap-4 border-t border-neutral-100/70 py-4 pl-2"
                            >
                              <LotusIcon size={22} strokeWidth={1.2} className="w-10 shrink-0 text-neutral-200" />
                              <div className="flex-1">
                                <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-heading text-[13px] uppercase tracking-[0.12em] text-neutral-500">
                                  {c.name}
                                  {c.badge && (
                                    <span className="whitespace-nowrap rounded-sm border border-neutral-200 px-1.5 py-0.5 text-[8.5px] tracking-[0.08em] text-neutral-300">
                                      {c.badge}
                                    </span>
                                  )}
                                </p>
                                <p className="mt-1 font-body text-[14px] text-neutral-200">
                                  A new collection is on its way.
                                </p>
                              </div>
                              <ChevronRight size={16} strokeWidth={1.4} className="text-neutral-200" />
                            </div>
                          ),
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <ul className="mt-3 border-t border-neutral-100 pt-2">
                  {mobileNavLinks.map(({ label, href, icon: Icon }, i) => (
                    <motion.li
                      key={href}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.22, delay: i * 0.035, ease: EASE }}
                    >
                      <Link
                        href={href}
                        onClick={() => setMenuOpen(false)}
                        aria-current={isActive(href) ? "page" : undefined}
                        className={`flex items-center gap-5 py-3.5 font-heading text-[13px] uppercase tracking-[0.16em] transition-colors hover:text-brown ${
                          isActive(href) ? "font-semibold text-brown" : "text-neutral-500"
                        }`}
                      >
                        <Icon size={20} strokeWidth={1.3} className="shrink-0 text-brown" />
                        <span className="flex-1">{label}</span>
                        <ChevronRight size={16} strokeWidth={1.4} className="text-neutral-300" />
                      </Link>
                    </motion.li>
                  ))}
                </ul>

                {/* md:hidden — at md and up these still live in the top bar. */}
                <div className="mt-3 border-t border-neutral-100 pt-2 md:hidden">
                  {user ? (
                    <>
                      <Link
                        href="/account"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-5 py-3.5 font-heading text-[13px] uppercase tracking-[0.16em] text-neutral-500 transition-colors hover:text-brown"
                      >
                        <User size={20} strokeWidth={1.3} className="shrink-0 text-neutral-400" />
                        <span className="flex-1">My Account</span>
                        <ChevronRight size={16} strokeWidth={1.4} className="text-neutral-300" />
                      </Link>
                      <form action={signOut}>
                        <button
                          type="submit"
                          onClick={() => setMenuOpen(false)}
                          className="flex w-full cursor-pointer items-center gap-5 py-3.5 text-left font-heading text-[13px] uppercase tracking-[0.16em] text-neutral-500 transition-colors hover:text-brown"
                        >
                          <LogOut size={20} strokeWidth={1.3} className="shrink-0 text-neutral-400" />
                          <span className="flex-1">Logout</span>
                          <ChevronRight size={16} strokeWidth={1.4} className="text-neutral-300" />
                        </button>
                      </form>
                    </>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-5 py-3.5 font-heading text-[13px] uppercase tracking-[0.16em] text-neutral-500 transition-colors hover:text-brown"
                    >
                      <User size={20} strokeWidth={1.3} className="shrink-0 text-neutral-400" />
                      <span className="flex-1">Sign In</span>
                      <ChevronRight size={16} strokeWidth={1.4} className="text-neutral-300" />
                    </Link>
                  )}
                </div>
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
              // w-32 under 360px: the logo now sits level with the icons, and at 320px the
              // 150px version comes within ~11px of the search icon.
              className="h-auto w-32 min-[360px]:w-37.5 sm:w-45"
            />
          </Link>
        </div>
      </header>
    </>
  );
}
