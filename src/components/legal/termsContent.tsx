import Link from "next/link";
import type { LegalSection } from "@/components/legal/LegalLayout";

export const termsIntro = "Please read these terms and conditions carefully before using our service.";

export const termsSections: LegalSection[] = [
  {
    heading: "Shipping & Delivery",
    body: (
      <>
        <p>
          Any buyer at www.everlywhite.com agrees and understands that each item includes tax, shipping,
          and handling fees, applied at checkout. All orders are shipped with India Post. All orders have
          a processing time of 5–6 business days after the order has been placed; orders placed after
          11am IST will be processed from the following day.
        </p>
        <p>
          Any delays are the responsibility of www.everlywhite.com to contact and inform the customer.
          All orders do not have a guaranteed delivery time once the item has been shipped — we take no
          responsibility for delays caused by India Post after the item has left our studio.
        </p>
      </>
    ),
  },
  {
    heading: "Order Tracking",
    body: (
      <>
        <p>
          All orders will have tracking information provided, however the buyer withholds all buyer
          responsibilities after the order has left our studio. For any packages that are deemed lost,
          stolen, or damaged during delivery, the buyer will need to contact India Post directly to create
          a claim or raise a dispute, and not www.everlywhite.com.
        </p>
        <p>
          In the case of any order that has proof of shipping via the tracking number, but the buyer is
          unable to locate their order, www.everlywhite.com is not responsible and will not offer a credit
          or refund. The products covered by each contract (i.e. accepted order) are at your risk upon
          delivery of the order to the carrier. www.everlywhite.com cannot be held responsible for late or
          missing deliveries.
        </p>
      </>
    ),
  },
  {
    heading: "Damaged Products",
    body: (
      <p>
        For all orders that are damaged or broken during the delivery process, please contact{" "}
        <a
          href="mailto:info@everlywhite.com"
          className="text-brown underline decoration-pink-300 underline-offset-4"
        >
          info@everlywhite.com
        </a>{" "}
        and we will work on arranging a refund or replacement. Packages that are deemed refused or
        returned by India Post will be subject to our restocking fee of 10% per item. As a dedicated
        design studio, this 10% is factored into the time, labour, and materials that contribute to
        fulfilling an order.
      </p>
    ),
  },
  {
    heading: "Website Images",
    body: (
      <>
        <p>
          Any buyer at www.everlywhite.com agrees and understands that every item is handmade and that
          each piece will have minor bubbles and variations in colour, which are all part of the natural
          process and not deemed a fault. Due to this, all items are final sale.
        </p>
        <p>
          Despite every effort to provide accurate images of each product&rsquo;s colour, texture, and
          design, actual colours and design may vary slightly due to different device screen settings,
          lighting, slight differences in product finishes over time, and other factors. Everly White
          studios will not accept responsibility for any colour or design differences that are not faults.
        </p>
        <p>
          Any returns for a product due to customer dissatisfaction with a finish (that is not a fault)
          will need to comply with our returns policy — all items are final sale and will only be accepted
          for return if the product arrives broken or damaged.
        </p>
      </>
    ),
  },
  {
    heading: "Intellectual Property",
    body: (
      <p>
        At Everly White studios, we take great pride in the originality and quality of the images featured
        on our website. All images are created exclusively by our talented team and are the intellectual
        property of Everly White studios. As such, these images are protected under Indian copyright law
        and cannot be used, reproduced, or distributed without our explicit permission. Unauthorised use of
        our copyrighted images can lead to legal action, including potential fines and the requirement to
        remove the infringing content. If you have any questions or wish to request permission to use our
        images, please contact us directly.
      </p>
    ),
  },
  {
    heading: "Privacy Policy",
    body: (
      <p>
        Everly White studios is committed to protecting the privacy and security of our customers and
        visitors to our online store. Learn more about how we collect, use, and share your personal
        information in our full{" "}
        <Link href="/privacy" className="text-brown underline decoration-pink-300 underline-offset-4">
          Privacy Policy
        </Link>
        .
      </p>
    ),
  },
  {
    heading: "Loyalty Program",
    body: (
      <>
        <p>
          <strong className="font-semibold text-neutral-500">Eligibility.</strong> The Everly White
          loyalty program is open to all registered customers who make a purchase on our website. Rewards
          are non-transferable and cannot be exchanged for cash.
        </p>
        <p>
          <strong className="font-semibold text-neutral-500">Account Expiration.</strong> Loyalty points
          may expire if there is no account activity for 12 months. Everly White studios reserves the
          right to remove unused points if your account becomes inactive for a prolonged period.
        </p>
        <p>
          <strong className="font-semibold text-neutral-500">Program Modifications.</strong> Everly White
          studios reserves the right to modify or cancel the loyalty program at any time. If changes
          occur, participants will be notified by email or through our loyalty program provider.
        </p>
        <p>
          <strong className="font-semibold text-neutral-500">Non-Transferability.</strong> Points,
          rewards, and discounts earned through the loyalty program are non-transferable and cannot be
          sold, exchanged, or combined with any other offer unless explicitly stated.
        </p>
        <p>
          <strong className="font-semibold text-neutral-500">Returns & Cancellations.</strong> If a
          purchase made with loyalty points is returned, the points will be deducted from your account.
          Discounts earned through the referral program are not refundable.
        </p>
        <p>
          <strong className="font-semibold text-neutral-500">Abuse of the Program.</strong> Everly White
          studios reserves the right to suspend or terminate the accounts of customers who engage in
          fraudulent or abusive behaviour, including but not limited to manipulating the referral system
          or earning points through illegitimate means.
        </p>
      </>
    ),
  },
  {
    heading: "Contact Us",
    body: (
      <p>
        If you have any questions about the above, please contact{" "}
        <a
          href="mailto:info@everlywhite.com"
          className="text-brown underline decoration-pink-300 underline-offset-4"
        >
          info@everlywhite.com
        </a>
        .
      </p>
    ),
  },
];
