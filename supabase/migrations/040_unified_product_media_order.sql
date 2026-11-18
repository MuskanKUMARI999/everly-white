-- One gallery order for a product's photos AND videos.
--
-- product_images.position and product_videos.position each counted from 0 in their own table, so
-- the storefront could only ever render "every photo, then every video" — a clip could never hold
-- slot 1. The two columns now number a single sequence per product, which lets the admin move a
-- video above a photo.
--
-- No schema change: this is a one-time renumbering of existing rows. Photos keep the order they are
-- in today and videos are stacked after them, so nothing visibly moves — it only makes the numbers
-- mean what the application now reads them as. Until it runs, the app detects the duplicate
-- positions and falls back to the old photos-then-videos order (see lib/data/productMedia.ts), and
-- any upload or reorder in admin repairs that product on its own.

-- Photos first: a clean, gapless 0..n-1 in their current display order.
WITH ordered AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY position, created_at) - 1 AS slot
  FROM product_images
)
UPDATE product_images
SET position = ordered.slot
FROM ordered
WHERE product_images.id = ordered.id
  AND product_images.position IS DISTINCT FROM ordered.slot;

-- Videos continue the same sequence, starting where the product's photos left off.
WITH photo_counts AS (
  SELECT product_id, COUNT(*) AS total FROM product_images GROUP BY product_id
),
ordered AS (
  SELECT
    v.id,
    ROW_NUMBER() OVER (PARTITION BY v.product_id ORDER BY v.position, v.created_at) - 1
      + COALESCE(c.total, 0) AS slot
  FROM product_videos v
  LEFT JOIN photo_counts c ON c.product_id = v.product_id
)
UPDATE product_videos
SET position = ordered.slot
FROM ordered
WHERE product_videos.id = ordered.id
  AND product_videos.position IS DISTINCT FROM ordered.slot;
