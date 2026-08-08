"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, ImagePlus, Star, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { inputClasses } from "@/components/ui/inputStyles";
import { submitReview } from "@/lib/reviews/actions";

const EASE = [0.22, 1, 0.36, 1] as const;
const MAX_PHOTOS = 6;

interface StagedPhoto {
  file: File;
  url: string;
}

function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
      {Array.from({ length: 5 }, (_, i) => {
        const n = i + 1;
        const filled = (hovered || value) >= n;
        return (
          <button
            key={n}
            type="button"
            aria-label={`Rate ${n} out of 5`}
            onMouseEnter={() => setHovered(n)}
            onClick={() => onChange(n)}
            className="cursor-pointer p-1.5"
          >
            <Star
              size={22}
              strokeWidth={1.3}
              className={filled ? "fill-brown text-brown" : "fill-transparent text-neutral-200"}
            />
          </button>
        );
      })}
    </div>
  );
}

// `productId` ties the review to a specific product when the button is rendered on a product page;
// omitted on the general /reviews page, where the review has no product association.
export function WriteReviewButton({ productId }: { productId?: string } = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [quote, setQuote] = useState("");
  const [photos, setPhotos] = useState<StagedPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef(photos);
  photosRef.current = photos;

  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  // Revoke any still-staged blob URLs if the user navigates away without closing the modal.
  useEffect(() => {
    return () => {
      photosRef.current.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, []);

  function close() {
    setIsOpen(false);
    photosRef.current.forEach((p) => URL.revokeObjectURL(p.url));
    setSubmitted(false);
    setName("");
    setEmail("");
    setRating(0);
    setQuote("");
    setPhotos([]);
    setError(null);
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const incoming = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    const room = MAX_PHOTOS - photos.length;
    // Object URLs are created here, once, rather than inside the setPhotos updater — React
    // (in Strict Mode) may invoke a functional updater twice, which would otherwise leak a
    // blob URL per photo on every add.
    const next = incoming.slice(0, room).map((file) => ({ file, url: URL.createObjectURL(file) }));
    if (next.length === 0) return;
    setPhotos((prev) => [...prev, ...next]);
  }

  function removePhoto(url: string) {
    setPhotos((prev) => {
      const target = prev.find((p) => p.url === url);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.url !== url);
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!rating || !quote.trim() || !name.trim()) return;
    setError(null);

    const data = new FormData();
    data.set("name", name);
    data.set("email", email);
    data.set("rating", String(rating));
    data.set("body", quote);
    if (productId) data.set("productId", productId);
    photos.forEach((p) => data.append("photos", p.file));

    startTransition(async () => {
      const result = await submitReview(data);
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <>
      <Button type="button" variant="secondary" icon={false} onClick={() => setIsOpen(true)}>
        Write a Review
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6"
            onClick={close}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Write a review"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.22, ease: EASE }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto border border-neutral-100 bg-beige-light p-8 text-left shadow-[0_20px_60px_rgba(0,0,0,0.2)] sm:p-10"
            >
              <button
                type="button"
                aria-label="Close"
                onClick={close}
                className="cursor-pointer absolute right-5 top-5 text-neutral-300 transition-colors hover:text-brown"
              >
                <X size={20} strokeWidth={1.5} />
              </button>

              {!submitted ? (
                <>
                  <p className="font-heading text-[11px] font-medium uppercase tracking-[0.28em] text-brown">
                    Share Your Experience
                  </p>
                  <h3 className="mt-3 font-heading text-2xl text-neutral-500">Write a Review</h3>
                  <p className="mt-3 font-body text-sm text-neutral-300">
                    Tell us what you thought — every review is checked by our team before it goes
                    live.
                  </p>

                  <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-5">
                    <div>
                      <label className="font-heading text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                        Your Rating
                      </label>
                      <div className="mt-2">
                        <StarInput value={rating} onChange={setRating} />
                      </div>
                    </div>

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

                    <textarea
                      required
                      value={quote}
                      onChange={(e) => setQuote(e.target.value)}
                      rows={4}
                      placeholder="What did you think of your piece?"
                      aria-label="Your review"
                      className={`${inputClasses} resize-none`}
                    />

                    <div>
                      <label className="font-heading text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                        Add Photos ({photos.length}/{MAX_PHOTOS})
                      </label>
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          addFiles(e.dataTransfer.files);
                        }}
                        onClick={() => photos.length < MAX_PHOTOS && fileInputRef.current?.click()}
                        className={`mt-2 flex flex-col items-center justify-center gap-2 border border-dashed border-neutral-200 bg-white/40 p-6 text-center transition-colors ${
                          photos.length < MAX_PHOTOS
                            ? "cursor-pointer hover:border-brown"
                            : "cursor-not-allowed opacity-50"
                        }`}
                      >
                        <ImagePlus size={22} strokeWidth={1.3} className="text-brown" />
                        <p className="font-body text-sm text-neutral-300">
                          Drag photos here, or click to upload
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          aria-label="Add review photos"
                          multiple
                          onChange={(e) => addFiles(e.target.files)}
                          className="hidden"
                        />
                      </div>

                      {photos.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {photos.map((p) => (
                            <div
                              key={p.url}
                              className="group relative h-16 w-16 overflow-hidden bg-pink-100"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element -- ephemeral client-side blob preview, not a next/image-optimizable asset */}
                              <img src={p.url} alt="" className="h-full w-full object-cover" />
                              <button
                                type="button"
                                aria-label="Remove photo"
                                onClick={() => removePhoto(p.url)}
                                className="cursor-pointer absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-beige-light opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <X size={12} strokeWidth={2} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {error && <p className="font-body text-sm text-terracotta">{error}</p>}

                    <Button
                      type="submit"
                      variant="primary"
                      icon={false}
                      disabled={isPending}
                      className="mt-2 w-full"
                    >
                      {isPending ? "Submitting…" : "Submit Review"}
                    </Button>
                  </form>
                </>
              ) : (
                <div className="py-6 text-center">
                  <CheckCircle2 size={38} strokeWidth={1.3} className="mx-auto text-brown" />
                  <h3 className="mt-4 font-heading text-2xl text-neutral-500">
                    Thank You{name ? `, ${name}` : ""}
                  </h3>
                  <p className="mx-auto mt-3 max-w-[38ch] font-body text-neutral-300">
                    Your review has been submitted for verification and will appear on this page
                    once our team approves it — usually within 24 hours.
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    icon={false}
                    onClick={close}
                    className="mt-7"
                  >
                    Done
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
