-- The storefront advertises the WELCOME5 code in several places (the welcome popup, the
-- newsletter section, and the top-of-page announcement bar: "Get 5% Off on Your First
-- Purchase"), but it never existed as a row in the coupons table — so once the checkout
-- started validating coupons against the real table (instead of a hardcoded { WELCOME5 }
-- object), the advertised code would have failed with "not valid".
--
-- Seed it as a real, active percentage coupon so the advertised offer actually works. No
-- usage cap or expiry — it's the standing welcome offer. idempotent on re-run.
INSERT INTO coupons (code, discount_type, discount_value, is_active)
VALUES ('WELCOME5', 'percentage', 5, true)
ON CONFLICT (code) DO NOTHING;
