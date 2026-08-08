-- Coupons table for admin discount code management

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
  min_order_amount NUMERIC(10, 2),
  max_uses INTEGER,
  uses_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Only service role (admin) can manage coupons
-- Public can read active coupons for validation at checkout
CREATE POLICY "Anyone can read active coupons" ON coupons
  FOR SELECT USING (is_active = true);
