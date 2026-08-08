-- ---------------------------------------------------------------------------
-- How the customer actually paid, for the invoice
--
-- orders.payment_method has only ever held the literal string 'razorpay' — the
-- gateway, not the instrument. The client asked for the invoice to state the
-- means of payment ("via credit / debit card"), which that column cannot answer.
--
-- Razorpay knows: GET /v1/payments/:id returns method ('card', 'upi',
-- 'netbanking', 'wallet', 'emi'), and for cards a nested object carrying type
-- ('credit' / 'debit'), network ('Visa') and last4. Verified against this
-- shop's own past payment before writing this migration.
--
-- Stored as JSONB rather than a pre-formatted string so the wording on the
-- invoice can be changed later without the stored data having to be rewritten.
-- Cardholder name and the full card id are deliberately NOT kept — the invoice
-- needs none of it, and the less card data stored the better.
--
-- Nullable by necessity: orders placed before this existed, and any order paid
-- through the simulated checkout, have no gateway record to read.
--
-- Safe to re-run.
-- ---------------------------------------------------------------------------

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_details JSONB;

COMMENT ON COLUMN orders.payment_details IS
  'Instrument used, read back from the payment gateway: { method, cardType, cardNetwork, last4, bank, wallet, vpa }. Null for simulated or pre-existing orders.';


-- ---------------------------------------------------------------------------
-- Let business_settings genuinely defer to the hardcoded seller details
--
-- The client chose to keep their registration details in code rather than in an
-- admin form, with the table left in place so the choice can be reversed later
-- without a migration. Application code therefore reads "the settings value, or
-- the hardcoded one if the settings value is blank".
--
-- Four columns in 033 were declared NOT NULL DEFAULT: legal_name, country,
-- invoice_prefix and default_gst_rate. Blank is not a state they can hold, so
-- the seeded row ALWAYS won, and its placeholder default_gst_rate of 18 silently
-- overrode the 12% the accountant actually confirmed. Caught by issuing a test
-- invoice against the live database and reading the tax back — the code and the
-- types were both correct, and neither tsc nor eslint could have found it.
--
-- Making them nullable and emptying the seeded row restores the intended
-- precedence: nothing in the table, so the constants apply. The moment someone
-- fills the settings form, their value takes over again.
-- ---------------------------------------------------------------------------

ALTER TABLE business_settings ALTER COLUMN legal_name       DROP NOT NULL;
ALTER TABLE business_settings ALTER COLUMN country          DROP NOT NULL;
ALTER TABLE business_settings ALTER COLUMN invoice_prefix   DROP NOT NULL;
ALTER TABLE business_settings ALTER COLUMN default_gst_rate DROP NOT NULL;

-- Drop the defaults too, so a future INSERT does not reintroduce the same trap.
ALTER TABLE business_settings ALTER COLUMN legal_name       DROP DEFAULT;
ALTER TABLE business_settings ALTER COLUMN country          DROP DEFAULT;
ALTER TABLE business_settings ALTER COLUMN invoice_prefix   DROP DEFAULT;
ALTER TABLE business_settings ALTER COLUMN default_gst_rate DROP DEFAULT;

-- Clear the seeded placeholders. Guarded so that re-running this migration
-- cannot wipe details someone has since entered deliberately: only the exact
-- values 033 seeded are cleared.
UPDATE business_settings SET legal_name       = NULL WHERE legal_name = 'Everly White';
UPDATE business_settings SET country          = NULL WHERE country = 'India';
UPDATE business_settings SET invoice_prefix   = NULL WHERE invoice_prefix = 'EW';
UPDATE business_settings SET default_gst_rate = NULL WHERE default_gst_rate = 18;
