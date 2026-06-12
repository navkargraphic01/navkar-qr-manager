-- ============================================================
-- NAVKAR DYNAMIC QR MANAGER - MySQL Database Schema
-- Compatible with phpMyAdmin / MySQL 5.7+ / MySQL 8.0+
-- Import this file via phpMyAdmin > Import > SQL
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+05:30";

-- ============================================================
-- 1. USERS TABLE (replaces Supabase auth + profiles)
-- ============================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id`            CHAR(36)     NOT NULL DEFAULT '',
  `email`         VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name`     VARCHAR(255) DEFAULT NULL,
  `avatar_url`    TEXT         DEFAULT NULL,
  `role`          ENUM('admin','viewer') NOT NULL DEFAULT 'admin',
  `company`       VARCHAR(255) DEFAULT 'Navkar Plywood',
  `is_active`     TINYINT(1)   NOT NULL DEFAULT 1,
  `last_login`    DATETIME     DEFAULT NULL,
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default admin user  (password: navkar@123  — CHANGE THIS AFTER FIRST LOGIN)
-- Password hash for "navkar@123" using bcrypt cost 12:
INSERT INTO `users` (`id`, `email`, `password_hash`, `full_name`, `role`, `company`) VALUES
(
  UUID(),
  'admin@navkarplywood.com',
  '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  -- password: password (change this!)
  'Admin',
  'admin',
  'Navkar Plywood'
);

-- ============================================================
-- 2. SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS `settings` (
  `id`          CHAR(36)     NOT NULL DEFAULT '',
  `setting_key` VARCHAR(100) NOT NULL,
  `value`       TEXT         DEFAULT NULL,
  `description` TEXT         DEFAULT NULL,
  `updated_by`  CHAR(36)     DEFAULT NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_settings_key` (`setting_key`),
  KEY `fk_settings_user` (`updated_by`),
  CONSTRAINT `fk_settings_user` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `settings` (`id`, `setting_key`, `value`, `description`) VALUES
  (UUID(), 'brand_name',          '"Navkar Plywood"',              'Company brand name'),
  (UUID(), 'brand_logo_url',      'null',                          'Brand logo URL'),
  (UUID(), 'qr_base_url',         '"https://navkarplywood.in"',   'Base URL for QR codes'),
  (UUID(), 'qr_prefix',           '"NP"',                          'QR ID prefix'),
  (UUID(), 'default_theme',       '"light"',                       'Default UI theme'),
  (UUID(), 'analytics_enabled',   'true',                          'Enable scan analytics'),
  (UUID(), 'email_notifications', 'false',                         'Enable email notifications');

-- ============================================================
-- 3. CATEGORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS `categories` (
  `id`          CHAR(36)     NOT NULL DEFAULT '',
  `name`        VARCHAR(100) NOT NULL,
  `slug`        VARCHAR(100) NOT NULL,
  `description` TEXT         DEFAULT NULL,
  `color`       VARCHAR(20)  NOT NULL DEFAULT '#C62828',
  `is_active`   TINYINT(1)   NOT NULL DEFAULT 1,
  `created_by`  CHAR(36)     DEFAULT NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categories_name` (`name`),
  UNIQUE KEY `uq_categories_slug` (`slug`),
  KEY `fk_categories_user` (`created_by`),
  CONSTRAINT `fk_categories_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `color`) VALUES
  (UUID(), 'Plywood',     'plywood',     'Plywood products',    '#C62828'),
  (UUID(), 'Laminates',   'laminates',   'Laminate products',   '#B71C1C'),
  (UUID(), 'Veneers',     'veneers',     'Veneer products',     '#EF5350'),
  (UUID(), 'Hardware',    'hardware',    'Hardware products',   '#FF7043'),
  (UUID(), 'Accessories', 'accessories', 'Accessory products',  '#5C6BC0');

-- ============================================================
-- 4. QR COUNTER TABLE (for sequential NP001, NP002...)
-- ============================================================
CREATE TABLE IF NOT EXISTS `qr_counter` (
  `id`            INT          NOT NULL DEFAULT 1,
  `current_value` INT          NOT NULL DEFAULT 0,
  `prefix`        VARCHAR(10)  NOT NULL DEFAULT 'NP',
  `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `chk_single_row` CHECK (`id` = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `qr_counter` (`id`, `current_value`, `prefix`) VALUES (1, 0, 'NP');

-- ============================================================
-- 5. QR TEMPLATES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS `qr_templates` (
  `id`            CHAR(36)     NOT NULL DEFAULT '',
  `name`          VARCHAR(100) NOT NULL,
  `slug`          VARCHAR(100) NOT NULL,
  `description`   TEXT         DEFAULT NULL,
  `thumbnail_url` TEXT         DEFAULT NULL,
  `template_data` LONGTEXT     NOT NULL,
  `is_default`    TINYINT(1)   NOT NULL DEFAULT 0,
  `is_system`     TINYINT(1)   NOT NULL DEFAULT 0,
  `category`      ENUM('classic','premium','industrial','minimal','custom') NOT NULL DEFAULT 'custom',
  `created_by`    CHAR(36)     DEFAULT NULL,
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_templates_slug` (`slug`),
  KEY `fk_templates_user` (`created_by`),
  CONSTRAINT `fk_templates_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `qr_templates` (`id`, `name`, `slug`, `description`, `is_system`, `is_default`, `category`, `template_data`) VALUES
(
  UUID(), 'Classic', 'classic', 'Clean and professional template with logo and product details',
  1, 1, 'classic',
  '{"canvas":{"width":400,"height":500,"background":"#FFFFFF","border":"1px solid #E5E7EB","borderRadius":"8px","padding":20},"elements":[{"id":"logo","type":"logo","x":160,"y":20,"width":80,"height":80,"visible":true},{"id":"qr","type":"qr","x":100,"y":120,"size":200,"fgColor":"#1A1A1A","bgColor":"#FFFFFF","visible":true},{"id":"product_name","type":"text","x":20,"y":345,"width":360,"content":"{{product_name}}","fontSize":18,"fontWeight":"bold","color":"#111827","align":"center","visible":true},{"id":"product_code","type":"text","x":20,"y":380,"width":360,"content":"Code: {{product_code}}","fontSize":13,"color":"#6B7280","align":"center","visible":true},{"id":"qr_id","type":"text","x":20,"y":405,"width":360,"content":"ID: {{qr_id}}","fontSize":12,"color":"#9CA3AF","align":"center","visible":true},{"id":"website","type":"text","x":20,"y":460,"width":360,"content":"navkarplywood.com","fontSize":11,"color":"#C62828","align":"center","visible":true}]}'
),
(
  UUID(), 'Premium', 'premium', 'Luxury template with gradient header and premium styling',
  1, 0, 'premium',
  '{"canvas":{"width":400,"height":520,"background":"#FFFFFF","border":"none","borderRadius":"12px","padding":0},"header":{"background":"linear-gradient(135deg, #C62828, #B71C1C)","height":80,"visible":true},"elements":[{"id":"brand","type":"text","x":20,"y":25,"width":360,"content":"NAVKAR PLYWOOD","fontSize":16,"fontWeight":"bold","color":"#FFFFFF","align":"center","visible":true},{"id":"logo","type":"logo","x":160,"y":70,"width":80,"height":80,"visible":true,"borderRadius":"50%","border":"3px solid #FFFFFF"},{"id":"qr","type":"qr","x":100,"y":165,"size":200,"fgColor":"#1A1A1A","bgColor":"#FFFFFF","visible":true},{"id":"product_name","type":"text","x":20,"y":385,"width":360,"content":"{{product_name}}","fontSize":18,"fontWeight":"bold","color":"#111827","align":"center","visible":true},{"id":"product_code","type":"text","x":20,"y":415,"width":360,"content":"{{product_code}}","fontSize":13,"color":"#6B7280","align":"center","visible":true},{"id":"warranty","type":"badge","x":150,"y":445,"content":"WARRANTY INCLUDED","bgColor":"#FEF2F2","color":"#C62828","visible":true},{"id":"website","type":"text","x":20,"y":490,"width":360,"content":"navkarplywood.com","fontSize":11,"color":"#9CA3AF","align":"center","visible":true}]}'
),
(
  UUID(), 'Industrial', 'industrial', 'Bold industrial design for warehouse and logistics use',
  1, 0, 'industrial',
  '{"canvas":{"width":400,"height":480,"background":"#1A1A1A","border":"2px solid #C62828","borderRadius":"4px","padding":20},"elements":[{"id":"header_line","type":"divider","x":0,"y":50,"color":"#C62828","thickness":2,"visible":true},{"id":"brand","type":"text","x":20,"y":15,"width":360,"content":"NAVKAR PLYWOOD","fontSize":14,"fontWeight":"bold","color":"#C62828","align":"left","letterSpacing":3,"visible":true},{"id":"qr","type":"qr","x":100,"y":70,"size":200,"fgColor":"#FFFFFF","bgColor":"#1A1A1A","visible":true},{"id":"product_name","type":"text","x":20,"y":290,"width":360,"content":"{{product_name}}","fontSize":20,"fontWeight":"900","color":"#FFFFFF","align":"left","visible":true},{"id":"product_code","type":"text","x":20,"y":325,"width":360,"content":"SKU: {{product_code}}","fontSize":12,"color":"#9CA3AF","align":"left","letterSpacing":2,"visible":true},{"id":"qr_id","type":"text","x":20,"y":350,"width":360,"content":"QR: {{qr_id}}","fontSize":12,"fontFamily":"monospace","color":"#C62828","align":"left","visible":true},{"id":"website","type":"text","x":20,"y":445,"width":360,"content":"navkarplywood.com","fontSize":11,"color":"#6B7280","align":"right","visible":true}]}'
),
(
  UUID(), 'Minimal', 'minimal', 'Ultra-clean minimal design, maximum whitespace',
  1, 0, 'minimal',
  '{"canvas":{"width":350,"height":420,"background":"#FAFAFA","border":"none","borderRadius":"0px","padding":30},"elements":[{"id":"qr","type":"qr","x":75,"y":30,"size":200,"fgColor":"#111827","bgColor":"#FAFAFA","visible":true},{"id":"line","type":"divider","x":30,"y":250,"color":"#E5E7EB","thickness":1,"visible":true},{"id":"product_name","type":"text","x":0,"y":270,"width":350,"content":"{{product_name}}","fontSize":16,"fontWeight":"600","color":"#111827","align":"center","visible":true},{"id":"qr_id","type":"text","x":0,"y":300,"width":350,"content":"{{qr_id}}","fontSize":11,"fontFamily":"monospace","color":"#9CA3AF","align":"center","letterSpacing":2,"visible":true},{"id":"website","type":"text","x":0,"y":385,"width":350,"content":"navkarplywood.com","fontSize":10,"color":"#D1D5DB","align":"center","visible":true}]}'
);

-- ============================================================
-- 6. QR CODES / PRODUCTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS `qr_codes` (
  `id`                   CHAR(36)     NOT NULL DEFAULT '',
  `qr_id`                VARCHAR(20)  NOT NULL,
  `product_name`         VARCHAR(255) NOT NULL,
  `product_code`         VARCHAR(100) NOT NULL,
  `destination_url`      TEXT         NOT NULL,
  `qr_image_url`         TEXT         DEFAULT NULL,
  `category_id`          CHAR(36)     DEFAULT NULL,
  `description`          TEXT         DEFAULT NULL,
  `batch_number`         VARCHAR(100) DEFAULT NULL,
  `warranty_pdf_url`     TEXT         DEFAULT NULL,
  `installation_pdf_url` TEXT         DEFAULT NULL,
  `product_image_url`    TEXT         DEFAULT NULL,
  `status`               ENUM('active','inactive','draft') NOT NULL DEFAULT 'active',
  `scan_count`           INT          NOT NULL DEFAULT 0,
  `last_scanned_at`      DATETIME     DEFAULT NULL,
  `template_id`          CHAR(36)     DEFAULT NULL,
  `metadata`             LONGTEXT     DEFAULT '{}',
  `created_by`           CHAR(36)     DEFAULT NULL,
  `updated_by`           CHAR(36)     DEFAULT NULL,
  `created_at`           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_qr_codes_qr_id` (`qr_id`),
  KEY `idx_qr_codes_product_code` (`product_code`),
  KEY `idx_qr_codes_status` (`status`),
  KEY `idx_qr_codes_created_at` (`created_at`),
  KEY `fk_qr_codes_category` (`category_id`),
  KEY `fk_qr_codes_created_by` (`created_by`),
  KEY `fk_qr_codes_updated_by` (`updated_by`),
  CONSTRAINT `fk_qr_codes_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_qr_codes_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_qr_codes_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. URL CHANGE HISTORY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS `url_history` (
  `id`            CHAR(36)     NOT NULL DEFAULT '',
  `qr_code_id`    CHAR(36)     NOT NULL,
  `old_url`       TEXT         NOT NULL,
  `new_url`       TEXT         NOT NULL,
  `change_reason` TEXT         DEFAULT NULL,
  `changed_by`    CHAR(36)     DEFAULT NULL,
  `changed_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_url_history_qr_code_id` (`qr_code_id`),
  KEY `fk_url_history_user` (`changed_by`),
  CONSTRAINT `fk_url_history_qr` FOREIGN KEY (`qr_code_id`) REFERENCES `qr_codes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_url_history_user` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. SCANS / ANALYTICS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS `scans` (
  `id`              CHAR(36)     NOT NULL DEFAULT '',
  `qr_code_id`      CHAR(36)     NOT NULL,
  `qr_id`           VARCHAR(20)  NOT NULL,
  `destination_url` TEXT         DEFAULT NULL,
  `scanned_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `device_type`     ENUM('mobile','tablet','desktop','unknown') DEFAULT 'unknown',
  `browser`         VARCHAR(100) DEFAULT NULL,
  `os`              VARCHAR(100) DEFAULT NULL,
  `user_agent`      TEXT         DEFAULT NULL,
  `ip_address`      VARCHAR(45)  DEFAULT NULL,
  `country`         VARCHAR(100) DEFAULT NULL,
  `country_code`    VARCHAR(10)  DEFAULT NULL,
  `city`            VARCHAR(100) DEFAULT NULL,
  `region`          VARCHAR(100) DEFAULT NULL,
  `latitude`        DECIMAL(9,6) DEFAULT NULL,
  `longitude`       DECIMAL(9,6) DEFAULT NULL,
  `referrer`        TEXT         DEFAULT NULL,
  `metadata`        LONGTEXT     DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_scans_qr_code_id`  (`qr_code_id`),
  KEY `idx_scans_qr_id`       (`qr_id`),
  KEY `idx_scans_scanned_at`  (`scanned_at`),
  KEY `idx_scans_country`     (`country`),
  KEY `idx_scans_device_type` (`device_type`),
  CONSTRAINT `fk_scans_qr` FOREIGN KEY (`qr_code_id`) REFERENCES `qr_codes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. BULK UPLOAD JOBS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS `bulk_upload_jobs` (
  `id`                CHAR(36)     NOT NULL DEFAULT '',
  `filename`          VARCHAR(255) NOT NULL,
  `total_records`     INT          NOT NULL DEFAULT 0,
  `processed_records` INT          NOT NULL DEFAULT 0,
  `success_count`     INT          NOT NULL DEFAULT 0,
  `error_count`       INT          NOT NULL DEFAULT 0,
  `status`            ENUM('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
  `errors`            LONGTEXT     DEFAULT NULL,
  `created_by`        CHAR(36)     DEFAULT NULL,
  `started_at`        DATETIME     DEFAULT NULL,
  `completed_at`      DATETIME     DEFAULT NULL,
  `created_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_bulk_jobs_user` (`created_by`),
  CONSTRAINT `fk_bulk_jobs_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. TRIGGER: Auto-increment scan_count on scan insert
-- ============================================================
DELIMITER $$
CREATE TRIGGER `trg_increment_scan_count`
AFTER INSERT ON `scans`
FOR EACH ROW
BEGIN
  UPDATE `qr_codes`
  SET
    `scan_count`      = COALESCE(`scan_count`, 0) + 1,
    `last_scanned_at` = NEW.`scanned_at`
  WHERE `id` = NEW.`qr_code_id`;
END$$
DELIMITER ;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- DONE!
-- After importing:
-- 1. Change the admin password: UPDATE users SET password_hash = '<new_hash>' WHERE email = 'admin@navkarplywood.com';
-- 2. Or use the PHP backend to login and change via Settings page.
-- Default login: admin@navkarplywood.com / password: password
-- ============================================================
