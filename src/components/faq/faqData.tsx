import type { ReactNode } from "react";
import Link from "next/link";

export interface FaqItem {
  question: string;
  answer: ReactNode;
}

export interface FaqCategory {
  category: string;
  items: FaqItem[];
}

export const faqCategories: FaqCategory[] = [
  {
    category: "Our Craft",
    items: [
      {
        question: "Where is your product made?",
        answer:
          "All of our pieces are handmade and curated in small batches within our Mumbai & Guwahati studios. We're proud that 80% of our product and materials are locally sourced within India.",
      },
      {
        question: "How do I care for my product?",
        answer:
          "Wipe gently with a soft, dry cloth. Avoid water, harsh chemicals, and direct sunlight for extended periods, as these can affect the hand-finished surface and mirror inlay. As this item is fragile, please handle it with care, just as you would any glassware.",
      },
      {
        question: "Is your process friendly to the environment?",
        answer:
          "Yes. We work in small batches to avoid overproduction, source the majority of our materials locally, and pack every order in recyclable, plastic-free materials wherever possible.",
      },
      {
        question: "Do you take custom orders?",
        answer: (
          <>
            We do. From size to finish to mirror pattern, our studio welcomes bespoke
            commissions for those seeking something made entirely for them. Please feel
            free to reach out to us via our{" "}
            <Link href="/contact" className="text-brown underline hover:no-underline">
              contact page
            </Link>
            .
          </>
        ),
      },
    ],
  },
  {
    category: "Orders & Shipping",
    items: [
      {
        question: "How do I place an order?",
        answer:
          "Browse our collection, add your chosen pieces to the cart, and check out securely online. You'll receive an order confirmation by email the moment your purchase is complete.",
      },
      {
        question: "What payment methods do you accept?",
        answer:
          "We accept all major credit and debit cards, UPI, and net banking. All transactions are encrypted and processed through a secure payment gateway.",
      },
      {
        question: "How long does delivery take?",
        answer:
          "Most orders arrive within 8–10 business days. Bespoke and made-to-order pieces may take longer, as each one is handcrafted after your order is placed — we'll share an estimated timeline at checkout.",
      },
      {
        question: "Is shipping really free?",
        answer: (
          <>
            Yes. We offer complimentary shipping on all orders across India, with no
            minimum order value. For all orders outside India, please reach out to us
            via{" "}
            <a
              href="https://wa.me/message/OEJJOG6DF762J1"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brown underline hover:no-underline"
            >
              WhatsApp
            </a>
            .
          </>
        ),
      },
      {
        question: "How can I track my order?",
        answer:
          "Once your order ships, you'll receive a tracking link by email so you can follow its journey to your door.",
      },
    ],
  },
  {
    category: "Returns & Packaging",
    items: [
      {
        question: "What is your return policy?",
        answer: (
          <>
            Considering the time and effort that goes into the production of each item,
            we do not offer returns, exchanges, or cancellations once a purchase is
            made. Exact sizing and details are listed in every product description, so
            please review images and descriptions carefully before ordering — every
            piece is also checked by our quality team before it ships. See our full{" "}
            <Link href="/return" className="text-brown underline hover:no-underline">
              return policy
            </Link>{" "}
            for details.
          </>
        ),
      },
      {
        question: "My piece arrived damaged — what do I do?",
        answer:
          "Register a complaint within 24 hours of delivery via our contact page. To be eligible for a refund or replacement, record a video of opening the package showing the defective or missing item, and share your order number along with the video — our team will respond within 2–5 working days.",
      },
      {
        question: "Can I exchange a piece for a different design?",
        answer:
          "We're unable to offer exchanges, as exact sizing and details are listed in every product description and each piece is checked for defects before it ships. If your piece arrives damaged or defective, we'll make it right — see our return policy for how to register a complaint.",
      },
      {
        question: "How are the pieces packaged?",
        answer:
          "Every piece is hand-wrapped and cushioned in our signature packaging, designed to protect delicate mirror work and handcrafted details in transit.",
      },
    ],
  },
  {
    category: "Discounts",
    items: [
      {
        question: "Do you offer a discount for first-time customers?",
        answer:
          "Yes — first-time customers get 5% off their first order. Use code WELCOME5 at checkout to apply the discount.",
      },
      {
        question: "Do you run seasonal sales or offers?",
        answer:
          "We occasionally run limited-time offers around festive and seasonal moments. Subscribe to our newsletter or follow us on Instagram to hear about them first.",
      },
      {
        question: "Can discount codes be combined with other offers?",
        answer:
          "Only one discount code can be applied per order, and codes cannot be combined with other active promotions.",
      },
    ],
  },
];
