import { Percent, Sparkles, Truck, Award, type LucideIcon } from "lucide-react";

const perks: { Icon: LucideIcon; label: string }[] = [
  { Icon: Percent, label: "5% Off Your First Order" },
  { Icon: Sparkles, label: "Hand-Set Mirror Inlay" },
  { Icon: Truck, label: "Free Shipping Across India" },
  { Icon: Award, label: "Small-Batch, Limited Edition" },
];

export function ProductPerks() {
  return (
    <div className="mt-6 grid grid-cols-2 gap-4 border border-neutral-100 bg-beige-light p-5">
      {perks.map(({ Icon, label }) => (
        <div key={label} className="flex items-center gap-2.5">
          <Icon size={18} strokeWidth={1.4} className="shrink-0 text-brown" />
          <span className="font-body text-[13px] leading-snug text-neutral-400">{label}</span>
        </div>
      ))}
    </div>
  );
}
