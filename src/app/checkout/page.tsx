import type { Metadata } from "next";
import { CheckoutContent } from "@/components/checkout/CheckoutContent";
import { getCurrentUser, getCurrentProfile } from "@/lib/auth/actions";
import { getAddressesByUser } from "@/lib/data/addresses";
import { getRazorpayConfig } from "@/lib/checkout/razorpay";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your Everly White order.",
};

export default async function CheckoutPage() {
  // Checkout is deliberately open to guests, so "no user" is a normal path here — it just means
  // there is nothing to prefill and the blank form renders exactly as it did before.
  const user = await getCurrentUser();
  const [profile, savedAddresses] = user
    ? await Promise.all([getCurrentProfile(), getAddressesByUser(user.id)])
    : [null, []];

  // Whether real payments are wired has to be answered by the server, which is the only side that
  // can see the keys. Test-mode keys count as configured: Razorpay still opens a real payment
  // window, it just doesn't move money.
  const paymentsConfigured = getRazorpayConfig() !== null;

  return (
    <CheckoutContent
      paymentsConfigured={paymentsConfigured}
      savedAddresses={savedAddresses}
      contact={{
        email: user?.email ?? "",
        fullName: profile?.full_name ?? "",
        phone: profile?.phone ?? "",
      }}
    />
  );
}
