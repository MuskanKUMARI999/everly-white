"use client";

import { useState, useTransition, type FormEvent } from "react";
import { CheckCircle2, ChevronDown, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { CollectionEyebrow as Eyebrow } from "@/components/collection/Eyebrow";
import { inputClasses, inquiryTypes, socials } from "./contactData";
import { submitContactForm } from "@/lib/contact/actions";

export function ContactContent() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [inquiryType, setInquiryType] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await submitContactForm({ name, email, inquiryType, subject, message });
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <main className="py-20 sm:py-28">
      <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <Reveal>
            {submitted ? (
              <div className="flex h-full flex-col items-center justify-center border border-neutral-100 bg-beige-light p-10 text-center sm:p-14">
                <CheckCircle2 size={38} strokeWidth={1.3} className="text-brown" />
                <h2 className="mt-4 font-heading text-2xl text-neutral-500">
                  Message Sent{name ? `, Thank You ${name}` : ""}
                </h2>
                <p className="mx-auto mt-3 max-w-[38ch] font-body text-neutral-300">
                  We&rsquo;ve received your message and will get back to you within 1–2 business
                  days.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setInquiryType("");
                    setSubject("");
                    setMessage("");
                  }}
                  className="cursor-pointer mt-6 border-b border-neutral-300 font-heading text-[11.5px] uppercase tracking-widest text-neutral-400 transition-colors hover:border-brown hover:text-brown"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <>
                <Eyebrow>Send Us A Message</Eyebrow>
                <h2 className="mt-3 font-heading text-3xl text-neutral-500 sm:text-4xl">
                  Let&rsquo;s Talk
                </h2>
                <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Name"
                      aria-label="Your Name"
                      className={inputClasses}
                    />
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your Email"
                      aria-label="Your Email"
                      className={inputClasses}
                    />
                  </div>
                  <div className="relative">
                    <select
                      required
                      value={inquiryType}
                      onChange={(e) => setInquiryType(e.target.value)}
                      aria-label="What is your inquiry about?"
                      className={`${inputClasses} appearance-none pr-10 ${
                        inquiryType ? "" : "text-neutral-200"
                      }`}
                    >
                      <option value="" disabled hidden>
                        What is your inquiry about?
                      </option>
                      {inquiryTypes.map((type) => (
                        <option key={type} value={type} className="text-neutral-500">
                          {type}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brown"
                      strokeWidth={1.5}
                    />
                  </div>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Subject"
                    aria-label="Subject"
                    className={inputClasses}
                  />
                  <textarea
                    required
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How can we help?"
                    aria-label="Your message"
                    className={`${inputClasses} resize-none`}
                  />
                  {error && <p className="font-body text-sm text-terracotta">{error}</p>}
                  <Button
                    type="submit"
                    variant="primary"
                    icon={false}
                    disabled={isPending}
                    className="mt-2 w-fit"
                  >
                    {isPending ? "Sending…" : "Send Message"}
                  </Button>
                </form>
              </>
            )}
          </Reveal>

          <Reveal delay={0.1}>
            <div className="border border-neutral-100 bg-pink-100/40 p-8 sm:p-10">
              <Eyebrow>Reach Us Directly</Eyebrow>
              <h3 className="mt-3 font-heading text-xl text-neutral-500">We&rsquo;d Love To Hear From You</h3>

              <a
                href="mailto:everlywhiteshop@gmail.com"
                className="mt-6 flex items-center gap-3 font-body text-neutral-400 transition-colors hover:text-brown"
              >
                <Mail size={18} strokeWidth={1.4} className="shrink-0 text-brown" />
                everlywhiteshop@gmail.com
              </a>

              <p className="mt-6 font-body text-sm text-neutral-300">
                We typically respond within 1–2 business days.
              </p>

              <span className="mt-8 block font-heading text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                Follow Along
              </span>
              <div className="mt-3 flex gap-3">
                {socials.map(({ label, Icon, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-100 text-brown transition-colors hover:bg-pink-100"
                  >
                    <Icon size={14} />
                  </a>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </main>
  );
}
