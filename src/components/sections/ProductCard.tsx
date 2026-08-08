"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { Check, Heart, ShoppingBag } from "lucide-react";
import { formatPrice, productSlug } from "@/components/sections/productFormat";
import { useCart } from "@/components/cart/CartContext";
import { useWishlist } from "@/components/wishlist/WishlistContext";

interface ProductCardProps {
  name: string;
  /** The product's stored slug. Callers spread a CatalogProduct, so this arrives automatically. */
  slug?: string;
  price: number;
  image: string;
  hoverImage?: string;
  /**
   * Wishlist heart in the top-right corner. Off on the homepage, which is a shopfront rather
   * than a place to browse and save; on everywhere a customer is actively shopping.
   */
  showWishlist?: boolean;
  /** Set by the "Flagship" checkbox in Admin → Products. */
  isFlagship?: boolean;
}

export function ProductCard({
  name,
  slug: storedSlug,
  price,
  image,
  hoverImage,
  showWishlist = true,
  isFlagship = false,
}: ProductCardProps) {
  const slug = productSlug({ slug: storedSlug, name });
  const href = `/products/${slug}`;
  const { addItem, items } = useCart();
  const inCart = items.some((item) => item.slug === slug);
  const { isWishlisted, toggleItem } = useWishlist();
  const wishlisted = isWishlisted(slug);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!justAdded) return;
    const timeout = setTimeout(() => setJustAdded(false), 2000);
    return () => clearTimeout(timeout);
  }, [justAdded]);

  return (
    <div className="group relative bg-beige-light">
      <Link href={href} className="block" tabIndex={-1} aria-hidden="true">
        <div className="relative aspect-square w-full overflow-hidden">
          <Image
            src={image}
            alt={name}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className={`object-cover transition-[opacity,transform] duration-500 group-hover:scale-104 ${
              hoverImage ? "group-hover:opacity-0" : ""
            }`}
          />
          {hoverImage && (
            <Image
              src={hoverImage}
              alt=""
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-cover opacity-0 transition-[opacity,transform] duration-500 group-hover:scale-104 group-hover:opacity-100"
            />
          )}
        </div>
      </Link>

      {isFlagship && (
        <span className="absolute left-2.5 top-2.5 z-10 bg-pink-100 px-3 py-1 font-heading text-[11px] uppercase tracking-[0.15em] text-brown">
          Flagship
        </span>
      )}

      {showWishlist && (
        <motion.button
          type="button"
          whileTap={{ scale: 0.85 }}
          onClick={() => toggleItem({ slug, name, price, image, hoverImage })}
          aria-label={wishlisted ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
          aria-pressed={wishlisted}
          className={`absolute right-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-brown transition-opacity duration-300 ${
            wishlisted ? "opacity-100" : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          }`}
        >
          <Heart size={13} strokeWidth={1.5} fill={wishlisted ? "currentColor" : "none"} />
        </motion.button>
      )}

      <div className="flex items-center justify-between gap-3 bg-neutral-50 px-5 py-5">
        <Link href={href} className="min-w-0">
          <p className="truncate font-body text-lg font-medium text-neutral-500">{name}</p>
          <p className="mt-2 font-body text-sm text-neutral-400">{formatPrice(price)}</p>
        </Link>

        {/* Once the piece is in the bag this stops being an add control and becomes the way
            through to the cart — same rule as the product page's Add to Cart button. */}
        {inCart ? (
          <Link
            href="/cart"
            aria-label={`${name} is in your cart — go to cart`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brown bg-brown text-beige-light transition-colors duration-300 hover:border-neutral-500 hover:bg-neutral-500"
          >
            <motion.span
              initial={{ scale: 0.4, opacity: 0, rotate: -45 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.18 }}
              className="flex"
            >
              <Check size={15} strokeWidth={1.5} />
            </motion.span>
          </Link>
        ) : (
          <motion.button
            type="button"
            whileTap={{ scale: 0.8 }}
            onClick={() => {
              addItem({ slug, name, price, image });
              setJustAdded(true);
            }}
            aria-label="Add to cart"
            className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-brown/30 text-brown transition-colors duration-300 hover:bg-brown hover:text-beige-light"
          >
            <ShoppingBag size={15} strokeWidth={1.5} />
          </motion.button>
        )}
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {justAdded ? `Added ${name} to cart` : ""}
      </p>
    </div>
  );
}
