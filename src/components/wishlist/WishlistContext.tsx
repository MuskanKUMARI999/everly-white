"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  getWishlistAction,
  addWishlistItem as addWishlistItemAction,
  removeWishlistItem as removeWishlistItemAction,
  adoptWishlistSlugs,
} from "@/lib/wishlist/actions";
import type { WishlistItem } from "@/lib/wishlist/types";

export type { WishlistItem };

// The key the wishlist used to live under, back when it was a browser-only feature. Read once
// on first load to hand those saved pieces to the account, then deleted.
const LEGACY_STORAGE_KEY = "everlywhite-wishlist";

// Mirrors CartContext: a small external store synced to Supabase rather than component state, so
// the account sidebar badge, product cards and the wishlist page all read one live snapshot via
// useSyncExternalStore instead of each holding their own copy. Mutations update this in-memory
// snapshot immediately (optimistic UI) and persist in the background — errors are logged, not
// surfaced, since the next full page load re-hydrates from the server and heals any drift.
const EMPTY_ITEMS: WishlistItem[] = [];
let items: WishlistItem[] = EMPTY_ITEMS;
let loaded = false;
const listeners = new Set<() => void>();

// Whose wishlist is in memory — a user id, or "guest". See the same note in CartContext: signing
// out is an in-app navigation, so without this the previous customer's saved pieces stay on screen
// until a hard refresh. Replaces the old one-shot `hydrating` flag.
let loadedIdentity: string | null = null;

function emitChange() {
  listeners.forEach((listener) => listener());
}

function logSyncError(action: string) {
  return (error: unknown) => {
    console.error(`Wishlist sync failed (${action}):`, error);
  };
}

function setItems(next: WishlistItem[]) {
  items = next;
  emitChange();
}

// Returns the slugs stranded in localStorage, clearing the key so the migration runs at most
// once per browser. A parse failure is treated as nothing to migrate.
function drainLegacyStorage(): string[] {
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    const parsed = JSON.parse(raw) as { slug?: string }[];
    return Array.isArray(parsed)
      ? parsed.map((item) => item?.slug).filter((slug): slug is string => Boolean(slug))
      : [];
  } catch {
    return [];
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Point the store at `identity`, reloading from the server if it changed.
 *
 * Clears first so the previous account's saves are never briefly visible, and resets `loaded` so
 * consumers fall back to their server-rendered counts instead of flashing an empty wishlist while
 * the new one is fetched.
 */
function syncIdentity(identity: string) {
  if (loadedIdentity === identity) return;
  loadedIdentity = identity;

  items = EMPTY_ITEMS;
  loaded = false;
  emitChange();

  // The localStorage migration is a one-off per browser and drainLegacyStorage() clears the key as
  // it reads, so re-running this on an identity change cannot re-adopt anything twice.
  const legacySlugs = drainLegacyStorage();
  const ready =
    legacySlugs.length > 0
      ? adoptWishlistSlugs(legacySlugs).catch(logSyncError("adopt legacy items"))
      : Promise.resolve();

  ready
    .then(getWishlistAction)
    .then((snapshot) => {
      // A slower earlier request must not overwrite a newer identity's wishlist.
      if (loadedIdentity !== identity) return;
      items = snapshot;
      loaded = true;
      emitChange();
    })
    .catch(logSyncError("identity sync"));
}

function getSnapshot() {
  return items;
}

function getServerSnapshot() {
  return EMPTY_ITEMS;
}

function getLoadedSnapshot() {
  return loaded;
}

function getLoadedServerSnapshot() {
  return false;
}

function addItem(product: WishlistItem) {
  if (items.some((item) => item.slug === product.slug)) return;
  setItems([product, ...items]);

  const formData = new FormData();
  formData.set("slug", product.slug);
  addWishlistItemAction(null, formData).catch(logSyncError("add item"));
}

function removeItem(slug: string) {
  setItems(items.filter((item) => item.slug !== slug));

  const formData = new FormData();
  formData.set("slug", slug);
  removeWishlistItemAction(null, formData).catch(logSyncError("remove item"));
}

function toggleItem(product: WishlistItem) {
  if (items.some((item) => item.slug === product.slug)) {
    removeItem(product.slug);
  } else {
    addItem(product);
  }
}

interface WishlistContextValue {
  items: WishlistItem[];
  count: number;
  /** False until the server snapshot arrives — let callers fall back to a server-rendered count. */
  loaded: boolean;
  isWishlisted: (slug: string) => boolean;
  addItem: typeof addItem;
  toggleItem: typeof toggleItem;
  removeItem: typeof removeItem;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({
  children,
  identity,
}: {
  children: ReactNode;
  identity: string;
}) {
  const wishlistItems = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isLoaded = useSyncExternalStore(subscribe, getLoadedSnapshot, getLoadedServerSnapshot);

  // Runs on mount and whenever the signed-in user changes.
  useEffect(() => {
    syncIdentity(identity);
  }, [identity]);

  const value = useMemo(
    () => ({
      items: wishlistItems,
      count: wishlistItems.length,
      loaded: isLoaded,
      isWishlisted: (slug: string) => wishlistItems.some((item) => item.slug === slug),
      addItem,
      toggleItem,
      removeItem,
    }),
    [wishlistItems, isLoaded],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}
