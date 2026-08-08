import Image from "next/image";
import type { ReactNode } from "react";
import { CollectionEyebrow as Eyebrow } from "@/components/collection/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}

// Fills exactly the viewport below the minimal auth header (no scrolling), with every gap/margin/font-size
// expressed as a vh-based clamp so it scales down smoothly on short viewports instead of relying on fixed
// breakpoint values that could still overflow on some screen size.
export function AuthShell({ eyebrow, title, subtitle, children }: AuthShellProps) {
  return (
    <section className="h-[calc(100dvh-58px)] sm:h-[calc(100dvh-65px)] lg:grid lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <Image
          src="/images/banners/hero-1.png"
          alt="Everly White mirror-work decor plates styled in a sunlit interior"
          fill
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/10 to-transparent" />
        <div className="relative z-10 flex h-full flex-col justify-end p-[clamp(1.25rem,4vh,2.5rem)]">
          <Eyebrow>Everly White</Eyebrow>
          <h2 className="mt-3 max-w-[16ch] font-heading text-[clamp(1.25rem,3.5vh,2.25rem)] font-light text-beige-light">
            Come Home To Your Soulmate
          </h2>
        </div>
      </div>

      <div className="flex h-full items-center justify-center overflow-y-auto px-6 py-[clamp(0.5rem,2vh,1.5rem)] sm:px-10 lg:px-12">
        <Reveal className="w-full max-w-105">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="mt-[clamp(0.125rem,0.6vh,0.5rem)] font-heading text-[clamp(1.25rem,3.2vh,1.875rem)] font-light text-neutral-500">
            {title}
          </h1>
          <p className="mt-[clamp(0.125rem,0.6vh,0.5rem)] font-body text-[clamp(0.75rem,1.6vh,0.875rem)] text-neutral-400">
            {subtitle}
          </p>

          <div className="mt-[clamp(0.5rem,2vh,1.25rem)]">{children}</div>
        </Reveal>
      </div>
    </section>
  );
}
