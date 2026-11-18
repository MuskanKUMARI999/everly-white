"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { shouldSuppressWelcomePopup } from "./chromeRoutes";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { inputClasses } from "@/components/ui/inputStyles";
import { subscribeToNewsletter } from "@/lib/newsletter/actions";
import { WELCOME_CODE } from "@/lib/newsletter/welcomeOffer";
import { INDIA_PHONE_DIGITS } from "@/components/ui/countryCodes";

const EASE = [0.22, 1, 0.36, 1] as const;
const STORAGE_KEY = "ew-welcome-popup-last-shown";
const SHOW_AGAIN_AFTER_MS = 24 * 60 * 60 * 1000;
const OPEN_DELAY_MS = 8000;

export function WelcomePopup() {
  const pathname = usePathname();
  const suppressed = shouldSuppressWelcomePopup(pathname);
  const [isOpen, setIsOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "success">("idle");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Depends on `suppressed`, not [] — this component is mounted once by the root layout and
  // survives every client-side navigation, so with an empty dep list a timer armed on the homepage
  // would still fire 8s later on /checkout, and landing directly on /checkout armed it there.
  // Re-running only when `suppressed` flips keeps browse-to-browse navigation from re-arming it.
  useEffect(() => {
    // No timer is armed on a suppressed route. Nothing needs closing here either: the render below
    // gates on `!suppressed`, and the open modal covers the viewport, so a customer can't navigate
    // out from under it without dismissing it first.
    if (suppressed) return;

    const lastShown = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    const dueToShow = Date.now() - lastShown > SHOW_AGAIN_AFTER_MS;
    if (!dueToShow) return;

    const timer = setTimeout(() => {
      // Only stamped once the popup is actually shown. Arming and stamping on a suppressed route
      // would silently burn the 24h window on a customer who never saw it.
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
      setIsOpen(true);
    }, OPEN_DELAY_MS);

    return () => clearTimeout(timer);
  }, [suppressed]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!firstName.trim() || !email.trim()) {
      setError("Please fill in your name and email.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    // Phone is optional here, but a partly typed one is a mistake worth catching.
    if (phone && phone.length !== INDIA_PHONE_DIGITS) {
      setError(`Please enter a valid ${INDIA_PHONE_DIGITS}-digit phone number.`);
      return;
    }

    setIsSubmitting(true);
    const result = await subscribeToNewsletter(email, { firstName, lastName, phone });
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    setStatus("success");
  }

  return (
    <AnimatePresence>
      {/* `!suppressed` here as well as in the effect: effects run after paint, so state alone would
          let the modal flash for a frame over checkout during a client-side navigation. */}
      {isOpen && !suppressed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 sm:p-6"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Welcome offer"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            className="relative grid max-h-[90vh] w-full max-w-md grid-cols-1 overflow-y-auto border border-neutral-100 bg-beige-light shadow-[0_20px_60px_rgba(0,0,0,0.2)] sm:max-w-3xl sm:grid-cols-2"
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setIsOpen(false)}
              className="cursor-pointer absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center bg-white/70 text-neutral-500 backdrop-blur-sm transition-colors hover:text-brown"
            >
              <X size={18} strokeWidth={1.5} />
            </button>

            <div className="relative hidden aspect-4/3 sm:block sm:aspect-auto">
              <Image
                src="/images/instagram/lifestyle-sofa.jpg"
                alt="An Everly White styled living space"
                fill
                sizes="(min-width: 640px) 400px, 100vw"
                className="object-cover"
              />
            </div>

            {status === "success" ? (
              <div className="flex flex-col items-center justify-center p-8 text-center sm:p-10">
                <CheckCircle2 size={40} strokeWidth={1.2} className="text-brown" />
                <h2 className="mt-4 font-heading text-2xl text-neutral-500">You&rsquo;re In</h2>
                <p className="mt-3 max-w-[34ch] font-body text-neutral-300">
                  Use code <span className="font-semibold text-brown">{WELCOME_CODE}</span> at checkout
                  for 5% off your first order.
                </p>
                <Button
                  variant="secondary"
                  icon={false}
                  onClick={() => setIsOpen(false)}
                  className="mt-7"
                >
                  Continue Shopping
                </Button>
              </div>
            ) : (
              <div className="flex flex-col justify-center p-8 sm:p-10">
                <h2 className="text-center font-heading text-2xl leading-snug text-neutral-500 sm:text-[1.75rem]">
                  Just For You — 5% Off
                </h2>
                <p className="mt-3 text-center font-body text-sm text-neutral-300">
                  Join us to receive first access to new arrivals, exclusive offers and more.
                </p>

                <form onSubmit={handleSubmit} noValidate className="mt-7 flex flex-col gap-3">
                  <input
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    aria-label="First name"
                    autoComplete="given-name"
                    className={inputClasses}
                  />
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    aria-label="Last name"
                    autoComplete="family-name"
                    className={inputClasses}
                  />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    aria-label="Email"
                    autoComplete="email"
                    className={inputClasses}
                  />
                  <div className="flex gap-2">
                    <span className="flex shrink-0 items-center gap-1.5 border border-neutral-200 bg-transparent px-3 font-body text-neutral-400">
                      <span aria-hidden="true">🇮🇳</span>
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, INDIA_PHONE_DIGITS))}
                      placeholder="Phone"
                      aria-label="Phone"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      className={`${inputClasses} flex-1`}
                    />
                  </div>

                  {error && <p className="font-body text-sm text-terracotta">{error}</p>}

                  <Button
                    type="submit"
                    variant="primary"
                    icon={false}
                    disabled={isSubmitting}
                    className="mt-1 w-full justify-center disabled:opacity-60"
                  >
                    {isSubmitting ? "Submitting..." : "Yes, please."}
                  </Button>
                </form>

                <p className="mt-4 text-center font-body text-xs leading-relaxed text-neutral-300">
                  By signing up, you agree to receive marketing emails from us. View our{" "}
                  <Link href="/privacy" className="text-brown underline decoration-pink-300 underline-offset-4">
                    privacy policy
                  </Link>{" "}
                  and{" "}
                  <Link href="/terms" className="text-brown underline decoration-pink-300 underline-offset-4">
                    terms of service
                  </Link>{" "}
                  for more info. Unsubscribe at any time.
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
