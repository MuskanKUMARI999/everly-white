"use client";

import type { ReactNode } from "react";
import { useStickyFit } from "@/hooks/useStickyFit";

const BASE_TOP = 96; // matches top-24

export function StickyPane({ className = "", children }: { className?: string; children: ReactNode }) {
  const { ref, top } = useStickyFit(BASE_TOP);
  return (
    <div ref={ref} style={{ top }} className={`lg:sticky ${className}`}>
      {children}
    </div>
  );
}
