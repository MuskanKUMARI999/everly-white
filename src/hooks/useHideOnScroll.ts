"use client";

import { useEffect, useRef, useState } from "react";

// Ignore movement smaller than this before flipping direction: trackpads and phone momentum
// scrolling emit tiny opposite-sign deltas, which without a threshold makes the bar flicker.
// The leftover distance is not discarded — `lastY` only advances once the threshold is cleared,
// so slow deliberate scrolling still accumulates to a flip.
const DIRECTION_THRESHOLD = 8;

// Above this offset the bar is always shown, so the top of the page never opens mid-animation
// and iOS rubber-band overscroll (negative scrollY) can't leave it hidden.
const ALWAYS_VISIBLE_ABOVE = 120;

/**
 * Hide-on-scroll-down, reveal-on-scroll-up for a `sticky top-0` bar.
 *
 * Used on the product page, where the gallery is the point: a pinned header sat over the top of
 * every image as you scrolled the stack. Returns whether the bar should currently be translated
 * out of view; the caller keeps it sticky and animates the transform.
 *
 * Pass `enabled: false` to pin the bar open (other routes, or while a menu/search panel inside it
 * is expanded — sliding those off-screen mid-interaction would be worse than the overlap).
 */
export function useHideOnScroll(enabled: boolean) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  // React's adjust-state-during-render pattern rather than a reset inside the effect: whenever
  // the hook is switched off (and again when it comes back on, e.g. leaving and re-entering a
  // product page) the bar must start visible, and doing that here avoids rendering one frame
  // with a stale hidden value before an effect could correct it.
  const [lastEnabled, setLastEnabled] = useState(enabled);
  if (lastEnabled !== enabled) {
    setLastEnabled(enabled);
    setHidden(false);
  }

  useEffect(() => {
    if (!enabled) return;

    lastY.current = window.scrollY;
    let frame = 0;

    const onScroll = () => {
      // Scroll fires far more often than the screen refreshes; coalesce to one read per frame.
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        const delta = y - lastY.current;

        if (y <= ALWAYS_VISIBLE_ABOVE) {
          lastY.current = y;
          setHidden(false);
          return;
        }
        if (Math.abs(delta) < DIRECTION_THRESHOLD) return;

        lastY.current = y;
        setHidden(delta > 0);
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [enabled]);

  return hidden;
}
