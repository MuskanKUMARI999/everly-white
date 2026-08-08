import type { Metadata } from "next";
import { CartPageContent } from "@/components/cart/CartPageContent";

export const metadata: Metadata = {
  title: "Shopping Cart",
  description: "Review the pieces in your Everly White cart before checkout.",
};

export default function CartPage() {
  return <CartPageContent />;
}
