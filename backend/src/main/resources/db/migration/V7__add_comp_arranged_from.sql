ALTER TABLE catalog
    ADD COLUMN comp_arranged_from VARCHAR(100) DEFAULT NULL
    AFTER composer;
