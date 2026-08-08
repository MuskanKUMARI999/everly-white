"use client";

import { useState, useActionState } from "react";
import { CheckCircle2, MapPin, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CollectionEyebrow as Eyebrow } from "@/components/collection/Eyebrow";
import { inputClasses } from "@/components/ui/inputStyles";
import { StateSelect } from "@/components/ui/StateSelect";
import { SHIPPING_COUNTRY } from "@/lib/site";
import { AccountEmptyState } from "./AccountEmptyState";
import {
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  type FormResult,
  type Address,
} from "@/lib/auth/profile-actions";

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

function AddressForm({
  address,
  onCancel,
  mode,
}: {
  address?: Address;
  onCancel: () => void;
  mode: "add" | "edit";
}) {
  const action = mode === "add" ? addAddress : updateAddress;
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-4 border border-neutral-100 bg-white p-5">
      {mode === "edit" && <input type="hidden" name="id" value={address?.id} />}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input
          name="fullName"
          type="text"
          defaultValue={address?.full_name ?? ""}
          placeholder="Full Name"
          aria-label="Full Name"
          required
          className={inputClasses}
        />
        <input
          name="phone"
          type="tel"
          defaultValue={address?.phone ?? ""}
          placeholder="Phone Number"
          aria-label="Phone Number"
          required
          className={inputClasses}
        />
      </div>
      <input
        name="line1"
        type="text"
        defaultValue={address?.line1 ?? ""}
        placeholder="Address Line 1"
        aria-label="Address Line 1"
        required
        className={inputClasses}
      />
      <input
        name="line2"
        type="text"
        defaultValue={address?.line2 ?? ""}
        placeholder="Address Line 2 (Optional)"
        aria-label="Address line 2 (optional)"
        className={inputClasses}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <input
          name="city"
          type="text"
          defaultValue={address?.city ?? ""}
          placeholder="City"
          aria-label="City"
          required
          className={inputClasses}
        />
        <StateSelect defaultValue={address?.state ?? ""} required className={inputClasses} />
        <input
          name="pinCode"
          type="text"
          defaultValue={address?.pin_code ?? ""}
          placeholder="PIN Code"
          aria-label="PIN Code"
          maxLength={6}
          inputMode="numeric"
          required
          className={inputClasses}
        />
      </div>
      {/* Shown but not editable, mirroring the read-only email on /account/details. The shop is
          India-only by construction — free shipping "across India", a 6-digit PIN rule, and GST
          invoices that split tax off a table of the 36 Indian states. Letting a customer type
          another country produced an address the shop cannot ship, price or invoice. No form field
          is submitted; addAddress/updateAddress set the country server-side. */}
      <div>
        <input
          type="text"
          value={SHIPPING_COUNTRY}
          readOnly
          disabled
          aria-label="Country"
          className={`${inputClasses} bg-neutral-50 text-neutral-300`}
        />
        <p className="mt-1.5 font-body text-xs text-neutral-300">
          We currently ship within India only.
        </p>
      </div>
      <label className="flex cursor-pointer items-center gap-2 font-body text-sm text-neutral-500">
        <input
          name="isDefault"
          type="checkbox"
          value="true"
          defaultChecked={address?.is_default ?? false}
          className="h-4 w-4 accent-brown"
        />
        Set as default address
      </label>
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button type="submit" variant="primary" disabled={isPending} icon={false}>
          {isPending ? "Saving…" : mode === "add" ? "Add Address" : "Update Address"}
        </Button>
        <Button type="button" variant="tertiary" onClick={onCancel} icon={false}>
          Cancel
        </Button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

function AddressCard({ address, onEdit }: { address: Address; onEdit: (a: Address) => void }) {
  const [state, action, isPending] = useActionState(deleteAddress, null);
  const [defaultState, setDefaultAction, settingDefault] = useActionState(setDefaultAddress, null);

  return (
    <div className="relative flex flex-col gap-1 border border-neutral-100 bg-pink-100/40 p-6">
      {address.is_default && (
        <span className="absolute right-5 top-5 flex items-center gap-1 font-heading text-[10px] uppercase tracking-[0.1em] text-brown">
          <CheckCircle2 size={12} strokeWidth={1.5} /> Default
        </span>
      )}
      <p className="font-body text-sm font-semibold text-neutral-500">{address.full_name}</p>
      <p className="font-body text-sm text-neutral-400">{address.phone}</p>
      <p className="font-body text-sm text-neutral-400">
        {address.line1}
        {address.line2 ? `, ${address.line2}` : ""}
      </p>
      <p className="font-body text-sm text-neutral-400">
        {address.city}, {address.state} — {address.pin_code}
      </p>
      <p className="font-body text-sm text-neutral-400">{address.country}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onEdit(address)}
          className="cursor-pointer font-heading text-[10px] uppercase tracking-[0.1em] text-neutral-400 underline decoration-neutral-200 underline-offset-4 transition-colors hover:text-brown"
        >
          Edit
        </button>
        {/* Only offered where it does something — the default card already carries its badge. */}
        {!address.is_default && (
          <form action={setDefaultAction} className="inline">
            <input type="hidden" name="id" value={address.id} />
            <button
              type="submit"
              disabled={settingDefault}
              className="cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-1 font-heading text-[10px] uppercase tracking-[0.1em] text-brown underline decoration-brown/30 underline-offset-4 transition-colors hover:text-neutral-500"
            >
              <CheckCircle2 size={12} strokeWidth={1.5} />
              {settingDefault ? "Setting…" : "Set as Default"}
            </button>
          </form>
        )}
        <form action={action} className="inline">
          <input type="hidden" name="id" value={address.id} />
          <button
            type="submit"
            disabled={isPending}
            className="cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-1 font-heading text-[10px] uppercase tracking-[0.1em] text-terracotta underline decoration-terracotta/30 underline-offset-4 transition-colors hover:text-terracotta/80"
          >
            <Trash2 size={12} strokeWidth={1.5} />
            {isPending ? "Deleting…" : "Delete"}
          </button>
        </form>
      </div>
      <FormMessage state={state} />
      <FormMessage state={defaultState} />
    </div>
  );
}

export function AddressContent({ addresses }: { addresses: Address[] }) {
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div>
      <Eyebrow>My Account</Eyebrow>
      <h1 className="mt-3 font-heading text-3xl text-neutral-500 sm:text-4xl">Address Book</h1>
      <p className="mt-2 font-body text-neutral-300">
        Manage the addresses your Everly White orders ship to.
      </p>

      {/* The empty state carries its own Add Address button, so this one would only duplicate it. */}
      {!showAdd && !editingAddress && addresses.length > 0 && (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="cursor-pointer mt-8 inline-flex items-center gap-1.5 font-heading text-[11px] uppercase tracking-[0.1em] text-brown transition-colors hover:text-neutral-500"
        >
          <Plus size={14} strokeWidth={1.5} /> Add Address
        </button>
      )}

      <div className="mt-8 flex flex-col gap-4">
        {showAdd && <AddressForm mode="add" onCancel={() => setShowAdd(false)} />}

        {editingAddress && (
          <AddressForm
            mode="edit"
            address={editingAddress}
            onCancel={() => setEditingAddress(null)}
          />
        )}

        {addresses.length === 0 && !showAdd ? (
          <AccountEmptyState
            Icon={MapPin}
            title="No Saved Addresses"
            description="Save the addresses you ship to and checkout becomes a step shorter — pick one instead of typing it out each time."
            action={{ label: "Add Address", onClick: () => setShowAdd(true) }}
            footnote="Mark one as default and it'll be selected for you at checkout."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {addresses
              .filter((a) => a.id !== editingAddress?.id)
              .map((address) => (
                <AddressCard
                  key={address.id}
                  address={address}
                  onEdit={(a) => {
                    setShowAdd(false);
                    setEditingAddress(a);
                  }}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
