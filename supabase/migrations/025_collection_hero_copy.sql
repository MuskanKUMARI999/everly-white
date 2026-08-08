-- ---------------------------------------------------------------------------
-- Collection hero + intro copy, restored to match the design file
--
-- Three fields on /collection/[slug] had drifted from the design:
--
--   1. eyebrow — never stored anywhere. The collections table has no eyebrow
--      column, and mapCollectionToCollectionInfo falls back to `subtitle` when
--      metadata.eyebrow is absent, so the small caps line above the title was
--      printing the subtitle a second time, directly above the italic subtitle.
--
--   2. heroImageAlt — the adapter fell back to the bare collection title. The
--      design carries a full description of the banner photo, which is what
--      screen readers and image search actually need.
--
--   3. intro paragraph 2 — the seeded copy ("No two plates catch the light...")
--      predates the design's rewrite. The design's version states the 100-hour
--      craft time, which is what the stats strip right below it counts
--      ("100+ / Hours of Hand Craft, Per Piece"), so the two now agree.
--
-- Safe to re-run: `||` merges into existing metadata, so navImage, tileImage,
-- stats and founderNote all survive untouched.
-- ---------------------------------------------------------------------------

UPDATE collections
SET
  metadata = coalesce(metadata, '{}'::jsonb)
    || jsonb_build_object(
      'eyebrow', 'The Debut Collection',
      'heroImageAlt', 'Two hands reaching toward each other through a celestial archway, connected by a gold chain beneath a cosmic mandala and full moon',
      'intro', jsonb_build_object(
        'heading', 'Where two souls become one reflection.',
        'paragraphs', jsonb_build_array(
          'Center of the Universe is our founding collection — five hand-finished plates, each one a meditation on connection. The pull between twin flames, the quiet gravity of a lunar bond, a fate written in the stars: every piece carries its own quiet mythology, carved by hand and set with mirror.',
          'Each artwork demands at least 100 hours of meticulous artisan craftsmanship, from base to finish — dustproof, non-toxic, water-resistant pigments finished by hand, never by machine.'
        )
      )
    )
WHERE slug = 'center-of-the-universe';
