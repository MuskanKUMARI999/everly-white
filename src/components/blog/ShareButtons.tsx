"use client";

import { useState } from "react";
import {
  FaFacebookF,
  FaXTwitter,
  FaPinterestP,
  FaEnvelope,
  FaWhatsapp,
  FaInstagram,
} from "react-icons/fa6";

export function ShareButtons({
  postUrl,
  title,
  image,
}: {
  postUrl: string;
  title: string;
  image: string;
}) {
  const [copied, setCopied] = useState(false);

  const links = [
    {
      label: "Share on Facebook",
      Icon: FaFacebookF,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`,
    },
    {
      label: "Share on X",
      Icon: FaXTwitter,
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(title)}`,
    },
    {
      label: "Share on Pinterest",
      Icon: FaPinterestP,
      href: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(postUrl)}&media=${encodeURIComponent(image)}&description=${encodeURIComponent(title)}`,
    },
    {
      label: "Share on WhatsApp",
      Icon: FaWhatsapp,
      href: `https://wa.me/?text=${encodeURIComponent(`${title} ${postUrl}`)}`,
    },
    {
      label: "Share via Email",
      Icon: FaEnvelope,
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(postUrl)}`,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {links.map(({ label, Icon, href }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-100 text-neutral-400 transition-colors hover:border-brown hover:text-brown"
        >
          <Icon size={13} />
        </a>
      ))}

      {/* Instagram has no web share-intent URL — links can't be posted in from outside the app,
          so the closest real equivalent is copying the link to paste into a story/bio/DM. */}
      <div className="relative">
        <button
          type="button"
          aria-label="Copy link to share on Instagram"
          onClick={() => {
            navigator.clipboard.writeText(postUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-full border border-neutral-100 text-neutral-400 transition-colors hover:border-brown hover:text-brown"
        >
          <FaInstagram size={13} />
        </button>
        {copied && (
          <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-neutral-500 px-2 py-1 font-heading text-[10px] uppercase tracking-[0.1em] text-beige-light">
            Link Copied
          </span>
        )}
      </div>
    </div>
  );
}
