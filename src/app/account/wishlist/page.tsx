import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/actions";
import { getWishlistItems } from "@/lib/data/wishlist";
import { WishlistContent } from "@/components/account/WishlistContent";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Pieces you've saved to come back to later.",
};

export default async function AccountWishlistPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Fetched here as well as in the client store so the saved pieces are in the first paint —
  // otherwise the page renders its empty state for a beat before the store catches up.
  const items = await getWishlistItems(user.id);

  return <WishlistContent initialItems={items} />;
}
