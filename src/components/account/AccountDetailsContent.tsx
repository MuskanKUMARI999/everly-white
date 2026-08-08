"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CollectionEyebrow as Eyebrow } from "@/components/collection/Eyebrow";
import { inputClasses } from "@/components/ui/inputStyles";
import { updateProfile, type FormResult } from "@/lib/auth/profile-actions";
import { changePassword } from "@/lib/auth/actions";

const labelClasses =
  "mb-1.5 block font-heading text-[11px] uppercase tracking-[0.1em] text-neutral-500";

function FormMessage({ state }: { state: FormResult | null }) {
  if (!state) return null;
  return (
    <p
      className={`font-body text-sm ${state.success ? "text-brown" : "text-terracotta"}`}
      role="alert"
    >
      {state.message}
    </p>
  );
}

function ChangePasswordForm() {
  const [state, action, isPending] = useActionState(changePassword, null);
  const [showPasswords, setShowPasswords] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // useActionState keeps the submitted values in the inputs, so without this the three password
  // boxes sit there filled in after a successful change.
  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  const fields = [
    { name: "currentPassword", label: "Current Password", autoComplete: "current-password" },
    { name: "password", label: "New Password", autoComplete: "new-password" },
    { name: "confirmPassword", label: "Confirm New Password", autoComplete: "new-password" },
  ];

  return (
    <form ref={formRef} action={action} className="mt-8 flex flex-col gap-5">
      {fields.map(({ name, label, autoComplete }) => (
        <div key={name}>
          <label htmlFor={name} className={labelClasses}>
            {label}
          </label>
          <div className="relative">
            <input
              id={name}
              name={name}
              type={showPasswords ? "text" : "password"}
              autoComplete={autoComplete}
              required
              minLength={name === "currentPassword" ? undefined : 8}
              className={`${inputClasses} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPasswords((s) => !s)}
              aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
              className="cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 text-neutral-300 transition-colors hover:text-brown"
            >
              {showPasswords ? (
                <EyeOff size={17} strokeWidth={1.4} />
              ) : (
                <Eye size={17} strokeWidth={1.4} />
              )}
            </button>
          </div>
        </div>
      ))}

      <p className="font-body text-xs text-neutral-300">
        Use at least 8 characters, and something you haven&rsquo;t used here before.
      </p>

      <div className="flex flex-wrap items-center gap-4 pt-2">
        <Button type="submit" variant="primary" disabled={isPending} icon={false}>
          {isPending ? "Updating…" : "Update Password"}
        </Button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function AccountDetailsContent({
  fullName,
  email,
  phone,
}: {
  fullName: string;
  email: string;
  phone: string;
}) {
  const [state, action, isPending] = useActionState(updateProfile, null);

  return (
    <div>
      <Eyebrow>My Account</Eyebrow>
      <h1 className="mt-3 font-heading text-3xl text-neutral-500 sm:text-4xl">Account Details</h1>
      {/* Deliberately does not promise an email change: the field below is read-only, because the
          address is the sign-in identity and changing it needs a Supabase re-verification flow. */}
      <p className="mt-2 font-body text-neutral-300">
        Update your name and phone number, or change your password.
      </p>

      <form action={action} className="mt-10 flex max-w-xl flex-col gap-5">
        <div>
          <label htmlFor="fullName" className={labelClasses}>
            Full Name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            defaultValue={fullName}
            required
            className={inputClasses}
          />
        </div>

        <div>
          <label htmlFor="email" className={labelClasses}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            readOnly
            disabled
            className={`${inputClasses} bg-neutral-50 text-neutral-300`}
          />
          <p className="mt-1.5 font-body text-xs text-neutral-300">
            Your email is the address you sign in with and can&rsquo;t be changed here.
          </p>
        </div>

        <div>
          <label htmlFor="phone" className={labelClasses}>
            Phone Number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={phone}
            className={inputClasses}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <Button type="submit" variant="primary" disabled={isPending} icon={false}>
            {isPending ? "Saving…" : "Save Changes"}
          </Button>
          <FormMessage state={state} />
        </div>
      </form>

      <section className="mt-14 max-w-xl border-t border-neutral-100 pt-10">
        <h2 className="font-heading text-sm uppercase tracking-[0.14em] text-neutral-500">
          Password
        </h2>
        <p className="mt-2 font-body text-sm text-neutral-300">
          Set a new password for signing in. You&rsquo;ll need your current one to confirm it&rsquo;s
          you.
        </p>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
