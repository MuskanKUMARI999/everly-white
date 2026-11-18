"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Box, CheckCircle2, Eye, EyeOff, Star, Zap, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { RequiredField } from "@/components/ui/RequiredField";
import {
  COUNTRY_CODES,
  isValidPhoneDigits,
  phoneDigitsHint,
} from "@/components/ui/countryCodes";
import { signUp, type AuthResult } from "@/lib/auth/actions";

const perks: { Icon: LucideIcon; label: string }[] = [
  { Icon: Box, label: "Order Tracking" },
  { Icon: Star, label: "Early Access" },
  { Icon: Zap, label: "Faster Checkout" },
];

// Padding scales with viewport height (vh) instead of a fixed value, so the full form — including the
// submit button — always fits within the viewport without scrolling, on any screen height.
const compactInputClasses =
  "w-full border border-neutral-200 bg-transparent px-4 py-[clamp(0.375rem,1vh,0.625rem)] font-body text-neutral-500 outline-none transition-colors focus:border-neutral-500 placeholder:text-neutral-200";

// The password rules are checked here, on the client, before signUp() is ever called: the customer
// sees the message the instant they click, with no round trip. signUp() re-checks all of this —
// this is a convenience layer, never the gate.
async function validateThenSignUp(
  prevState: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8) {
    return { success: false, message: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { success: false, message: "Passwords don't match." };
  }

  // The input already caps the length, so this only catches a number left half-typed.
  const phoneIso = String(formData.get("phoneCountry") ?? "");
  const phoneDigits = String(formData.get("phoneNational") ?? "");
  if (!isValidPhoneDigits(phoneIso, phoneDigits)) {
    return {
      success: false,
      message: `Please enter a valid phone number (${phoneDigitsHint(phoneIso)}).`,
    };
  }

  return signUp(prevState, formData);
}

export function SignupForm() {
  const [state, action, isPending] = useActionState(validateThenSignUp, null);
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [countryIso, setCountryIso] = useState("IN");
  const [phone, setPhone] = useState("");

  // Every field is controlled deliberately. React resets an uncontrolled form automatically once a
  // form action settles, which wiped the name, email and phone a customer had already typed every
  // time the action came back with an error. Holding the values in state means a rejected submit
  // leaves the form exactly as they left it, with only the message added.
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // The visible input holds the national number only; the hidden field submitted to signUp
  // prefixes the selected country's dial code so the stored number is unambiguous.
  const dialCode = COUNTRY_CODES.find((c) => c.iso === countryIso)?.dial ?? "";

  if (state?.success) {
    return (
      <div className="flex flex-col items-center border border-neutral-100 bg-pink-100/40 p-10 text-center">
        <CheckCircle2 size={38} strokeWidth={1.3} className="text-brown" />
        <h2 className="mt-4 font-heading text-2xl text-neutral-500">Welcome</h2>
        <p className="mt-3 max-w-[32ch] font-body text-neutral-300">{state.message}</p>
      </div>
    );
  }

  return (
    <>
      <form action={action} noValidate className="flex flex-col gap-[clamp(0.375rem,1.2vh,0.75rem)]">
        <RequiredField>
          <input
            required
            name="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full Name"
            aria-label="Full Name"
            autoComplete="name"
            className={compactInputClasses}
          />
        </RequiredField>

        <RequiredField>
          <input
            required
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            aria-label="Email Address"
            autoComplete="email"
            className={compactInputClasses}
          />
        </RequiredField>

        <PhoneInput
          countryIso={countryIso}
          onCountryIsoChange={setCountryIso}
          number={phone}
          onNumberChange={setPhone}
          inputClassName={compactInputClasses}
        />
        <input type="hidden" name="phone" value={phone ? `${dialCode} ${phone}`.trim() : ""} />
        {/* The country and the bare national number travel alongside the combined value so both
            the client gate above and signUp() can length-check without re-parsing the dial code. */}
        <input type="hidden" name="phoneCountry" value={countryIso} />
        <input type="hidden" name="phoneNational" value={phone} />

        <div className="relative">
          <input
            required
            type={showPassword ? "text" : "password"}
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            aria-label="Password"
            autoComplete="new-password"
            className={`${compactInputClasses} pr-11`}
          />
          <span className="pointer-events-none absolute right-11 top-2 font-body text-xs text-terracotta">
            *
          </span>
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 text-neutral-300 transition-colors hover:text-brown"
          >
            {showPassword ? <EyeOff size={17} strokeWidth={1.4} /> : <Eye size={17} strokeWidth={1.4} />}
          </button>
        </div>

        <RequiredField>
          <input
            required
            type={showPassword ? "text" : "password"}
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            aria-label="Confirm Password"
            autoComplete="new-password"
            className={compactInputClasses}
          />
        </RequiredField>

        {state?.success === false && (
          <p role="alert" aria-live="polite" className="font-body text-sm text-terracotta">
            {state.message}
          </p>
        )}

        <label className="flex items-start gap-2.5 font-body text-[clamp(0.6875rem,1.4vh,0.8125rem)] text-neutral-400">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 border-neutral-200 accent-brown"
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="text-brown underline decoration-pink-300 underline-offset-4">
              Terms &amp; Conditions
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-brown underline decoration-pink-300 underline-offset-4">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        <input type="hidden" name="agreed" value={agreed ? "true" : ""} />

        <Button
          type="submit"
          variant="primary"
          icon={false}
          disabled={isPending || !agreed}
          className="mt-[clamp(0.25rem,0.6vh,0.5rem)] w-full justify-center !py-[clamp(0.75rem,calc(1vh_+_0.375rem),1rem)]"
        >
          {isPending ? "Creating Account…" : "Create Account"}
        </Button>
      </form>

      <p className="mt-[clamp(0.375rem,1.2vh,1rem)] text-center font-body text-[clamp(0.6875rem,1.4vh,0.8125rem)] text-neutral-400">
        Already have an account?{" "}
        <Link href="/login" className="text-brown underline decoration-pink-300 underline-offset-4">
          Sign In
        </Link>
      </p>

      <div className="mt-[clamp(0.625rem,2vh,1.125rem)] flex items-center justify-between gap-2 border-y border-neutral-100 py-[clamp(0.625rem,2vh,1.125rem)]">
        {perks.map(({ Icon, label }) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-1.5 text-center">
            <Icon size={20} strokeWidth={1.3} className="text-brown" />
            <span className="font-heading text-[10px] uppercase tracking-[0.1em] text-neutral-400">
              {label}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
