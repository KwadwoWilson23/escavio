-- Property requests table: tenant requests a property, landlord reviews
CREATE TABLE IF NOT EXISTS property_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES users(id) ON DELETE CASCADE,
  landlord_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- pending, approved, declined
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_requests_landlord ON property_requests(landlord_id);
CREATE INDEX IF NOT EXISTS idx_property_requests_tenant ON property_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_property_requests_property ON property_requests(property_id);
