-- Order tracking: let admins attach a courier name + tracking number to an order
-- so customers can see it on their order history. No clickable link (customers copy
-- the number into the courier's own site) — kept deliberately simple.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier TEXT;
