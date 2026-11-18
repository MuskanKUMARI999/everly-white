import {
  Award,
  CircleCheck,
  Clock,
  Feather,
  Flower,
  Gem,
  Gift,
  Hand,
  Heart,
  Home,
  Leaf,
  Moon,
  Package,
  Palette,
  Recycle,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Truck,
  type LucideIcon,
} from "lucide-react";

/**
 * The icons an admin can pick for a homepage feature or trust-bar promise.
 *
 * Deliberately a fixed list rather than "any lucide name": the icon set is tree-shaken at build
 * time, so a name typed into a form could never resolve to a component that was actually bundled.
 * A dropdown of what exists is honest about that, and the labels describe the picture rather than
 * naming the library's export.
 */
export const CONTENT_ICONS: { name: string; label: string; Icon: LucideIcon }[] = [
  { name: "Clock", label: "Clock", Icon: Clock },
  { name: "Star", label: "Star", Icon: Star },
  { name: "Feather", label: "Feather", Icon: Feather },
  { name: "CircleCheck", label: "Check in a circle", Icon: CircleCheck },
  { name: "Hand", label: "Hand", Icon: Hand },
  { name: "Truck", label: "Delivery truck", Icon: Truck },
  { name: "Award", label: "Award", Icon: Award },
  { name: "Heart", label: "Heart", Icon: Heart },
  { name: "Gift", label: "Gift", Icon: Gift },
  { name: "Sparkles", label: "Sparkles", Icon: Sparkles },
  { name: "Leaf", label: "Leaf", Icon: Leaf },
  { name: "Flower", label: "Flower", Icon: Flower },
  { name: "ShieldCheck", label: "Shield", Icon: ShieldCheck },
  { name: "Package", label: "Package", Icon: Package },
  { name: "Palette", label: "Palette", Icon: Palette },
  { name: "Gem", label: "Gem", Icon: Gem },
  { name: "Moon", label: "Moon", Icon: Moon },
  { name: "Sun", label: "Sun", Icon: Sun },
  { name: "Home", label: "House", Icon: Home },
  { name: "Recycle", label: "Recycle", Icon: Recycle },
];

const ICONS_BY_NAME: Record<string, LucideIcon> = Object.fromEntries(
  CONTENT_ICONS.map((entry) => [entry.name, entry.Icon]),
);

export const DEFAULT_CONTENT_ICON = "Sparkles";

interface ContentIconProps {
  name: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ContentIcon({ name, size = 28, strokeWidth = 1.3, className }: ContentIconProps) {
  // An unknown or blank name still renders something — a feature bullet missing its icon would
  // otherwise collapse the row's alignment against its neighbours.
  const Icon = ICONS_BY_NAME[name] ?? ICONS_BY_NAME[DEFAULT_CONTENT_ICON];
  return <Icon size={size} strokeWidth={strokeWidth} className={className} />;
}
