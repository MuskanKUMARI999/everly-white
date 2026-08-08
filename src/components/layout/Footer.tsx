"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaFacebookF, FaInstagram, FaThreads, FaWhatsapp } from "react-icons/fa6";
import { isAdminRoute, isMinimalChromeRoute } from "./chromeRoutes";

const columns = [
  {
    heading: "Quick Links",
    links: [
      { label: "FAQ", href: "/faqs" },
      { label: "Contact Us", href: "/contact" },
      { label: "Track Order", href: "/track-order" },
      { label: "Order Enquiries", href: "/account/orders" },
    ],
  },
  {
    heading: "Policies",
    links: [
      { label: "Return Policy", href: "/return" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms & Conditions", href: "/terms" },
    ],
  },
  {
    heading: "About Us",
    links: [
      { label: "Our Story", href: "/about" },
      { label: "Blogs", href: "/blog" },
    ],
  },
  {
    heading: "Collections",
    links: [
      { label: "Center of the Universe", href: "/collection/center-of-the-universe" },
      { label: "All Products", href: "/products" },
    ],
  },
];

const socials = [
  {
    label: "Instagram",
    Icon: FaInstagram,
    color: "#E1306C",
    href: "https://www.instagram.com/everlywhitestudios/",
  },
  {
    label: "Facebook",
    Icon: FaFacebookF,
    color: "#1877F2",
    href: "https://www.facebook.com/share/1Et5MhcvZV",
  },
  {
    label: "Threads",
    Icon: FaThreads,
    color: "#000000",
    href: "https://www.threads.net/@everlywhitestudios",
  },
  {
    label: "WhatsApp",
    Icon: FaWhatsapp,
    color: "#25D366",
    href: "https://wa.me/message/OEJJOG6DF762J1",
  },
];

export function Footer() {
  const pathname = usePathname();

  // Auth screens fill the viewport exactly (header + split image/form view) with no footer below.
  // Cart/checkout stay distraction-free too — no footer links pulling shoppers away mid-purchase.
  // Admin is the shop owner's back office and gets no storefront chrome at all.
  if (isMinimalChromeRoute(pathname) || isAdminRoute(pathname)) return null;

  return (
    <footer className="bg-neutral-50">
      <div className="mx-auto max-w-content px-6 py-20 sm:px-10 lg:px-10">
        <Image
          src="/images/logo.png"
          alt="Everly White"
          width={1080}
          height={207}
          className="mx-auto h-auto w-50 sm:w-60"
        />

        <div className="mt-16 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-4 sm:gap-x-10">
          {columns.map((col) => (
            <div key={col.heading}>
              <p className="font-heading text-sm font-semibold text-neutral-500">{col.heading}</p>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="inline-block bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat font-body text-neutral-300 transition-[background-size,color] duration-300 hover:bg-[length:100%_1px] hover:text-brown"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <hr className="mt-16 border-neutral-100" />

        <div className="mt-8 flex justify-center gap-4">
          {socials.map(({ label, Icon, color, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition-transform hover:scale-105"
            >
              <Icon size={16} color={color} />
            </a>
          ))}
        </div>

        <p className="mt-10 text-center font-body text-sm text-neutral-300">
          © {new Date().getFullYear()} Everly White. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
