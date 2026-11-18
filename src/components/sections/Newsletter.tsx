"use client";

import { useState, useTransition, type FormEvent } from "react";
import { subscribeToNewsletter } from "@/lib/newsletter/actions";
import { MultilineText } from "@/components/ui/RichText";
import { text, type SectionValues } from "@/lib/content/sections";

export function Newsletter({ content }: { content: SectionValues }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await subscribeToNewsletter(email);
      setMessage({ success: result.success, text: result.message });
      if (result.success) setEmail("");
    });
  }

  return (
    <section className="bg-beige-light py-16 sm:py-20">
      <div className="mx-auto max-w-content px-6 text-center sm:px-10 lg:px-10">
        <h2 className="font-heading text-2xl text-neutral-500 sm:text-3xl">
          {text(content, "heading")}
        </h2>
        <p className="mx-auto mt-3 max-w-xl font-body text-neutral-300">
          <MultilineText value={text(content, "body")} />
        </p>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={text(content, "placeholder")}
            aria-label="Email address"
            className="w-full border border-neutral-500 bg-transparent px-4 py-3 font-body text-neutral-500 outline-none placeholder:text-neutral-200"
          />
          <button
            type="submit"
            disabled={isPending}
            className="cursor-pointer disabled:cursor-not-allowed whitespace-nowrap bg-neutral-500 px-6 py-3 font-heading text-xs uppercase tracking-[0.14em] text-beige-light transition-colors hover:bg-brown disabled:opacity-60"
          >
            {isPending ? "Subscribing..." : text(content, "buttonLabel")}
          </button>
        </form>

        {message && (
          <p
            className={`mt-3 font-body text-sm ${message.success ? "text-brown" : "text-terracotta"}`}
          >
            {message.text}
          </p>
        )}
      </div>
    </section>
  );
}
