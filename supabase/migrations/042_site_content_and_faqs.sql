-- The homepage and the FAQ page become editable from the admin panel.
--
-- Until now every heading, tile, image caption, button label and FAQ answer on those two pages was
-- hardcoded in its React component: changing a word meant a code edit and a redeploy. Two new
-- stores fix that:
--
--   site_content  — one row per page section, copy held as JSONB. The shape of each row is
--                   declared in src/lib/content/sections.ts, which is also what renders the admin
--                   form, so a new editable field needs no migration. A missing row is not an
--                   error: the storefront falls back to the schema defaults, which reproduce the
--                   original copy exactly. That is why nothing here seeds it — leaving it empty
--                   keeps the site looking identical until someone actually edits something.
--
--   faq_categories / faq_items — the FAQ accordion, seeded below with the copy that was in
--                   src/components/faq/faqData.tsx so the page is not blank after this runs.
--
-- Re-runnable: the tables are IF NOT EXISTS and the FAQ seed is skipped once any category exists,
-- so running this a second time cannot duplicate or overwrite the client's own edits.


-- ─── 1. Section content ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS site_content (
  key TEXT PRIMARY KEY,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- "Show this section" in admin. Sections the page cannot render without (the heroes) declare
  -- canHide: false in the schema and never expose the toggle.
  is_visible BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.site_content TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can read site content" ON public.site_content;
CREATE POLICY "Anyone can read site content" ON public.site_content
  FOR SELECT TO anon, authenticated USING (true);

-- Writes are admin-only and go through the service-role client, which bypasses RLS. No INSERT,
-- UPDATE or DELETE policy is granted here on purpose.


-- ─── 2. FAQs ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS faq_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS faq_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES faq_categories(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  -- Plain text, with [label](/path) for inline links — the same markdown-style syntax the admin
  -- form documents. Rendered by src/components/ui/RichText.tsx, which routes internal paths
  -- through next/link and opens external URLs in a new tab.
  answer TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_faq_items_category ON faq_items(category_id);

ALTER TABLE faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.faq_categories TO anon, authenticated;
GRANT SELECT ON public.faq_items TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can read active faq categories" ON public.faq_categories;
CREATE POLICY "Anyone can read active faq categories" ON public.faq_categories
  FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can read active faq items" ON public.faq_items;
CREATE POLICY "Anyone can read active faq items" ON public.faq_items
  FOR SELECT TO anon, authenticated USING (is_active = true);


-- ─── 3. Seed the FAQs that were hardcoded in faqData.tsx ──────────────────────
-- Guarded on the table being empty, so a re-run never duplicates a question and never resurrects
-- one the client deleted.

DO $seed$
DECLARE
  craft_id UUID;
  orders_id UUID;
  returns_id UUID;
  discounts_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM faq_categories) THEN
    RETURN;
  END IF;

  INSERT INTO faq_categories (title, position) VALUES ('Our Craft', 0) RETURNING id INTO craft_id;
  INSERT INTO faq_categories (title, position) VALUES ('Orders & Shipping', 1) RETURNING id INTO orders_id;
  INSERT INTO faq_categories (title, position) VALUES ('Returns & Packaging', 2) RETURNING id INTO returns_id;
  INSERT INTO faq_categories (title, position) VALUES ('Discounts', 3) RETURNING id INTO discounts_id;

  INSERT INTO faq_items (category_id, question, answer, position) VALUES
    (craft_id, $q$Where is your product made?$q$,
     $a$All of our pieces are handmade and curated in small batches within our Mumbai & Guwahati studios. We're proud that 80% of our product and materials are locally sourced within India.$a$, 0),
    (craft_id, $q$How do I care for my product?$q$,
     $a$Wipe gently with a soft, dry cloth. Avoid water, harsh chemicals, and direct sunlight for extended periods, as these can affect the hand-finished surface and mirror inlay. As this item is fragile, please handle it with care, just as you would any glassware.$a$, 1),
    (craft_id, $q$Is your process friendly to the environment?$q$,
     $a$Yes. We work in small batches to avoid overproduction, source the majority of our materials locally, and pack every order in recyclable, plastic-free materials wherever possible.$a$, 2),
    (craft_id, $q$Do you take custom orders?$q$,
     $a$We do. From size to finish to mirror pattern, our studio welcomes bespoke commissions for those seeking something made entirely for them. Please feel free to reach out to us via our [contact page](/contact).$a$, 3),

    (orders_id, $q$How do I place an order?$q$,
     $a$Browse our collection, add your chosen pieces to the cart, and check out securely online. You'll receive an order confirmation by email the moment your purchase is complete.$a$, 0),
    (orders_id, $q$What payment methods do you accept?$q$,
     $a$We accept all major credit and debit cards, UPI, and net banking. All transactions are encrypted and processed through a secure payment gateway.$a$, 1),
    (orders_id, $q$How long does delivery take?$q$,
     $a$Most orders arrive within 8–10 business days. Bespoke and made-to-order pieces may take longer, as each one is handcrafted after your order is placed — we'll share an estimated timeline at checkout.$a$, 2),
    (orders_id, $q$Is shipping really free?$q$,
     $a$Yes. We offer complimentary shipping on all orders across India, with no minimum order value. For all orders outside India, please reach out to us via [WhatsApp](https://wa.me/message/OEJJOG6DF762J1).$a$, 3),
    (orders_id, $q$How can I track my order?$q$,
     $a$Once your order ships, you'll receive a tracking link by email so you can follow its journey to your door.$a$, 4),

    (returns_id, $q$What is your return policy?$q$,
     $a$Considering the time and effort that goes into the production of each item, we do not offer returns, exchanges, or cancellations once a purchase is made. Exact sizing and details are listed in every product description, so please review images and descriptions carefully before ordering — every piece is also checked by our quality team before it ships. See our full [return policy](/return) for details.$a$, 0),
    (returns_id, $q$My piece arrived damaged — what do I do?$q$,
     $a$Register a complaint within 24 hours of delivery via our contact page. To be eligible for a refund or replacement, record a video of opening the package showing the defective or missing item, and share your order number along with the video — our team will respond within 2–5 working days.$a$, 1),
    (returns_id, $q$Can I exchange a piece for a different design?$q$,
     $a$We're unable to offer exchanges, as exact sizing and details are listed in every product description and each piece is checked for defects before it ships. If your piece arrives damaged or defective, we'll make it right — see our return policy for how to register a complaint.$a$, 2),
    (returns_id, $q$How are the pieces packaged?$q$,
     $a$Every piece is hand-wrapped and cushioned in our signature packaging, designed to protect delicate mirror work and handcrafted details in transit.$a$, 3),

    (discounts_id, $q$Do you offer a discount for first-time customers?$q$,
     $a$Yes — first-time customers get 5% off their first order. Use code WELCOME5 at checkout to apply the discount.$a$, 0),
    (discounts_id, $q$Do you run seasonal sales or offers?$q$,
     $a$We occasionally run limited-time offers around festive and seasonal moments. Subscribe to our newsletter or follow us on Instagram to hear about them first.$a$, 1),
    (discounts_id, $q$Can discount codes be combined with other offers?$q$,
     $a$Only one discount code can be applied per order, and codes cannot be combined with other active promotions.$a$, 2);
END $seed$;
