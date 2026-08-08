"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RequiredField } from "@/components/ui/RequiredField";
import { updatePassword } from "@/lib/auth/actions";

// Padding scales with viewport height (vh) instead of a fixed value, so the full form — including the
// submit button — always fits within the viewport without scrolling, on any screen height.
const compactInputClasses =
  "w-full border border-neutral-200 bg-transparent px-4 py-[clamp(0.375rem,1vh,0.625rem)] font-body text-neutral-500 outline-none transition-colors focus:border-neutral-500 placeholder:text-neutral-200";

export function ResetPasswordForm() {
  const [state, action, isPending] = useActionState(updatePassword, null);
  const [showPassword, setShowPassword] = useState(false);

  if (state?.success) {
    return (
      <div className="flex flex-col items-center border border-neutral-100 bg-pink-100/40 p-10 text-center">
        <CheckCircle2 size={38} strokeWidth={1.3} className="text-brown" />
        <h2 className="mt-4 font-heading text-2xl text-neutral-500">Password Updated</h2>
        <p className="mt-3 max-w-[34ch] font-body text-neutral-300">{state.message}</p>
        <Link
          href="/login"
          className="mt-6 border-b border-neutral-300 font-heading text-[11.5px] uppercase tracking-widest text-neutral-400 transition-colors hover:border-brown hover:text-brown"
        >
          Continue To Sign In
        </Link>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="flex flex-col gap-[clamp(0.375rem,1.2vh,0.75rem)]">
      <div className="relative">
        <input
          required
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder="New Password"
          aria-label="New Password"
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
          placeholder="Confirm New Password"
          aria-label="Confirm New Password"
          autoComplete="new-password"
          className={compactInputClasses}
        />
      </RequiredField>

      {state?.success === false && (
        <p className="font-body text-sm text-terracotta">{state.message}</p>
      )}

      <Button
        type="submit"
        variant="primary"
        icon={false}
        disabled={isPending}
        className="mt-[clamp(0.25rem,0.6vh,0.5rem)] w-full justify-center !py-[clamp(0.75rem,calc(1vh_+_0.375rem),1rem)]"
      >
        {isPending ? "Resetting…" : "Reset Password"}
      </Button>

      <p className="mt-[clamp(0.375rem,1.2vh,1rem)] text-center font-body text-[clamp(0.6875rem,1.4vh,0.8125rem)] text-neutral-400">
        Remembered your password?{" "}
        <Link href="/login" className="text-brown underline decoration-pink-300 underline-offset-4">
          Sign In
        </Link>
      </p>
    </form>
  );
}
