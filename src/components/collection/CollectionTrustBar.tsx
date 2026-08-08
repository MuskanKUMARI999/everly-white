import { Hand, Truck, Award, type LucideIcon } from "lucide-react";

const trust: { Icon: LucideIcon; title: string; body: string }[] = [
  { Icon: Hand, title: "Handcrafted in India", body: "Every piece shaped by hand, never by machine." },
  { Icon: Truck, title: "Free Shipping", body: "Complimentary delivery across India." },
  { Icon: Award, title: "Limited Edition", body: "Small-batch collections, never mass produced." },
];

export function CollectionTrustBar() {
  return (
    <section className="bg-pink-100 py-14">
      <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
        <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-3">
          {trust.map(({ Icon, title, body }) => (
            <div key={title}>
              <Icon size={26} strokeWidth={1.3} className="mx-auto text-brown" />
              <h4 className="mt-3 font-heading text-[12.5px] uppercase tracking-widest text-neutral-500">
                {title}
              </h4>
              <p className="mt-1.5 font-body text-sm text-neutral-300">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
