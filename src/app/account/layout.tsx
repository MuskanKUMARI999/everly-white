import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentProfile } from "@/lib/auth/actions";
import { getWishlistCount } from "@/lib/data/wishlist";
import { AccountShell } from "@/components/account/AccountShell";

// Guards the whole /account section in one place, so each page below can assume a signed-in user.
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [profile, wishlistCount] = await Promise.all([
    getCurrentProfile(),
    getWishlistCount(user.id),
  ]);

  return (
    <AccountShell
      identity={{
        name: profile?.full_name ?? user.email ?? "Your Account",
        email: user.email ?? "",
      }}
      wishlistCount={wishlistCount}
    >
      {children}
    </AccountShell>
  );
}
