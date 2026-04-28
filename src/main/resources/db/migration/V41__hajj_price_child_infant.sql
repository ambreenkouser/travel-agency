-- Hajj packages: per-category sell prices (missing from V40)
ALTER TABLE hajj_packages ADD COLUMN IF NOT EXISTS price_child  NUMERIC(12,2);
ALTER TABLE hajj_packages ADD COLUMN IF NOT EXISTS price_infant NUMERIC(12,2);
