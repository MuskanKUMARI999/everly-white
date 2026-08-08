-- ---------------------------------------------------------------------------
-- GST tax invoices
--
-- Adds everything the invoice feature needs, in one file:
--
--   1. business_settings  — the seller's own details (GSTIN, registered
--      address, invoice prefix). A single row, edited from Admin → Settings.
--   2. products.hsn_code / products.gst_rate — per-item tax classification.
--   3. invoices + invoice_counters — the issued documents and the per-financial
--      -year serial counter behind them.
--   4. issue_invoice() — allocates the next number and writes the invoice in
--      one atomic step.
--
-- WHY AN INVOICE IS A SNAPSHOT, NOT A VIEW
--
-- The obvious design is to render the invoice from the order every time it is
-- downloaded. That is wrong for a tax document. The moment the client edits a
-- product name, corrects the shop address, or changes a GST rate, every invoice
-- ever issued would silently change — including ones already filed with a
-- return or handed to a customer. So `invoices` stores the seller block, the
-- buyer block, every line and every tax figure as they stood at the moment of
-- issue, and the PDF is rendered from that. Nothing downstream can rewrite
-- history. It is also why `order_id` is ON DELETE RESTRICT: no order that has
-- been invoiced can be deleted out from under its invoice. (Nothing in the app
-- deletes orders today — this keeps it that way by construction.)
--
-- WHY THE NUMBER IS ALLOCATED IN SQL
--
-- Section 31 of the CGST Act wants a consecutive serial per financial year. Two
-- customers paying in the same second must not receive the same number, and a
-- failed write must not leave a hole in the series. Doing "read counter, add
-- one, insert invoice" from application code fails both tests: the read/write
-- pair races, and a crash between the two burns a number forever. issue_invoice()
-- below does the increment and the insert in a single function call — one
-- transaction — so concurrent callers serialise on the counter row and a failed
-- insert rolls the counter back with it.
--
-- Safe to re-run: every statement is IF NOT EXISTS / CREATE OR REPLACE, and the
-- settings seed is ON CONFLICT DO NOTHING, so it will not overwrite details the
-- client has already filled in.
-- ---------------------------------------------------------------------------


-- ===========================================================================
-- 1. Seller details
-- ===========================================================================
-- Single-row table. The `id BOOLEAN PRIMARY KEY CHECK (id)` trick means the
-- only value the primary key can hold is TRUE, so a second row is impossible —
-- the settings can never fork into two competing copies.
CREATE TABLE IF NOT EXISTS business_settings (
  id                BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id),

  -- Identity as it must appear on a tax invoice.
  legal_name        TEXT NOT NULL DEFAULT 'Everly White',
  trade_name        TEXT,

  -- Registered place of business. `state` drives the CGST+SGST vs IGST split,
  -- so it has to match one of the 36 names in the app's GST state table.
  address_line1     TEXT,
  address_line2     TEXT,
  city              TEXT,
  state             TEXT,
  pin_code          TEXT,
  country           TEXT NOT NULL DEFAULT 'India',

  gstin             TEXT,
  pan               TEXT,

  email             TEXT,
  phone             TEXT,
  website           TEXT,

  logo_url          TEXT,
  signature_url     TEXT,

  -- Invoice numbers read <prefix>/<financial year>/<serial>, e.g. EW/2026-27/0001.
  invoice_prefix    TEXT NOT NULL DEFAULT 'EW',

  -- Fallback tax classification for products that have not been given their own.
  -- NOTE FOR THE CLIENT: 18% is a placeholder, not advice. These pieces are
  -- decor articles (carved wood + mirror), so the rate and HSN depend on how the
  -- client's accountant classifies them — 4420 (wooden decorative articles) and
  -- 7009 (glass mirrors) are the likely candidates and do not share a rate.
  -- Confirm both before the first real invoice goes out.
  default_gst_rate  NUMERIC(5, 2) NOT NULL DEFAULT 18 CHECK (default_gst_rate >= 0 AND default_gst_rate <= 100),
  default_hsn_code  TEXT,

  -- Free text printed at the foot of every invoice.
  invoice_terms     TEXT,
  bank_details      TEXT,

  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the single row so the admin page always has something to edit. Existing
-- values are never touched on a re-run.
INSERT INTO business_settings (id) VALUES (TRUE) ON CONFLICT (id) DO NOTHING;

-- Contains the client's GSTIN, PAN and bank details. Reached only through
-- requireAdmin() + the service-role client, so RLS on with zero policies is the
-- correct posture: it denies anon and authenticated outright, and the service
-- role bypasses RLS. Same pattern as admin_emails (018).
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;


-- ===========================================================================
-- 2. Per-product tax classification
-- ===========================================================================
-- Deliberately nullable rather than defaulted: NULL means "not classified yet"
-- and falls back to business_settings.default_gst_rate / default_hsn_code. A
-- column default would make an unclassified product indistinguishable from one
-- the client had genuinely reviewed and set to that rate.
ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn_code TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS gst_rate NUMERIC(5, 2);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_gst_rate_range'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_gst_rate_range
      CHECK (gst_rate IS NULL OR (gst_rate >= 0 AND gst_rate <= 100));
  END IF;
END $$;


-- ===========================================================================
-- 3. The invoice register
-- ===========================================================================
CREATE TABLE IF NOT EXISTS invoice_counters (
  financial_year TEXT PRIMARY KEY,          -- '2026-27'
  last_serial    INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE invoice_counters ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS invoices (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- RESTRICT, not CASCADE: an issued tax invoice outlives any wish to tidy up
  -- the orders table.
  order_id              UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,

  invoice_number        TEXT NOT NULL UNIQUE,   -- 'EW/2026-27/0001'
  financial_year        TEXT NOT NULL,
  serial                INTEGER NOT NULL,
  issued_at             TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Frozen snapshots. See the header for why these are copies, not joins.
  seller                JSONB NOT NULL,
  buyer                 JSONB NOT NULL,

  -- Place of supply decides the tax split, so it is recorded as a fact of the
  -- document rather than re-derived from the address on each render.
  place_of_supply       TEXT NOT NULL,
  place_of_supply_code  TEXT NOT NULL,
  is_interstate         BOOLEAN NOT NULL,

  -- line_items: one object per line — name, hsn, qty, rate, taxable value,
  -- cgst/sgst/igst amounts, line total.
  -- totals: taxable value, tax totals, discount, shipping, round_off,
  -- grand_total, amount_in_words.
  line_items            JSONB NOT NULL,
  totals                JSONB NOT NULL,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Belt and braces on the series: the number is unique, and so is the
  -- (year, serial) pair it is built from.
  UNIQUE (financial_year, serial)
);

CREATE INDEX IF NOT EXISTS idx_invoices_order ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_issued_at ON invoices(issued_at DESC);

-- Every invoice read goes through a route handler that has already checked the
-- caller owns the order (or is an admin), using the service-role client — the
-- same shape as trackOrder(). So, as with business_settings: RLS on, no
-- policies. A stray anon query cannot enumerate other customers' invoices,
-- which carry full name, address and phone.
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;


-- ===========================================================================
-- 4. Atomic issuance
-- ===========================================================================
-- Returns the invoice row for an order, creating it on first call.
--
-- Ordering inside the function matters:
--   a) look for an existing invoice FIRST, so a repeat call (a retried webhook,
--      a customer clicking Download twice) returns the same document instead of
--      burning a serial number;
--   b) only then take the counter, via INSERT ... ON CONFLICT DO UPDATE, which
--      locks the year's counter row for the rest of the transaction — that is
--      what serialises two simultaneous checkouts;
--   c) if a concurrent call slipped between (a) and (b), the UNIQUE on order_id
--      raises unique_violation and we return the winner's row rather than
--      failing the caller.
CREATE OR REPLACE FUNCTION public.issue_invoice(
  p_order_id             UUID,
  p_financial_year       TEXT,
  p_prefix               TEXT,
  p_seller               JSONB,
  p_buyer                JSONB,
  p_place_of_supply      TEXT,
  p_place_of_supply_code TEXT,
  p_is_interstate        BOOLEAN,
  p_line_items           JSONB,
  p_totals               JSONB
)
RETURNS SETOF invoices
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_id UUID;
  v_serial      INTEGER;
  v_number      TEXT;
BEGIN
  -- (a) Already issued? Hand back the same document. Checked through an
  -- explicit SELECT INTO rather than testing FOUND after a RETURN QUERY —
  -- both work, but only this one is obvious to the next person reading it.
  SELECT id INTO v_existing_id FROM invoices WHERE order_id = p_order_id;
  IF v_existing_id IS NOT NULL THEN
    RETURN QUERY SELECT * FROM invoices WHERE id = v_existing_id;
    RETURN;
  END IF;

  -- (b) Claim the next serial for this financial year.
  INSERT INTO invoice_counters (financial_year, last_serial)
  VALUES (p_financial_year, 1)
  ON CONFLICT (financial_year)
  DO UPDATE SET last_serial = invoice_counters.last_serial + 1
  RETURNING last_serial INTO v_serial;

  v_number := p_prefix || '/' || p_financial_year || '/' || lpad(v_serial::TEXT, 4, '0');

  RETURN QUERY
  INSERT INTO invoices (
    order_id, invoice_number, financial_year, serial,
    seller, buyer,
    place_of_supply, place_of_supply_code, is_interstate,
    line_items, totals
  )
  VALUES (
    p_order_id, v_number, p_financial_year, v_serial,
    p_seller, p_buyer,
    p_place_of_supply, p_place_of_supply_code, p_is_interstate,
    p_line_items, p_totals
  )
  RETURNING *;

EXCEPTION
  -- (c) Lost a race between the lookup and the insert. The other caller's
  -- invoice is the real one; this transaction's counter increment rolls back
  -- with the failed insert, so no serial is wasted.
  WHEN unique_violation THEN
    RETURN QUERY SELECT * FROM invoices WHERE order_id = p_order_id;
END;
$$;

-- Issuing an invoice is a server-side act tied to a confirmed payment. Like
-- decrement_product_stock (013) and the dashboard functions (032), it is closed
-- to the public API keys; only the service-role client can call it.
REVOKE EXECUTE ON FUNCTION public.issue_invoice(
  UUID, TEXT, TEXT, JSONB, JSONB, TEXT, TEXT, BOOLEAN, JSONB, JSONB
) FROM anon, authenticated;
