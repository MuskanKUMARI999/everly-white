// Shared by the server actions and the client context, so it can't live in either of them.
export interface WishlistItem {
  slug: string;
  name: string;
  price: number;
  image: string;
  hoverImage?: string;
  /** Carried so a flagship piece keeps its badge on the wishlist grid, not just in the catalogue. */
  isFlagship?: boolean;
}
