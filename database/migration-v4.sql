-- 1% fee fields on payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS escavio_fee NUMERIC DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS net_amount NUMERIC;

-- Security deposit on leases
ALTER TABLE leases ADD COLUMN IF NOT EXISTS security_deposit NUMERIC DEFAULT 0;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS security_deposit_used BOOLEAN DEFAULT FALSE;

-- Blacklist + verification status on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blacklisted BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';

-- Property extras
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bathrooms INT DEFAULT 1;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS title TEXT;

-- Ensure TEXT types for flexible status/type values
-- Payment types: tenant_collection, security_deposit, security_deposit_used, landlord_disbursement, fee
ALTER TABLE payments ALTER COLUMN type TYPE TEXT;

-- Lease statuses: pending, accepted, active, at_risk, suspended, defaulted, completed
ALTER TABLE leases ALTER COLUMN status TYPE TEXT;

-- Payment statuses: pending, processing, success, failed, overdue, covered_by_deposit
ALTER TABLE payments ALTER COLUMN status TYPE TEXT;
