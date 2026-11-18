/**
 * The editable content schema behind Admin → Home Page and Admin → FAQs.
 *
 * Every section of the homepage and the FAQ page used to be hardcoded copy inside its component,
 * so changing a heading, a tile image or a button label meant a code edit and a redeploy. Each
 * section now declares its fields here once; the storefront reads the stored values (falling back
 * to `defaults`, which reproduce the original copy exactly) and Admin → Home Page renders an
 * editing form straight from the same declaration. Adding a new editable field is a one-line
 * change here — no admin form to update, no migration needed.
 *
 * Shared by server components and the client-side admin form, so nothing in this file may import
 * `server-only` or touch the database.
 */

export type SimpleFieldType = "text" | "textarea" | "image" | "link" | "number" | "icon" | "social";

export interface SimpleField {
  name: string;
  label: string;
  type: SimpleFieldType;
  help?: string;
  placeholder?: string;
}

/** A repeatable group of simple fields — tiles, slides, feature bullets. Never nested. */
export interface ListField {
  name: string;
  label: string;
  type: "list";
  /** Singular noun for the "Add …" button, e.g. "Tile". */
  itemLabel: string;
  help?: string;
  max?: number;
  fields: SimpleField[];
}

export type ContentField = SimpleField | ListField;

export type ListItem = Record<string, string>;
export type SectionValue = string | ListItem[];
export type SectionValues = Record<string, SectionValue>;

export interface SectionSchema {
  key: string;
  page: "home" | "faqs" | "about";
  label: string;
  /** Shown under the section heading in admin, to say where on the page this lands. */
  description: string;
  /**
   * False for sections the page cannot render without (the hero). Everything else gets a
   * "Show this section" toggle so the client can retire a section without deleting its copy.
   */
  canHide: boolean;
  fields: ContentField[];
  defaults: SectionValues;
}

export function isListField(field: ContentField): field is ListField {
  return field.type === "list";
}

// ─── Reading values ───────────────────────────────────────────────────────────
// Stored values are JSON, so a section that was saved before a field existed simply has no key for
// it. These readers always return the schema's default rather than an empty string, which is why a
// storefront section can never render a blank heading.

export function text(values: SectionValues, name: string): string {
  const value = values[name];
  return typeof value === "string" ? value : "";
}

export function list(values: SectionValues, name: string): ListItem[] {
  const value = values[name];
  return Array.isArray(value) ? value : [];
}

export function number(values: SectionValues, name: string, fallback: number): number {
  const parsed = Number.parseInt(text(values, name), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Textarea copy renders as separate lines/paragraphs; blank-line-separated blocks are paragraphs. */
export function lines(value: string): string[] {
  return value.split("\n").map((line) => line.trim());
}

export function paragraphs(value: string): string[] {
  return value
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}

// ─── Normalising ──────────────────────────────────────────────────────────────

const MAX_TEXT = 4000;
const MAX_LIST_ITEMS = 24;

/**
 * Overlay stored JSON on the schema defaults, keeping only fields the schema declares. Used on
 * both sides: reading (so an old row still renders) and writing (so a hand-crafted POST cannot
 * store arbitrary keys or non-string values that would then be rendered).
 */
export function normaliseValues(schema: SectionSchema, stored: unknown): SectionValues {
  const raw = (stored && typeof stored === "object" && !Array.isArray(stored)
    ? (stored as Record<string, unknown>)
    : {}) as Record<string, unknown>;

  const result: SectionValues = {};

  for (const field of schema.fields) {
    const value = raw[field.name];

    if (isListField(field)) {
      if (!Array.isArray(value)) {
        result[field.name] = cloneList(schema.defaults[field.name]);
        continue;
      }
      const max = field.max ?? MAX_LIST_ITEMS;
      result[field.name] = value.slice(0, max).map((entry) => {
        const item = (entry && typeof entry === "object" ? entry : {}) as Record<string, unknown>;
        const cleaned: ListItem = {};
        for (const sub of field.fields) {
          cleaned[sub.name] = toText(item[sub.name]);
        }
        return cleaned;
      });
      continue;
    }

    result[field.name] =
      typeof value === "string" ? toText(value) : (schema.defaults[field.name] as string) ?? "";
  }

  return result;
}

/**
 * Fold a submitted section over the one already saved: a text, link or image field left empty
 * keeps the wording that is on the page, so a section can be saved after one line is corrected
 * without the rest of the panel having to be retyped. `cleared` carries the fields whose Clear
 * button was actually pressed — the only way to empty one on purpose.
 *
 * Repeatable rows are left exactly as submitted. They are added, reordered and deleted by hand in
 * the editor, so a row that is gone is a row the client removed, and an index in this save need
 * not describe the same slide or tile as the same index in the last one.
 */
export function mergeSectionValues(
  schema: SectionSchema,
  submitted: SectionValues,
  stored: unknown,
  cleared: readonly string[] = [],
): SectionValues {
  const previous = normaliseValues(schema, stored);
  const merged: SectionValues = { ...submitted };

  for (const field of schema.fields) {
    if (isListField(field)) continue;
    const value = merged[field.name];
    if (typeof value === "string" && value.trim() === "" && !cleared.includes(field.name)) {
      merged[field.name] = previous[field.name];
    }
  }

  return merged;
}

function toText(value: unknown): string {
  return typeof value === "string" ? value.slice(0, MAX_TEXT) : "";
}

function cloneList(value: SectionValue | undefined): ListItem[] {
  return Array.isArray(value) ? value.map((item) => ({ ...item })) : [];
}

/** A fresh, empty row for a list field — every declared sub-field present so inputs stay controlled. */
export function emptyListItem(field: ListField): ListItem {
  return Object.fromEntries(field.fields.map((sub) => [sub.name, ""]));
}

// ─── Field shorthands ─────────────────────────────────────────────────────────

const f = {
  text: (name: string, label: string, help?: string): SimpleField => ({ name, label, type: "text", help }),
  area: (name: string, label: string, help?: string): SimpleField => ({ name, label, type: "textarea", help }),
  image: (name: string, label: string, help?: string): SimpleField => ({ name, label, type: "image", help }),
  link: (name: string, label: string, help?: string): SimpleField => ({ name, label, type: "link", help }),
  count: (name: string, label: string, help?: string): SimpleField => ({ name, label, type: "number", help }),
  icon: (name: string, label: string, help?: string): SimpleField => ({ name, label, type: "icon", help }),
  social: (name: string, label: string, help?: string): SimpleField => ({ name, label, type: "social", help }),
};

// ─── The sections ─────────────────────────────────────────────────────────────

export const SECTIONS: SectionSchema[] = [
  {
    key: "home_hero",
    page: "home",
    label: "Hero",
    description:
      "The full-screen slider at the top of the homepage. The slides themselves are the “Homepage Hero Slider” banners in Admin → Banners; the copy on the glass card is below.",
    canHide: false,
    fields: [
      f.area("heading", "Heading", "One line per line break — shown stacked, exactly as typed."),
      f.text("tagline", "Tagline"),
      f.text("ctaLabel", "Button label"),
      f.link("ctaHref", "Button link"),
      f.text("reviewsLabel", "Side tab label", "The vertical tab pinned to the left edge."),
      f.link("reviewsHref", "Side tab link"),
      {
        name: "fallbackSlides",
        label: "Fallback slides",
        type: "list",
        itemLabel: "Slide",
        max: 6,
        help: "Only used while no “Homepage Hero Slider” banner is active in Admin → Banners, so the hero is never blank.",
        fields: [
          f.image("src", "Image"),
          f.text("alt", "Alt text"),
          f.link("href", "Link (optional)"),
        ],
      },
    ],
    defaults: {
      heading: "Come Home\nto your\nSoulmate",
      tagline: "Because God created us in pairs...",
      ctaLabel: "Discover More",
      ctaHref: "/products",
      reviewsLabel: "Reviews",
      reviewsHref: "/reviews",
      fallbackSlides: [
        {
          src: "/images/banners/hero-1.png",
          alt: "Two ivory mirror-inlay Everly White plates on gold stands, styled on a marble console in a blush-pink living room",
          href: "",
        },
        {
          src: "/images/banners/hero-2.png",
          alt: "An Everly White gift set — two gold-and-ivory mandala plates on stands beside the branded gift box, drawstring pouch, bag and card",
          href: "",
        },
      ],
    },
  },

  {
    key: "home_center",
    page: "home",
    label: "Center of the Universe",
    description: "The centred statement with two buttons, directly under the hero.",
    canHide: true,
    fields: [
      f.text("eyebrow", "Eyebrow"),
      f.area("heading", "Heading"),
      f.text("primaryLabel", "Primary button label"),
      f.link("primaryHref", "Primary button link"),
      f.text("secondaryLabel", "Secondary button label"),
      f.link("secondaryHref", "Secondary button link"),
    ],
    defaults: {
      eyebrow: "Center of the Universe",
      heading: "Luxe designs that are loud in the eyes, quiet in the essence",
      primaryLabel: "Shop Now",
      primaryHref: "/products",
      secondaryLabel: "See our Collection",
      secondaryHref: "/collection/center-of-the-universe",
    },
  },

  {
    key: "home_categories",
    page: "home",
    label: "Shop by Category",
    description:
      "The category tiles. Published collections come from Admin → Collections automatically; the tiles below are added after them.",
    canHide: true,
    fields: [
      f.text("heading", "Heading"),
      f.image("fallbackImage", "Fallback tile image", "Used for a collection that has no image of its own."),
      {
        name: "upcoming",
        label: "Extra tiles",
        type: "list",
        itemLabel: "Tile",
        max: 8,
        help: "For collections that are not published in Admin → Collections yet.",
        fields: [
          f.text("name", "Name"),
          f.image("image", "Image"),
          f.link("href", "Link"),
          f.text("badge", "Badge (optional)"),
        ],
      },
    ],
    defaults: {
      heading: "Shop By Category",
      fallbackImage: "/images/banners/category-1.jpeg",
      upcoming: [
        {
          name: "Celestial Bloom",
          image: "/images/banners/category-2.png",
          href: "/products?collection=celestial-bloom",
          badge: "Coming Soon",
        },
      ],
    },
  },

  {
    key: "home_bestsellers",
    page: "home",
    label: "Bestsellers",
    description:
      "The bestsellers heading, the wide “About Us” banner, and the product row beneath it.",
    canHide: true,
    fields: [
      f.text("eyebrow", "Eyebrow"),
      f.area("heading", "Heading", "One line per line break."),
      f.image("bannerImage", "Banner image"),
      f.text("bannerAlt", "Banner alt text"),
      f.link("bannerHref", "Banner link"),
      f.text("bannerEyebrow", "Banner card eyebrow"),
      f.area("bannerText", "Banner card text"),
      f.count("productLimit", "How many products to show"),
    ],
    defaults: {
      eyebrow: "Our Bestsellers",
      heading: "Some things aren’t\njust meant to be seen —\nthey’re meant to be held.",
      bannerImage: "/images/banners/about-overlap.png",
      bannerAlt: "About Us",
      bannerHref: "/about",
      bannerEyebrow: "About Us",
      bannerText: "The light bearers of a cosmic luxe lifestyle",
      productLimit: "4",
    },
  },

  {
    key: "home_elevate",
    page: "home",
    label: "Elevate Your Experience",
    description:
      "The tall centre image with feature bullets either side. The first half of the list sits on the left, the rest on the right.",
    canHide: true,
    fields: [
      f.text("eyebrow", "Eyebrow"),
      f.area("heading", "Heading"),
      f.image("image", "Centre image"),
      f.text("imageAlt", "Centre image alt text"),
      {
        name: "features",
        label: "Features",
        type: "list",
        itemLabel: "Feature",
        max: 8,
        help: "Split evenly down the two columns, in order.",
        fields: [
          f.text("title", "Title"),
          f.area("description", "Description"),
          f.icon("icon", "Icon"),
        ],
      },
    ],
    defaults: {
      eyebrow: "Elevate Your Home Decor Experience",
      heading:
        "Step into the universe of bold minimalism where emotions come alive as soon as you step into your home",
      image: "/images/banners/elevate-centered.png",
      imageAlt: "Elevate Your Home Decor Experience",
      features: [
        {
          title: "Detailed Craftsmanship",
          description: "High-end materials, sophisticated craftsmanship for the discerning eye.",
          icon: "Clock",
        },
        {
          title: "Bespoke Collection",
          description: "Limited edition designs that focus on bold minimalism and timeless luxury.",
          icon: "Star",
        },
        {
          title: "Creative Freedom",
          description:
            "From the door closing behind you to the peace setting in — discover the magic of truly being home.",
          icon: "Feather",
        },
        {
          title: "Timeless Artistry",
          description: "Where each piece transcends your home into a portal for higher consciousness.",
          icon: "CircleCheck",
        },
      ],
    },
  },

  {
    key: "home_video",
    page: "home",
    label: "In Motion",
    description: "The three tall tiles with a play button.",
    canHide: true,
    fields: [
      f.text("eyebrow", "Eyebrow"),
      f.text("heading", "Heading"),
      {
        name: "clips",
        label: "Tiles",
        type: "list",
        itemLabel: "Tile",
        max: 6,
        fields: [
          f.image("image", "Image"),
          f.text("caption", "Caption"),
          f.text(
            "objectPosition",
            "Image focus (optional)",
            "CSS object-position, e.g. “80% 60%”. Leave blank to centre the crop.",
          ),
        ],
      },
    ],
    defaults: {
      eyebrow: "In Motion",
      heading: "See the Craft Come to Life",
      clips: [
        {
          image: "/images/products/twin-flames/1-pair.jpg",
          caption: "100 Hours of Handcraft",
          objectPosition: "",
        },
        {
          image: "/images/instagram/product-coffee-table.jpg",
          caption: "Styled: Center of the Universe",
          objectPosition: "",
        },
        {
          image: "/images/brand/packaging-flatlay.jpg",
          caption: "Unboxing: Twin Flames",
          objectPosition: "80% 60%",
        },
      ],
    },
  },

  {
    key: "home_collections",
    page: "home",
    label: "Collection Tabs",
    description: "The tabbed product grid on the beige band.",
    canHide: true,
    fields: [
      f.text("eyebrow", "Eyebrow"),
      f.area("heading", "Heading"),
      f.text("primaryTabLabel", "First tab label"),
      f.text("secondaryTabLabel", "Second tab label", "Leave blank to show a single tab."),
      f.text("secondaryTabMessage", "Second tab message"),
      f.text("ctaLabel", "Button label"),
      f.link("ctaHref", "Button link"),
      f.count("productLimit", "How many products to show"),
    ],
    defaults: {
      eyebrow: "Dive into the world of Everly White",
      heading: "Find your calm — discover peace in every piece",
      primaryTabLabel: "CENTER OF THE UNIVERSE",
      secondaryTabLabel: "(Coming Soon)",
      secondaryTabMessage: "Coming soon.",
      ctaLabel: "Discover More",
      ctaHref: "/collection/center-of-the-universe",
      productLimit: "4",
    },
  },

  {
    key: "home_testimonials",
    page: "home",
    label: "Testimonials",
    description:
      "The review cards. Which reviews appear is decided in Admin → Reviews — photo reviews are preferred. The section hides itself when no review is approved.",
    canHide: true,
    fields: [
      f.text("eyebrow", "Eyebrow"),
      f.area("heading", "Heading"),
      f.text("ctaLabel", "Button label"),
      f.link("ctaHref", "Button link"),
      f.count("reviewLimit", "How many reviews to show"),
    ],
    defaults: {
      eyebrow: "Testimonials",
      heading: "Play with lights, colors! Show us your creativity to get featured on our website.",
      ctaLabel: "See All",
      ctaHref: "/reviews",
      reviewLimit: "3",
    },
  },

  {
    key: "home_journal",
    page: "home",
    label: "Journal",
    description:
      "The blog teaser pair. Which posts appear is decided by “Feature on homepage” in Admin → Blog.",
    canHide: true,
    fields: [
      f.text("eyebrow", "Eyebrow"),
      f.area("heading", "Heading"),
      f.count("postLimit", "How many posts to show"),
    ],
    defaults: {
      eyebrow: "Blog",
      heading:
        "Embrace the Laid-Back Luxury lifestyle — a peaceful home where emotions elevate beyond the senses.",
      postLimit: "2",
    },
  },

  {
    key: "home_instagram",
    page: "home",
    label: "Instagram",
    description: "The Instagram tile grid. Every tile links to the profile URL below.",
    canHide: true,
    fields: [
      f.text("heading", "Heading"),
      f.text("handle", "Handle"),
      f.link("profileUrl", "Profile URL"),
      {
        name: "tiles",
        label: "Tiles",
        type: "list",
        itemLabel: "Tile",
        max: 9,
        help: "On desktop the middle tile of the list is the tall centre one; the tiles before it fill the left column and the ones after it the right.",
        fields: [f.image("src", "Image"), f.text("alt", "Alt text")],
      },
    ],
    defaults: {
      heading: "Join our Instagram community",
      handle: "@everlywhitestudios",
      profileUrl: "https://www.instagram.com/everlywhitestudios/",
      tiles: [
        {
          src: "/images/instagram/craft-process.jpg",
          alt: "Hand-setting mirror work on an Everly White plate",
        },
        {
          src: "/images/instagram/lifestyle-sofa.jpg",
          alt: "Everly White plates styled on a living room coffee table",
        },
        {
          src: "/images/instagram/product-display.jpg",
          alt: "Everly White plates displayed on gold stands",
        },
        {
          src: "/images/instagram/product-coffee-table.jpg",
          alt: "Everly White plates on a coffee table with candles",
        },
        {
          src: "/images/instagram/product-marble-counter.jpg",
          alt: "Everly White plates on a marble countertop",
        },
      ],
    },
  },

  {
    key: "home_newsletter",
    page: "home",
    label: "Newsletter",
    description: "The signup band. Subscribers land in Admin → Newsletter.",
    canHide: true,
    fields: [
      f.text("heading", "Heading"),
      f.area("body", "Body", "One line per line break."),
      f.text("placeholder", "Input placeholder"),
      f.text("buttonLabel", "Button label"),
    ],
    defaults: {
      heading: "Subscribe To Our Newsletter",
      body: "Be the first to know about our new collections, lifestyle inspirations, Members-only exclusives and much more.\nAlso get a 5% Coupon code on your email for your first purchase.",
      placeholder: "Enter your email",
      buttonLabel: "Subscribe",
    },
  },

  {
    key: "site_trust_bar",
    page: "home",
    label: "Trust Bar",
    description:
      "The promises on the pink band at the very bottom. This band is shared — it also sits at the foot of the products page and every product page — so edits and the visibility toggle apply to all three.",
    canHide: true,
    fields: [
      {
        name: "items",
        label: "Promises",
        type: "list",
        itemLabel: "Promise",
        max: 6,
        fields: [f.icon("icon", "Icon"), f.text("title", "Title"), f.area("body", "Body")],
      },
    ],
    defaults: {
      items: [
        {
          icon: "Hand",
          title: "Handcrafted in India",
          body: "Every piece shaped by hand, never by machine.",
        },
        { icon: "Truck", title: "Free Shipping", body: "Complimentary delivery across India." },
        {
          icon: "Award",
          title: "Limited Edition",
          body: "Small-batch collections, never mass produced.",
        },
      ],
    },
  },

  {
    key: "faq_hero",
    page: "faqs",
    label: "FAQ Hero",
    description: "The banner and glass card at the top of /faqs.",
    canHide: false,
    fields: [
      f.text("breadcrumbLabel", "Breadcrumb label"),
      f.text("eyebrow", "Eyebrow"),
      f.text("heading", "Heading"),
      f.area("intro", "Intro", "Hidden on small phones, where the card has no room for it."),
      f.image(
        "image",
        "Banner image",
        "Used unless a “FAQ Page Hero” banner is active in Admin → Banners.",
      ),
      f.text("imageAlt", "Banner alt text"),
    ],
    defaults: {
      breadcrumbLabel: "FAQs",
      eyebrow: "Need Some Help?",
      heading: "Frequently Asked Questions",
      intro: "Everything you need to know about ordering, shipping, and living with Everly White.",
      image: "/images/instagram/insta-window.jpg",
      imageAlt: "A softly lit Everly White plate styled by a window",
    },
  },

  {
    key: "faq_cta",
    page: "faqs",
    label: "FAQ Footer CTA",
    description: "The “still have questions” band below the answers.",
    canHide: true,
    fields: [
      f.text("eyebrow", "Eyebrow"),
      f.text("heading", "Heading"),
      f.area("body", "Body"),
      f.text("buttonLabel", "Button label"),
      f.link("buttonHref", "Button link"),
    ],
    defaults: {
      eyebrow: "Still Have Questions?",
      heading: "We’re here to help.",
      body: "Can’t find what you’re looking for? Reach out and our team will get back to you personally.",
      buttonLabel: "Contact Us",
      buttonHref: "/contact",
    },
  },

  // ─── About Us ───────────────────────────────────────────────────────────────

  {
    key: "about_hero",
    page: "about",
    label: "About Hero",
    description: "The banner and glass card at the top of /about.",
    canHide: false,
    fields: [
      f.text("breadcrumbLabel", "Breadcrumb label"),
      f.text("eyebrow", "Eyebrow"),
      f.text("heading", "Heading"),
      f.area("intro", "Intro", "Hidden on small phones, where the card has no room for it."),
      f.image(
        "image",
        "Banner image",
        "Used unless an “About Us Page Hero” banner is active in Admin → Banners.",
      ),
      f.text("imageAlt", "Banner alt text"),
    ],
    defaults: {
      breadcrumbLabel: "About Us",
      eyebrow: "The House of Everly White",
      heading: "About Us",
      intro: "A longing — not for more things, but for meaning in the things we live with.",
      image: "/images/banners/about-signage.jpg",
      imageAlt: "Everly White gold signage on a studio wall",
    },
  },

  {
    key: "about_story",
    page: "about",
    label: "Our Story",
    description: "The two-column philosophy and craft block under the hero.",
    canHide: true,
    fields: [
      f.text("eyebrow", "Eyebrow"),
      f.area("heading", "Heading"),
      f.text("philosophyTitle", "Left column title"),
      f.area("philosophyBody", "Left column text", "Leave a blank line between paragraphs."),
      f.text("craftTitle", "Right column title"),
      f.area("craftBody", "Right column text", "Leave a blank line between paragraphs."),
      {
        name: "craftFeatures",
        label: "Right column badges",
        type: "list",
        itemLabel: "Badge",
        max: 4,
        help: "The small icon-and-label pairs below the right column.",
        fields: [f.icon("icon", "Icon"), f.text("label", "Label")],
      },
    ],
    defaults: {
      eyebrow: "Our Story",
      heading: "Life extends far beyond the material.",
      philosophyTitle: "The Philosophy",
      philosophyBody:
        "Everly White was born from a longing — not for more things, but for meaning in the things we live with. We believe true richness is found beyond the material, in a deeper awareness of the universe and our place within it.\n\nEvery piece we create is a quiet invitation: to slow down, to notice, to connect with something larger than ourselves.",
      craftTitle: "The Craft",
      craftBody:
        "True luxury is not just measured by what’s around you — but by what’s inside you. We favor bold minimalism, handmade imperfection, and patience over speed in every piece we create.",
      craftFeatures: [
        { icon: "Hand", label: "100% Handcrafted" },
        { icon: "Leaf", label: "Considered Materials" },
      ],
    },
  },

  {
    key: "about_quote",
    page: "about",
    label: "Creative Freedom",
    description: "The pink quote panel beside the brand-film still.",
    canHide: true,
    fields: [
      f.text("eyebrow", "Eyebrow"),
      f.area("quote", "Quote"),
      f.image("image", "Image"),
      f.text("imageAlt", "Image alt text"),
      f.text("videoLabel", "Label under the play button"),
      f.link(
        "videoHref",
        "Film link (optional)",
        "Leave blank and the play button stays decorative, as it is today. Add a link and it becomes clickable.",
      ),
    ],
    defaults: {
      eyebrow: "Creative Freedom",
      quote:
        "“Creativity is sacred freedom — not bound by trends, but guided by intuition.” Limited, bespoke, and preserved in rarity.",
      image: "/images/instagram/product-coffee-table.jpg",
      imageAlt: "Everly White plates styled on a coffee table",
      videoLabel: "Brand Film",
      videoHref: "",
    },
  },

  {
    key: "about_founder",
    page: "about",
    label: "Meet the Founder",
    description: "The founder portrait, her letter, the small gallery and the studio social links.",
    canHide: true,
    fields: [
      f.image("image", "Portrait"),
      f.text("imageAlt", "Portrait alt text"),
      f.text("eyebrow", "Eyebrow"),
      f.text("heading", "Heading"),
      f.area("body", "Letter", "Leave a blank line between paragraphs."),
      f.area("quote", "Pull quote"),
      f.text("quoteTagline", "Line under the pull quote"),
      f.text("name", "Name"),
      f.text("role", "Role"),
      f.text("galleryLabel", "Gallery label"),
      {
        name: "gallery",
        label: "Gallery",
        type: "list",
        itemLabel: "Photo",
        max: 6,
        help: "Shown three to a row as squares.",
        fields: [f.image("image", "Image"), f.text("alt", "Alt text")],
      },
      f.text("socialsLabel", "Social links label"),
      {
        name: "socials",
        label: "Social links",
        type: "list",
        itemLabel: "Link",
        max: 6,
        fields: [f.social("icon", "Icon"), f.text("label", "Name"), f.link("href", "Link")],
      },
    ],
    defaults: {
      image: "/images/about/founder.jpg",
      imageAlt: "Aoksana Bhuyan, Founder & Creative Director of Everly White",
      eyebrow: "The Founder",
      heading: "Meet the Founder",
      body: "Everly White began with a simple belief: the things we choose to surround ourselves with should do more than just decorate our homes. They should remind us of what we believe, what we love, and who we’re becoming. To see beyond what’s visible to our mere eyes, every collection we create is an exploration of the invisible threads that connect people, places, and moments, brought to life through thoughtful design and patient craftsmanship. We don’t claim to have all the answers. We simply invite you to pause, wonder, and create a home that reflects not just your style, but your soul.",
      quote: "“Luxury isn’t what fills a home. It’s what gives it meaning.”",
      quoteTagline: "“Come Home To Your Soulmate”",
      name: "Aoksana Bhuyan",
      role: "Founder & Creative Director",
      galleryLabel: "Gallery",
      gallery: [
        { image: "/images/instagram/insta-window.jpg", alt: "" },
        { image: "/images/instagram/insta-card.jpg", alt: "" },
        { image: "/images/instagram/insta-chair.jpg", alt: "" },
      ],
      socialsLabel: "Follow the Studio",
      socials: [
        {
          icon: "Instagram",
          label: "Instagram",
          href: "https://www.instagram.com/everlywhitestudios/",
        },
        { icon: "Threads", label: "Threads", href: "https://www.threads.net/@everlywhitestudios" },
        { icon: "WhatsApp", label: "WhatsApp", href: "https://wa.me/message/OEJJOG6DF762J1" },
      ],
    },
  },

  {
    key: "about_values",
    page: "about",
    label: "Core Values",
    description: "The row of value cards.",
    canHide: true,
    fields: [
      f.text("eyebrow", "Eyebrow"),
      f.text("heading", "Heading"),
      {
        name: "items",
        label: "Values",
        type: "list",
        itemLabel: "Value",
        max: 6,
        fields: [f.icon("icon", "Icon"), f.text("title", "Title"), f.area("body", "Body")],
      },
    ],
    defaults: {
      eyebrow: "Core Values",
      heading: "What we build our name on.",
      items: [
        {
          icon: "CircleCheck",
          title: "Authenticity",
          body: "Genuine craftsmanship, made with an unwavering commitment to integrity — never a shortcut, never a substitute.",
        },
        {
          icon: "Gem",
          title: "Exclusivity",
          body: "Created for those who feel it, not those chasing status — rarity as a form of respect for the wearer.",
        },
        {
          icon: "Sparkles",
          title: "Cosmic Luxe Experience",
          body: "Where esoteric wisdom meets artisanal mastery — luxury that is loud in the eyes, quiet in the essence.",
        },
      ],
    },
  },

  {
    key: "about_commitment",
    page: "about",
    label: "The Commitment",
    description: "The pink band with the overlapping pair of photos.",
    canHide: true,
    fields: [
      f.text("eyebrow", "Eyebrow"),
      f.area("heading", "Heading"),
      f.area("body", "Body"),
      f.text("linkLabel", "Link label"),
      f.link("linkHref", "Link", "“#craft” jumps down to the founder block on this page."),
      f.image("backImage", "Large photo"),
      f.text("backImageAlt", "Large photo alt text"),
      f.image("frontImage", "Overlapping photo"),
      f.text("frontImageAlt", "Overlapping photo alt text"),
    ],
    defaults: {
      eyebrow: "The Commitment",
      heading: "Coming home to higher conscience.",
      body: "At Everly White, coming home means arriving at something deeper — not just material luxury, but a quiet return to yourself. We don’t create for everyone; we create for those who feel it, and we hold every collection to that same quiet standard.",
      linkLabel: "Learn More",
      linkHref: "#craft",
      backImage: "/images/instagram/product-marble-counter.jpg",
      backImageAlt: "Everly White plates on a marble counter",
      frontImage: "/images/products/twin-flames-2.png",
      frontImageAlt: "Everly White Twin Flames plates",
    },
  },

  {
    key: "site_come_closer",
    page: "about",
    label: "Come Closer CTA",
    description:
      "The cream band with the two buttons. This band is shared — it also closes every collection page and the reviews page — so edits and the visibility toggle apply to all of them.",
    canHide: true,
    fields: [
      f.text("eyebrow", "Eyebrow"),
      f.text("heading", "Heading"),
      f.area("body", "Body"),
      f.text("primaryLabel", "Primary button label"),
      f.link("primaryHref", "Primary button link"),
      f.text("secondaryLabel", "Secondary button label"),
      f.link("secondaryHref", "Secondary button link"),
    ],
    defaults: {
      eyebrow: "Come Closer",
      heading: "Step into the Cosmic Luxe Experience.",
      body: "We don’t create for everyone. We create for those who feel it — join a small, intentional community built around pieces that mean something.",
      primaryLabel: "Explore Products",
      primaryHref: "/products",
      secondaryLabel: "Explore Our Community",
      secondaryHref: "https://www.instagram.com/everlywhitestudios/",
    },
  },
];

export const SECTIONS_BY_KEY: Record<string, SectionSchema> = Object.fromEntries(
  SECTIONS.map((section) => [section.key, section]),
);

export function sectionsForPage(page: SectionSchema["page"]): SectionSchema[] {
  return SECTIONS.filter((section) => section.page === page);
}
