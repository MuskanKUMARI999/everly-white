"use client";

import { useActionState, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Plus, RotateCcw, Trash2 } from "lucide-react";
import { updateSectionContent } from "@/lib/admin/actions";
import { ContentImageInput } from "@/components/admin/ContentImageInput";
import { CONTENT_ICONS, ContentIcon } from "@/components/ui/ContentIcon";
import { SOCIAL_ICONS, SocialIcon } from "@/components/ui/SocialIcon";
import {
  emptyListItem,
  isListField,
  normaliseValues,
  type ListField,
  type ListItem,
  type SectionSchema,
  type SectionValues,
  type SimpleField,
} from "@/lib/content/sections";
import type { AdminSection } from "@/lib/data/admin";

/**
 * One editable page section, rendered from its schema declaration rather than hand-written.
 *
 * Everything is held in React state and posted as a single JSON field, which is what lets a section
 * carry repeatable rows (hero slides, category tiles, feature bullets) — those cannot be expressed
 * as flat form inputs without inventing an encoding for the indices. The server re-validates the
 * JSON against the same schema, so nothing here is trusted.
 */

const inputClasses =
  "border border-neutral-200 bg-white px-3 py-2 font-body font-medium text-base text-neutral-500 outline-none transition-colors focus:border-neutral-500";
const labelClasses = "font-heading text-sm uppercase tracking-widest text-neutral-500";
const helpClasses = "font-body text-sm text-neutral-400";

function SimpleInput({
  field,
  value,
  onChange,
  onClear,
}: {
  field: SimpleField;
  value: string;
  onChange: (next: string) => void;
  onClear?: () => void;
}) {
  if (field.type === "image") {
    return <ContentImageInput value={value} onChange={onChange} onClear={onClear} />;
  }

  if (field.type === "textarea") {
    return (
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClasses} w-full resize-y`}
      />
    );
  }

  if (field.type === "icon") {
    return (
      <div className="flex items-center gap-3">
        <ContentIcon name={value} size={22} className="shrink-0 text-brown" />
        <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClasses}>
          {/* A value saved before an icon was retired from the list would otherwise silently
              become the first option the moment this form is saved again. */}
          {!CONTENT_ICONS.some((icon) => icon.name === value) && (
            <option value={value}>{value || "None"}</option>
          )}
          {CONTENT_ICONS.map((icon) => (
            <option key={icon.name} value={icon.name}>
              {icon.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === "social") {
    return (
      <div className="flex items-center gap-3">
        <SocialIcon name={value} size={18} className="shrink-0 text-brown" />
        <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClasses}>
          {!SOCIAL_ICONS.some((icon) => icon.name === value) && (
            <option value={value}>{value || "None"}</option>
          )}
          {SOCIAL_ICONS.map((icon) => (
            <option key={icon.name} value={icon.name}>
              {icon.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <input
      type={field.type === "number" ? "number" : "text"}
      min={field.type === "number" ? 1 : undefined}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.type === "link" ? "/products" : field.placeholder}
      className={`${inputClasses} w-full`}
    />
  );
}

function ListEditor({
  field,
  items,
  onChange,
}: {
  field: ListField;
  items: ListItem[];
  onChange: (next: ListItem[]) => void;
}) {
  function updateItem(index: number, name: string, value: string) {
    onChange(items.map((item, i) => (i === index ? { ...item, [name]: value } : item)));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  const atMax = items.length >= (field.max ?? 24);

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => (
        <div key={index} className="border border-neutral-100 bg-pink-100/20 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="font-heading text-xs uppercase tracking-widest text-neutral-400">
              {field.itemLabel} {index + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                title={`Move ${field.itemLabel.toLowerCase()} up`}
                className="cursor-pointer disabled:cursor-not-allowed p-1 text-neutral-400 transition-colors hover:text-brown disabled:opacity-30"
              >
                <ArrowUp size={15} strokeWidth={1.6} />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === items.length - 1}
                title={`Move ${field.itemLabel.toLowerCase()} down`}
                className="cursor-pointer disabled:cursor-not-allowed p-1 text-neutral-400 transition-colors hover:text-brown disabled:opacity-30"
              >
                <ArrowDown size={15} strokeWidth={1.6} />
              </button>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
                title={`Remove ${field.itemLabel.toLowerCase()}`}
                className="cursor-pointer p-1 text-neutral-400 transition-colors hover:text-terracotta"
              >
                <Trash2 size={15} strokeWidth={1.6} />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {field.fields.map((sub) => (
              <div key={sub.name} className="flex flex-col gap-1">
                <label className={labelClasses}>{sub.label}</label>
                <SimpleInput
                  field={sub}
                  value={item[sub.name] ?? ""}
                  onChange={(value) => updateItem(index, sub.name, value)}
                />
                {sub.help && <p className={helpClasses}>{sub.help}</p>}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div>
        <button
          type="button"
          onClick={() => onChange([...items, emptyListItem(field)])}
          disabled={atMax}
          className="cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-2 border border-neutral-200 bg-white px-3 py-2 font-heading text-sm uppercase tracking-widest text-neutral-500 transition-colors hover:border-brown hover:text-brown disabled:opacity-40"
        >
          <Plus size={14} strokeWidth={1.8} />
          Add {field.itemLabel}
        </button>
        {atMax && <p className={`mt-2 ${helpClasses}`}>That is the maximum for this section.</p>}
      </div>
    </div>
  );
}

interface AdminSectionFormProps {
  schema: SectionSchema;
  section: AdminSection;
}

export function AdminSectionForm({ schema, section }: AdminSectionFormProps) {
  const [values, setValues] = useState<SectionValues>(section.values);
  const [isVisible, setIsVisible] = useState(section.isVisible);
  const [open, setOpen] = useState(false);
  // A field left empty keeps the wording that is already on the page, so saving a section after
  // changing one line does not blank the rest of it. An image's Clear button is the one way to
  // empty a field on purpose, and these are the fields it was pressed on.
  const [cleared, setCleared] = useState<string[]>([]);
  const [state, action, isPending] = useActionState(updateSectionContent, null);

  const serialised = useMemo(() => JSON.stringify(values), [values]);
  const stored = JSON.stringify(section.values);
  const dirty = serialised !== stored || isVisible !== section.isVisible;

  // What the page holds now that a save has gone through. A field left empty is filled server-side
  // with the wording already on the page, so what is stored is not always what was typed — re-seeding
  // the form from it is what keeps "Unsaved" and a disabled Save button honest instead of leaving
  // them lit over a form that already matches the database. Only the section that was saved comes
  // back changed, so an edit left open in a sibling section on the same page is not disturbed.
  const incoming = `${stored}|${section.isVisible}`;
  const [syncedTo, setSyncedTo] = useState(incoming);
  if (syncedTo !== incoming) {
    setSyncedTo(incoming);
    setValues(section.values);
    setIsVisible(section.isVisible);
    setCleared([]);
  }

  function setField(name: string, value: string | ListItem[]) {
    setValues((current) => ({ ...current, [name]: value }));
    if (typeof value === "string" && value.trim()) {
      setCleared((current) => current.filter((field) => field !== name));
    }
  }

  return (
    <div className="border border-neutral-100 bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="cursor-pointer flex w-full items-start justify-between gap-4 p-6 text-left"
      >
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-heading text-lg font-light uppercase tracking-widest text-neutral-500">
              {schema.label}
            </span>
            {!isVisible && (
              <span className="border border-neutral-200 px-2 py-0.5 font-heading text-xs uppercase tracking-widest text-neutral-400">
                Hidden
              </span>
            )}
            {dirty && (
              <span className="border border-terracotta/40 px-2 py-0.5 font-heading text-xs uppercase tracking-widest text-terracotta">
                Unsaved
              </span>
            )}
          </span>
          <span className={`mt-2 block ${helpClasses}`}>{schema.description}</span>
        </span>
        <ChevronDown
          size={18}
          strokeWidth={1.6}
          className={`mt-1 shrink-0 text-brown transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <form action={action} className="border-t border-neutral-100 p-6">
          <input type="hidden" name="sectionKey" value={schema.key} />
          <input type="hidden" name="values" value={serialised} />
          <input type="hidden" name="clearedFields" value={JSON.stringify(cleared)} />

          <p className="mb-5 border border-neutral-100 bg-pink-100/20 px-4 py-3 font-body text-base text-neutral-500">
            Change what you need and save &mdash; anything you leave empty keeps the wording
            already on the page.
          </p>

          <div className="flex flex-col gap-5">
            {schema.fields.map((field) =>
              isListField(field) ? (
                <div key={field.name} className="flex flex-col gap-2">
                  <label className={labelClasses}>{field.label}</label>
                  {field.help && <p className={helpClasses}>{field.help}</p>}
                  <ListEditor
                    field={field}
                    items={Array.isArray(values[field.name]) ? (values[field.name] as ListItem[]) : []}
                    onChange={(next) => setField(field.name, next)}
                  />
                </div>
              ) : (
                <div key={field.name} className="flex flex-col gap-1">
                  <label className={labelClasses}>{field.label}</label>
                  <SimpleInput
                    field={field}
                    value={typeof values[field.name] === "string" ? (values[field.name] as string) : ""}
                    onChange={(value) => setField(field.name, value)}
                    onClear={() =>
                      setCleared((current) =>
                        current.includes(field.name) ? current : [...current, field.name],
                      )
                    }
                  />
                  {field.help && <p className={helpClasses}>{field.help}</p>}
                </div>
              ),
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-neutral-100 pt-5">
            {schema.canHide && (
              <label className="flex items-center gap-2 font-body font-medium text-lg text-neutral-500">
                {/* Posted as a real checkbox so the action reads it the same way every other admin
                    form does; the state copy is only there to drive the "Hidden" badge live. */}
                <input
                  type="checkbox"
                  name="isVisible"
                  checked={isVisible}
                  onChange={(e) => setIsVisible(e.target.checked)}
                  className="h-4 w-4 accent-brown"
                />
                Show this section
              </label>
            )}

            <button
              type="submit"
              disabled={isPending || !dirty}
              title={isPending || dirty ? undefined : "Change something in this section first"}
              className="cursor-pointer disabled:cursor-not-allowed bg-brown px-4 py-2 font-heading text-sm uppercase tracking-widest text-beige-light transition-colors hover:bg-neutral-500 disabled:bg-neutral-300"
            >
              {isPending ? "Saving…" : "Save"}
            </button>

            <button
              type="button"
              onClick={() => {
                if (!confirm("Restore the original wording for this section? Nothing is saved until you press Save.")) return;
                // The shipped copy lives in the schema, which is bundled here too — so restoring is
                // a local refill of the form, reviewable before it is committed.
                setValues(normaliseValues(schema, {}));
                setCleared([]);
              }}
              className="cursor-pointer inline-flex items-center gap-2 font-body font-medium text-base text-neutral-400 underline decoration-neutral-200 underline-offset-4 transition-colors hover:text-brown"
            >
              <RotateCcw size={14} strokeWidth={1.6} />
              Restore original wording
            </button>

            {state && (
              <span
                className={`font-body text-base ${state.success ? "text-green-600" : "text-terracotta"}`}
              >
                {state.message}
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
