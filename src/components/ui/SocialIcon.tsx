import {
  FaEnvelope,
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaPinterestP,
  FaThreads,
  FaTiktok,
  FaWhatsapp,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import type { IconType } from "react-icons";

/**
 * The platforms an admin can pick for an editable social link.
 *
 * Separate from CONTENT_ICONS for the same reason that list is a fixed set rather than "any lucide
 * name" — the bundle only contains what is imported here — and because the two sets answer
 * different questions. A trust-bar promise wants a picture (a truck, a leaf); a social link wants a
 * brand mark, and mixing the two would offer "Instagram" as an option for a core value.
 */
export const SOCIAL_ICONS: { name: string; label: string; Icon: IconType }[] = [
  { name: "Instagram", label: "Instagram", Icon: FaInstagram },
  { name: "Threads", label: "Threads", Icon: FaThreads },
  { name: "WhatsApp", label: "WhatsApp", Icon: FaWhatsapp },
  { name: "Facebook", label: "Facebook", Icon: FaFacebookF },
  { name: "Pinterest", label: "Pinterest", Icon: FaPinterestP },
  { name: "YouTube", label: "YouTube", Icon: FaYoutube },
  { name: "TikTok", label: "TikTok", Icon: FaTiktok },
  { name: "X", label: "X (Twitter)", Icon: FaXTwitter },
  { name: "LinkedIn", label: "LinkedIn", Icon: FaLinkedinIn },
  { name: "Email", label: "Email", Icon: FaEnvelope },
];

const ICONS_BY_NAME: Record<string, IconType> = Object.fromEntries(
  SOCIAL_ICONS.map((entry) => [entry.name, entry.Icon]),
);

export const DEFAULT_SOCIAL_ICON = "Instagram";

interface SocialIconProps {
  name: string;
  size?: number;
  className?: string;
}

export function SocialIcon({ name, size = 14, className }: SocialIconProps) {
  // As with ContentIcon: an unknown or blank name still renders a mark, so a link whose icon was
  // never picked stays the same size as the buttons beside it instead of collapsing the row.
  const Icon = ICONS_BY_NAME[name] ?? ICONS_BY_NAME[DEFAULT_SOCIAL_ICON];
  return <Icon size={size} className={className} />;
}
