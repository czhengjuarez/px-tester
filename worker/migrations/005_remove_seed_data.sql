-- Remove seed data sites (IDs 1-8)
-- These are the demo sites that were initially seeded
-- User-submitted sites will have different IDs and will be preserved

DELETE FROM sites WHERE id IN ('1', '2', '3', '4', '5', '6', '7', '8');
