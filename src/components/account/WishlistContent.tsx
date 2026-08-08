"use client";

import { Heart } from "lucide-react";
import { CollectionEyebrow as Eyebrow } from "@/components/collection/Eyebrow";
import { ProductCard } from "@/components/sections/ProductCard";
import { AccountEmptyState } from "./AccountEmptyState";
import { useWishlist, type WishlistItem } from "@/components/wishlist/WishlistContext";

export function WishlistContent({ initialItems }: { initialItems: WishlistItem[] }) {
  // Server data holds the page until the client store has loaded; after that the store wins, so
  // un-hearting a piece removes it from the grid immediately.
  const { items: storeItems, loaded } = useWishlist();
  const items = loaded ? storeItems : initialItems;

  return (
    <div>
      <Eyebrow>My Account</Eyebrow>
      <h1 className="mt-3 font-heading text-3xl text-neutral-500 sm:text-4xl">Wishlist</h1>
      <p className="mt-2 font-body text-neutral-300">
        Pieces you&rsquo;ve saved to come back to later.
      </p>

      {items.length === 0 ? (
        <div className="mt-10">
          <AccountEmptyState
            Icon={Heart}
            title="Your Wishlist Is Empty"
            description="Tap the heart on any piece to save it here. Your wishlist is tied to your account, so it'll be waiting on whatever device you sign in from."
            action={{ label: "Shop Now", href: "/products" }}
          />
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
          {items.map((item) => (
            <ProductCard
              key={item.slug}
              name={item.name}
              price={item.price}
              image={item.image}
              hoverImage={item.hoverImage}
              isFlagship={item.isFlagship}
            />
          ))}
        </div>
      )}
    </div>
  );
}
