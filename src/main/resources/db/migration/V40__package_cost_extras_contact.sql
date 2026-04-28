-- Umrah packages: buying cost prices
ALTER TABLE umrah_packages ADD COLUMN IF NOT EXISTS cost_adult  NUMERIC(12,2);
ALTER TABLE umrah_packages ADD COLUMN IF NOT EXISTS cost_child  NUMERIC(12,2);
ALTER TABLE umrah_packages ADD COLUMN IF NOT EXISTS cost_infant NUMERIC(12,2);

-- Hajj packages: buying cost prices + structured extras + contact + class
ALTER TABLE hajj_packages ADD COLUMN IF NOT EXISTS cost_adult           NUMERIC(12,2);
ALTER TABLE hajj_packages ADD COLUMN IF NOT EXISTS cost_child           NUMERIC(12,2);
ALTER TABLE hajj_packages ADD COLUMN IF NOT EXISTS cost_infant          NUMERIC(12,2);
ALTER TABLE hajj_packages ADD COLUMN IF NOT EXISTS extras               jsonb;
ALTER TABLE hajj_packages ADD COLUMN IF NOT EXISTS contact_person_phone VARCHAR(50);
ALTER TABLE hajj_packages ADD COLUMN IF NOT EXISTS contact_person_email VARCHAR(100);
ALTER TABLE hajj_packages ADD COLUMN IF NOT EXISTS package_class        VARCHAR(20) DEFAULT 'economy';

-- Custom packages: buying cost prices + structured extras + contact + class
ALTER TABLE custom_packages ADD COLUMN IF NOT EXISTS cost_adult           NUMERIC(12,2);
ALTER TABLE custom_packages ADD COLUMN IF NOT EXISTS cost_child           NUMERIC(12,2);
ALTER TABLE custom_packages ADD COLUMN IF NOT EXISTS cost_infant          NUMERIC(12,2);
ALTER TABLE custom_packages ADD COLUMN IF NOT EXISTS extras               jsonb;
ALTER TABLE custom_packages ADD COLUMN IF NOT EXISTS contact_person_phone VARCHAR(50);
ALTER TABLE custom_packages ADD COLUMN IF NOT EXISTS contact_person_email VARCHAR(100);
ALTER TABLE custom_packages ADD COLUMN IF NOT EXISTS package_class        VARCHAR(20) DEFAULT 'economy';
