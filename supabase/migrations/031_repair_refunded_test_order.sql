-- One-off data repair for order EWMS3O2I8C5968, plus the state it left behind.
--
-- That order was marked "refunded" from the admin panel back when updateOrderStatus() was a blind
-- field write: it changed status and nothing else. So the Twin Flames unit was never returned to
-- stock, the WELCOME5 use was never released, payment_status stayed "paid", and cancelled_at was
-- left NULL. Confirmed with the user (2026-08-03) that this was a test order and no real money
-- moved, so refund_id stays NULL.
--
-- The application-side cause is fixed separately: updateOrderStatus() now calls
-- reverseOrderSideEffects(), the same helper the customer cancellation path uses.
--
-- Absolute values, not deltas, so re-running this is a no-op rather than a second restock.
-- NOTE: because stock is set absolutely, run this before adjusting Twin Flames stock by hand.

-- Return the unit that was sold and never restored (seeded 50, one paid order took it to 49).
UPDATE products
SET stock_quantity = 50,
    updated_at     = now()
WHERE slug = 'twin-flames'
  AND stock_quantity = 49;

-- Release the coupon use counted for that order. WELCOME5 is uncapped, but the count is shown in
-- admin and would misreport usage forever.
UPDATE coupons
SET uses_count = 0
WHERE code = 'WELCOME5'
  AND uses_count = 1;

-- Make the order record internally consistent. cancelled_at is also the claim the new reversal
-- helper checks, so stamping it here prevents any future save from restocking this order again.
UPDATE orders
SET payment_status = 'refunded',
    cancelled_at   = COALESCE(cancelled_at, updated_at),
    updated_at     = now()
WHERE order_number = 'EWMS3O2I8C5968'
  AND cancelled_at IS NULL;
