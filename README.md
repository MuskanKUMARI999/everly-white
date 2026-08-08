# Everly White

Marketing site for Everly White, built with Next.js (App Router) and Tailwind CSS v4.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it.

## Design system

Design tokens (colors, fonts) are defined in `src/app/globals.css` under `@theme inline`, sourced from the Figma design (built at a 1440px desktop canvas).

- **Fonts:** Cinzel (headings) + EB Garamond (body), loaded via `next/font/google` in `src/app/layout.tsx`.
- **Colors:** `pink-100/200/300`, `brown`, `beige-light`, `neutral-50…500` — see `globals.css`.
- **Content width:** pages are built in a 1240px column with fluid gutters (matches the 1440px Figma frame).
- **Breakpoints:** standard Tailwind scale (`sm` 640 / `md` 768 / `lg` 1024 / `xl` 1280 / `2xl` 1536) — covers mobile through large desktop around the 1440px design.

Early static HTML mockups explored during design are kept in [`design-reference/`](./design-reference) for reference; they are not part of the app build.

## Project structure

```
src/
  app/            routes (App Router)
  components/
    layout/       header, footer, nav
    sections/     page-level content blocks
    ui/           small reusable primitives (buttons, etc.)
  lib/            helpers, constants
public/
  images/
  fonts/
```

## Learn More

## Backend

See [`supabase/README.md`](./supabase/README.md) for Supabase setup, schema, and migration instructions.
