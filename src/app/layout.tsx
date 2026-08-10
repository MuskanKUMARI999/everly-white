import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Cinzel, EB_Garamond } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/components/cart/CartContext";
import { WishlistProvider } from "@/components/wishlist/WishlistContext";
import { getCurrentUser } from "@/lib/auth/actions";
import { getNavCollections } from "@/lib/data/navigation";
import { qualifiesForWelcomeOffer } from "@/lib/newsletter/welcomeEligibility";
import { siteUrl } from "@/lib/site";
import "./globals.css";

// Deferred: the welcome popup's JS isn't needed for first paint — it only appears after a delay.
const WelcomePopup = dynamic(() =>
  import("@/components/layout/WelcomePopup").then((m) => m.WelcomePopup),
);

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  // Read from siteUrl() rather than hardcoded, so the canonical origin advertised to Google and
  // to social scrapers can never disagree with the one in the sitemap, robots.txt and email links.
  // Hardcoding it meant a deploy could ship a sitemap on one origin and canonical tags on another,
  // which search engines treat as two sites splitting one ranking.
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Everly White — Cosmic Luxe Home Decor",
    template: "%s | Everly White",
  },
  description:
    "Handcrafted mirror-work decor plates for a cosmic luxe lifestyle. Bold minimalism, timeless artistry — come home to your soulmate.",
  openGraph: {
    title: "Everly White — Cosmic Luxe Home Decor",
    description:
      "Handcrafted mirror-work decor plates for a cosmic luxe lifestyle. Bold minimalism, timeless artistry.",
    url: siteUrl(),
    siteName: "Everly White",
    locale: "en_IN",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, navCollections] = await Promise.all([
    getCurrentUser(),
    getNavCollections(),
  ]);

  // "guest" rather than an empty string so signing out is a real change of value, not a fall back
  // to something falsy that a truthiness check might treat as "unchanged".
  const identity = user?.id ?? "guest";

  // Having an account isn't the same as having bought something — someone can register and never
  // order, and they're precisely who a first-order discount is for. So the offer is withdrawn on
  // engagement (ordered or subscribed), not on being signed in. Guests short-circuit to true, so
  // this costs nothing for the majority of visitors.
  const welcomeOfferAvailable = await qualifiesForWelcomeOffer(user?.id, user?.email);

  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${ebGaramond.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* The cart and wishlist stores keep their data in browser memory across in-app
            navigations — including the one that sign-out performs. Handing them the current
            identity lets them notice a sign-in/sign-out/account switch and reload, instead of
            leaving the previous customer's bag on screen until a hard refresh. */}
        <CartProvider identity={identity}>
          <WishlistProvider identity={identity}>
            <Header user={user} collections={navCollections} />
            <div className="flex-1">{children}</div>
            <Footer />
            {welcomeOfferAvailable && <WelcomePopup />}
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
