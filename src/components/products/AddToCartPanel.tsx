"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, Heart, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/components/cart/CartContext";
import { MAX_QUANTITY, maxOrderableQuantity } from "@/lib/cart/types";
import { useWishlist } from "@/components/wishlist/WishlistContext";
import { productSlug } from "@/components/sections/productFormat";

interface AddToCartPanelProps {
  productName: string;
  /** The product's stored slug — what addToCart and the wishlist match on server-side. */
  slug?: string;
  price: number;
  image: string;
  hoverImage?: string;
  /** Units available. Undefined means unknown, which falls back to the flat per-line cap. */
  stock?: number;
}

export function AddToCartPanel({
  productName,
  slug: storedSlug,
  price,
  image,
  hoverImage,
  stock,
}: AddToCartPanelProps) {
  const { addItem, items } = useCart();
  const slug = productSlug({ slug: storedSlug, name: productName });
  // Drives the button's label off the cart itself rather than a transient "just clicked" flag, so
  // the piece reads "Go to Cart" on a fresh page load too if it's already in the bag.
  const inCart = items.some((item) => item.slug === slug);
  const { isWishlisted, toggleItem } = useWishlist();
  const wishlisted = isWishlisted(slug);
  const maxQuantity = maxOrderableQuantity(stock);
  const soldOut = maxQuantity === 0;
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!justAdded) return;
    const timeout = setTimeout(() => setJustAdded(false), 2500);
    return () => clearTimeout(timeout);
  }, [justAdded]);

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Hidden once the piece is in the bag — the button no longer adds anything, so a live
            stepper beside it would be a control that silently does nothing. Quantity is edited
            on the cart page from here on. */}
        {!inCart && (
          <div className="flex w-fit shrink-0 items-center self-start border border-neutral-100">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="cursor-pointer disabled:cursor-not-allowed p-3.5 text-neutral-400 transition-colors hover:text-brown disabled:opacity-40"
            >
              <Minus size={14} strokeWidth={1.5} />
            </button>
            <span
              aria-live="polite"
              aria-label={`Quantity: ${quantity}`}
              className="w-10 text-center font-body text-neutral-500"
            >
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
              disabled={quantity >= maxQuantity}
              className="cursor-pointer disabled:cursor-not-allowed p-3.5 text-neutral-400 transition-colors hover:text-brown disabled:opacity-40"
            >
              <Plus size={14} strokeWidth={1.5} />
            </button>
          </div>
        )}

        {inCart && !soldOut ? (
          <Button variant="cart" href="/cart" className="flex-1">
            Go to Cart
          </Button>
        ) : (
          <Button
            type="button"
            variant="cart"
            disabled={soldOut}
            onClick={() => {
              addItem({ slug, name: productName, price, image, stock }, quantity);
              setJustAdded(true);
            }}
            className="flex-1"
          >
            {soldOut ? "Sold Out" : "Add to Cart"}
          </Button>
        )}

        <button
          type="button"
          onClick={() => toggleItem({ slug, name: productName, price, image, hoverImage })}
          aria-label={wishlisted ? `Remove ${productName} from wishlist` : `Add ${productName} to wishlist`}
          aria-pressed={wishlisted}
          className="cursor-pointer flex h-13 w-13 shrink-0 items-center justify-center self-start border border-neutral-100 text-brown transition-colors hover:border-brown sm:self-auto"
        >
          <Heart size={18} strokeWidth={1.5} fill={wishlisted ? "currentColor" : "none"} />
        </button>
      </div>
      {/* Only when the real limit is below the flat cap — otherwise "only 9 left" reads as scarcity
          theatre on a piece that has 50 in stock.

          Deliberately a bordered, tinted strip rather than a line of text: at the previous 14px
          regular weight it sat quietly under the buttons and customers scrolled straight past the
          one fact that should change their mind. It still uses the terracotta token rather than a
          generic alert red, so it reads as part of the brand rather than a browser warning. */}
      {!soldOut && stock !== undefined && stock < MAX_QUANTITY && (
        <p
          role="status"
          className="mt-4 flex items-center gap-2.5 border border-terracotta/40 bg-terracotta/8 px-4 py-3 font-body text-base font-semibold text-terracotta"
        >
          <TriangleAlert size={17} strokeWidth={1.8} className="shrink-0" />
          Only {stock} {stock === 1 ? "piece" : "pieces"} left
        </p>
      )}
      <p role="status" aria-live="polite" className="sr-only">
        {justAdded ? `Added ${quantity} × ${productName} to cart` : ""}
      </p>
    </div>
  );
}
