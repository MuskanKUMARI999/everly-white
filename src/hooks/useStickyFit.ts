"use client";

import { useLayoutEffect, useRef, useState } from "react";

const BOTTOM_GAP = 24;

/**
 * A sticky pane taller than the viewport gets stuck at `baseTop` with its overflow
 * unreachable. Rather than driving it with a scroll listener (which fights the browser's
 * native, compositor-only sticky positioning and reads as janky/slow), this precomputes a
 * negative `top` — once, and again whenever content or viewport size changes — so the whole
 * pane fits on screen while stuck. Scrolling itself stays 100% native CSS sticky, so it's as
 * smooth as the browser can make it. This is the same technique theoddative.com's PDP uses.
 */
export function useStickyFit(baseTop: number) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [top, setTop] = useState(baseTop);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const recalc = () => {
      const available = window.innerHeight - baseTop - BOTTOM_GAP;
      const overflow = el.scrollHeight - available;
      setTop(overflow > 0 ? baseTop - overflow : baseTop);
    };

    recalc();
    const observer = new ResizeObserver(recalc);
    observer.observe(el);
    window.addEventListener("resize", recalc);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", recalc);
    };
  }, [baseTop]);

  return { ref, top };
}
