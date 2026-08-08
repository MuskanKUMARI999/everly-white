# Supabase Backend

This project uses [Supabase](https://supabase.com) for backend services: PostgreSQL database, Auth, and (optionally) Storage.

## Setup

1. Create a new Supabase project at [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Go to **Project Settings → API** and copy:
   - `URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret; server-side only)
3. Copy `.env.example` to `.env.local` and fill in the values:
   ```bash
   cp .env.example .env.local
   ```
4. Open the Supabase **SQL Editor** and run the migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_seed_data.sql`
5. (Optional) Enable **Email Auth** in Authentication → Providers if you want user accounts.

## Project Structure

```
supabase/
  migrations/      SQL schema and seed files
src/lib/supabase/
  client.ts      Browser client (use in Client Components)
  server.ts      Server client with cookie handling (use in Server Components / Actions)
  middleware.ts  Session refresh middleware
middleware.ts    Next.js middleware that wires up Supabase session refresh
```

## Client Usage

**Server Component / Server Action:**
```ts
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
const { data } = await supabase.from("products").select("*");
```

**Client Component:**
```ts
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
supabase.auth.signInWithPassword({ email, password });
```

## Schema Overview

| Table | Purpose |
|-------|---------|
| `collections` | Product collections (e.g., "Center of the Universe") |
| `products` | Individual pieces, linked to a collection |
| `product_images` | Additional PDP gallery images |
| `blog_posts` | Journal / blog articles with JSON content blocks |
| `reviews` | Customer testimonials |
| `contact_inquiries` | Contact form submissions |
| `newsletter_subscribers` | Newsletter mailing list |
| `profiles` | User profiles (extends `auth.users`) |
| `orders` | Placed orders (guest + signed-in) |
| `order_items` | Line items for each order |

## Row Level Security

- Public content (`collections`, `products`, `blog_posts`, `reviews`) is readable by everyone.
- Forms (`contact_inquiries`, `newsletter_subscribers`, `orders`) allow public inserts but restrict reads to authenticated admins.
- Profiles and orders are scoped to the owning user.

## Generating Types

Once your Supabase project is live, install the Supabase CLI and generate TypeScript types:

```bash
npx supabase login
npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > src/lib/supabase/database.types.ts
```

Then replace the `Database` import in `client.ts` / `server.ts` if you want full type safety.
