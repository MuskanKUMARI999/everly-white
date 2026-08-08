"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/sections/ProductCard";
import { Reveal } from "@/components/ui/Reveal";
import type { CatalogProduct } from "@/components/products/productTypes";

const EASE = [0.22, 1, 0.36, 1] as const;

const tabs = [
  { id: "center", label: "CENTER OF THE UNIVERSE" },
  { id: "soon", label: "(Coming Soon)" },
] as const;

interface CollectionTabsProps {
  products: CatalogProduct[];
}

export function CollectionTabs({ products }: CollectionTabsProps) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("center");

  return (
    <section className="bg-beige-light py-16 sm:py-20">
      <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
        <Reveal className="text-center">
          <p className="font-heading text-xs uppercase tracking-[0.2em] text-neutral-300">
            Dive into the world of Everly White
          </p>
          <h2 className="mx-auto mt-3 max-w-xl font-heading text-3xl font-light leading-snug text-neutral-500 sm:text-4xl">
            Find your calm — discover peace in every piece
          </h2>
        </Reveal>

        <div className="mt-10 flex flex-wrap justify-center gap-4 border-b border-neutral-100 sm:gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`cursor-pointer relative -mb-px border-b-2 border-transparent px-2 pb-4 font-heading text-sm uppercase tracking-[0.12em] transition-colors ${
                activeTab === tab.id ? "text-brown" : "text-neutral-300 hover:text-neutral-500"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.span
                  layoutId="collection-tabs-underline"
                  className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-brown"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="mt-10"
          >
            {activeTab === "center" ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-8 sm:gap-y-12 lg:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.name} {...product} showWishlist={false} />
                ))}
              </div>
            ) : (
              <p className="py-12 text-center font-body text-neutral-300">
                Coming soon.
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-12 flex justify-center">
          <Button href="/collection/center-of-the-universe" variant="secondary">
            Discover More
          </Button>
        </div>
      </div>
    </section>
  );
}
