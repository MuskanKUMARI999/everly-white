import type { Metadata } from "next";
import { CollectionEyebrow as Eyebrow } from "@/components/collection/Eyebrow";
import { TrackOrderForm } from "@/components/orders/TrackOrderForm";

export const metadata: Metadata = {
  title: "Track Your Order — Everly White",
  description: "Look up an Everly White order using your order number and email address.",
};

export default function TrackOrderPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-16 sm:px-10 sm:py-24">
      <div className="text-center">
        <Eyebrow>Order Tracking</Eyebrow>
        <h1 className="mt-3 font-heading text-3xl font-light text-neutral-500 sm:text-4xl">
          Track Your Order
        </h1>
        <p className="mx-auto mt-3 max-w-md font-body text-neutral-400">
          Enter your order number and the email you used at checkout to see your order status.
        </p>
      </div>

      <div className="mt-10">
        <TrackOrderForm />
      </div>
    </main>
  );
}
