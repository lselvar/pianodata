-- Migrate to InnoDB for FK support
ALTER TABLE users ENGINE=InnoDB;
ALTER TABLE roles ENGINE=InnoDB;
ALTER TABLE user_roles ENGINE=InnoDB;
ALTER TABLE catalog ENGINE=InnoDB;

-- Make password nullable (Google users have no password)
ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL;

-- Add subscription and Google auth fields to users
ALTER TABLE users
  ADD COLUMN google_id               VARCHAR(255)  NULL                    COMMENT 'Google subject ID',
  ADD COLUMN display_name            VARCHAR(255)  NULL                    COMMENT 'Display name from Google',
  ADD COLUMN avatar_url              VARCHAR(512)  NULL                    COMMENT 'Google profile picture URL',
  ADD COLUMN trial_start_date        DATETIME      NULL                    COMMENT 'UTC timestamp when trial began',
  ADD COLUMN sub_status              ENUM('TRIAL','ACTIVE','EXPIRED','CANCELLED') NOT NULL DEFAULT 'TRIAL',
  ADD COLUMN stripe_customer_id      VARCHAR(255)  NULL,
  ADD COLUMN stripe_subscription_id  VARCHAR(255)  NULL,
  ADD COLUMN current_period_end      DATETIME      NULL                    COMMENT 'When current paid period ends';

-- Indexes
CREATE UNIQUE INDEX idx_users_google_id      ON users(google_id);
CREATE UNIQUE INDEX idx_users_email          ON users(email);
CREATE INDEX        idx_users_stripe_cust    ON users(stripe_customer_id);

-- FK constraints on user_roles
ALTER TABLE user_roles
  ADD CONSTRAINT fk_userroles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_userroles_role FOREIGN KEY (role_id) REFERENCES roles(id);

-- Catalog search indexes
CREATE INDEX idx_catalog_composer ON catalog(composer);
CREATE INDEX idx_catalog_era      ON catalog(era);
CREATE INDEX idx_catalog_level    ON catalog(level(50));
ALTER TABLE catalog ADD FULLTEXT INDEX idx_catalog_ft (title, composer, catalogName);
