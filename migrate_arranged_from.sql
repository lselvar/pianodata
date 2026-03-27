-- One-time migration: split ', arr. ' data out of the composer column
-- Example: 'Abt, Franz, arr. Folk - German'
--   → composer          = 'Abt, Franz'
--   → comp_arranged_from = 'Folk - German'
--
-- Run once against the pianorep database after V7 migration has been applied.
-- Usage: mysql -u <user> -p pianorep < migrate_arranged_from.sql

UPDATE catalog
SET
    comp_arranged_from = TRIM(SUBSTRING(composer, LOCATE(', arr. ', composer) + 7)),
    composer           = TRIM(SUBSTRING(composer, 1, LOCATE(', arr. ', composer) - 1))
WHERE composer LIKE '%, arr. %';

-- Verify results
SELECT
    COUNT(*) AS rows_updated
FROM catalog
WHERE comp_arranged_from IS NOT NULL AND comp_arranged_from != '';

-- Sample check
SELECT id, composer, comp_arranged_from
FROM catalog
WHERE comp_arranged_from IS NOT NULL AND comp_arranged_from != ''
LIMIT 20;
