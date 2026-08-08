import { Star } from "lucide-react";

export function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`Rated ${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={14}
          strokeWidth={1.3}
          className={i < rating ? "fill-brown text-brown" : "fill-transparent text-neutral-100"}
        />
      ))}
    </div>
  );
}
