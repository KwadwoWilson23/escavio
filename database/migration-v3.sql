ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_type TEXT DEFAULT 'apartment';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS document_url TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS document_type TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS document_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS document_verification JSONB;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'processing';
