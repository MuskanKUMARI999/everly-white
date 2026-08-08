/**
 * Pre-written launch reviews, used to bootstrap an empty `reviews` table.
 *
 * These live here — with the other seed data — rather than in the front end, so the site renders
 * every review from a single source (the database) and the admin panel can edit or delete them.
 * `scripts/seed.ts` only inserts them when the table is empty, so genuine customer reviews are
 * never duplicated or overwritten.
 */
export interface SeedReview {
  quote: string;
  name: string;
  location: string;
  rating: number;
  photos?: string[];
}

export const seedReviews: SeedReview[] = [
  {
    quote:
      "The moment I unboxed my Twin Flames set, my living room felt transformed. The mirror work catches the light through the whole day — it's like the piece is alive.",
    name: "Ananya Mehta",
    location: "Mumbai",
    rating: 5,
    photos: [
      "/images/instagram/product-marble-counter.jpg",
      "/images/instagram/insta-window.jpg",
      "/images/instagram/product-coffee-table.jpg",
      "/images/instagram/lifestyle-sofa.jpg",
    ],
  },
  {
    quote:
      "Exquisite craftsmanship. You can tell each plate is hand-set. It's become the first thing every guest comments on when they walk in.",
    name: "Rhea Kapoor",
    location: "Bengaluru",
    rating: 5,
    photos: ["/images/instagram/insta-chair.jpg", "/images/instagram/lifestyle-sofa.jpg"],
  },
  {
    quote:
      "I gifted the Lunar Bond to my sister for her wedding. The packaging alone felt like a keepsake. Everly White has an eye for detail that's genuinely rare.",
    name: "Ishaan Verma",
    location: "New Delhi",
    rating: 5,
  },
  {
    quote:
      "Star Crossed Lovers sits above our console table now and it's the calmest, most grounding thing in the room. Worth every rupee.",
    name: "Meher Chopra",
    location: "Chandigarh",
    rating: 5,
    photos: ["/images/instagram/insta-card.jpg"],
  },
  {
    quote:
      "The String of Fate arrived faster than expected and the finish is even richer in person. I keep finding new details in the carving.",
    name: "Aditya Rao",
    location: "Hyderabad",
    rating: 4,
  },
  {
    quote:
      "Ordered the Butterfly Effect on a whim and it's genuinely become a conversation piece. Everyone assumes it's a vintage find.",
    name: "Kavya Nair",
    location: "Kochi",
    rating: 5,
  },
  {
    quote:
      "Customer care helped me pick the right piece for a housewarming gift and it landed perfectly. Thoughtful from browsing to unboxing.",
    name: "Sanya Malhotra",
    location: "Pune",
    rating: 5,
  },
  {
    quote:
      "You can feel the difference between this and mass-produced décor the second you hold it. Heavier, warmer, made with actual hands.",
    name: "Vivaan Sharma",
    location: "Jaipur",
    rating: 4,
  },
  {
    quote:
      "This is my third Everly White piece and the quality has never once dipped. The Twin Flames remains my favorite thing I own.",
    name: "Diya Iyer",
    location: "Chennai",
    rating: 5,
  },
];
