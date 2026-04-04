ALTER TABLE catalog
    ADD COLUMN level_secundo   VARCHAR(200) DEFAULT NULL AFTER level,
    ADD COLUMN solo_duet       VARCHAR(200) DEFAULT NULL AFTER etude,
    ADD COLUMN incipit_secundo VARCHAR(10)  DEFAULT NULL AFTER incipit;
