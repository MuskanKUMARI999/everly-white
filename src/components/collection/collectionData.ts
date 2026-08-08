export interface CollectionProduct {
  /** The `slug` column. Absent on the hardcoded pieces below — read via productSlug(). */
  slug?: string;
  name: string;
  price: number;
  image: string;
  hoverImage?: string;
  tagline: string;
  description: string;
  story: string;
  /** Per-product override. Falls back to DEFAULT_DIMENSIONS when a piece shares the standard spec. */
  dimensions?: string;
  /** Per-product override. Falls back to DEFAULT_COMPOSITION when a piece shares the standard materials/care. */
  composition?: string;
  /**
   * Real PDP gallery photography, in display order. When set, these replace the
   * image/hoverImage-derived shots as the leading gallery slots (remaining slots fill
   * with generic fillers, then the two video slots). Missing files are skipped safely.
   */
  galleryImages?: { src: string; alt: string }[];
}

/** Standard spec shared by every current piece. Override per-product via CollectionProduct.dimensions. */
export const DEFAULT_DIMENSIONS =
  "Piece 1 — approx. 31cm (12in) · Piece 2 — approx. 21cm (8in). Weight: Piece 1 ~360g, Piece 2 ~400g approx (package ~2kg). Includes 2 metal stands and 2 brand cards, delivered in a shimmer box tied with a metallic ribbon.";

export interface CollectionInfo {
  slug: string;
  name: string;
  /** Catalog filter category this collection's pieces belong to (see productsData.ts). */
  category: string;
  eyebrow: string;
  subtitle: string;
  heroImage: string;
  heroImageAlt: string;
  intro: {
    heading: string;
    paragraphs: string[];
  };
  stats: { value: string; label: string }[];
  founderNote: {
    heading: string;
    quote: string;
    attribution: string;
  };
  products: CollectionProduct[];
}

export const centerOfTheUniverse: CollectionInfo = {
  slug: "center-of-the-universe",
  name: "Center of the Universe",
  category: "center-pieces",
  eyebrow: "The Debut Collection",
  subtitle: "Luxe designs that are loud in the eyes, quiet in the essence.",
  heroImage: "/images/instagram/insta-chair.jpg",
  heroImageAlt: "Everly White mirror-inlay plates styled in a sunlit living room",
  intro: {
    heading: "Where two souls become one reflection.",
    paragraphs: [
      "Center of the Universe is our founding collection — five hand-finished plates, each one a meditation on connection. The pull between twin flames, the quiet gravity of a lunar bond, a fate written in the stars: every piece carries its own quiet mythology, carved by hand and set with mirror.",
      "No two plates catch the light the same way. That isn't a flaw to correct, but the entire point — a reminder that what is meant for you always finds its way home.",
    ],
  },
  stats: [
    { value: "5", label: "Pieces in the Collection" },
    { value: "100+", label: "Hours of Hand Craft, Per Piece" },
  ],
  founderNote: {
    heading: "A reminder that what is meant for you has no clock.",
    quote:
      "It waits. It finds you. Not even time can take it away. The Center of the Universe collection celebrates our never-ending desire and longing for a person to come home to — someone our soul calls home.",
    attribution: "Everly White Studios, Founder's Note",
  },
  products: [
    {
      name: "Twin Flames",
      price: 8800,
      image: "/images/products/twin-flames-1.png",
      hoverImage: "/images/products/twin-flames-2.png",
      tagline: "One soul, two bodies — the Divine Masculine and Divine Feminine, cast in mirror and light.",
      description:
        "Two hand-carved plates, one large and one small, bound by a shared motif that only completes itself when they sit side by side. Each is finished by hand with set mirror inlay, so the light catches a little differently on every pair we make.",
      story:
        "Long before they meet, twin flames are already bound — two halves of one soul, pulled toward each other across lifetimes. This piece holds that pull in wood and mirror: one plate large, one small, complete only when they stand together.",
    },
    {
      name: "Lunar Bond",
      price: 8560,
      image: "/images/products/lunar-bond-1.png",
      hoverImage: "/images/products/lunar-bond-2.png",
      tagline: "A quiet pull between moon and mirror, forever in orbit.",
      description:
        "A large mirror-inlay plate paired with its smaller companion, carved in a radiating lunar motif. Finished entirely by hand, so the mirror settles into the wood a little differently on every piece we make.",
      story:
        "The moon does not chase the tide — it simply waits, and the tide always comes home. Lunar Bond holds that same quiet gravity: two plates in orbit, never touching, never apart.",
    },
    {
      name: "Star Crossed Lovers",
      price: 7589,
      image: "/images/products/star-crossed-lovers-1.png",
      hoverImage: "/images/products/star-crossed-lovers-2.png",
      tagline: "Written in the stars, held together against all odds.",
      description:
        "A star-motif carving spans two hand-finished plates — one larger, one smaller — meant to be displayed together on their brass stands. No two pairs ever catch the light quite the same way.",
      story:
        "Some loves are written in the stars long before two people ever meet — held together against every distance, every doubt. This piece carries that promise, its constellation carved by hand.",
    },
    {
      name: "Butterfly Effect",
      price: 7770,
      image: "/images/products/butterfly-effect/1-pair.png",
      hoverImage: "/images/products/butterfly-effect/2-lifestyle.png",
      tagline: "The smallest spark of beauty, rippling into transformation.",
      description:
        "A floral, wing-like carving spans two hand-finished plates, each set with mirror by hand. Displayed together, they carry the quiet motion their name suggests.",
      story:
        "The smallest gesture can ripple into everything that follows — a single beat of wings, reshaping the whole sky. Butterfly Effect holds that quiet transformation in mirror and hand-carved wood.",
      galleryImages: [
        {
          src: "/images/products/butterfly-effect/1-pair.png",
          alt: "Butterfly Effect large and small mirror-inlay plates displayed on brass stands",
        },
        {
          src: "/images/products/butterfly-effect/2-lifestyle.png",
          alt: "Butterfly Effect plates styled on a console table with pampas grass and candles",
        },
        {
          src: "/images/products/butterfly-effect/3-detail.png",
          alt: "Close-up of the hand-set mirror inlay and carved floral detail on Butterfly Effect",
        },
        {
          src: "/images/products/butterfly-effect/4-specifications.png",
          alt: "Butterfly Effect product specifications — dimensions, materials and care",
        },
      ],
    },
    {
      name: "String of Fate",
      price: 8100,
      image: "/images/products/string-of-fate-1.png",
      tagline: "An invisible thread connecting hearts across the universe.",
      description:
        "A large mirror-inlay plate paired with its smaller companion, carved in a fine lattice that lets an invisible thread of light run through the piece. Hand-finished, and never quite the same twice.",
      story:
        "An invisible thread ties together those who are destined to meet — stretching, tangling, but never breaking. The String of Fate is drawn from this promise: that some souls are bound long before they ever meet, pulled back to one another again and again, until they finally come home.",
    },
  ],
};
