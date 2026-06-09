CREATE TYPE user_role AS ENUM ('landlord', 'tenant');
CREATE TYPE property_status AS ENUM ('vacant', 'occupied', 'pending');
CREATE TYPE lease_status AS ENUM ('pending', 'active', 'completed', 'disputed', 'at_risk');
CREATE TYPE payment_type AS ENUM ('tenant_collection', 'landlord_disbursement');
CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed', 'overdue');
CREATE TYPE notification_channel AS ENUM ('sms', 'in_app');
CREATE TYPE dispute_status AS ENUM ('open', 'reviewing', 'resolved');
CREATE TYPE payout_mode AS ENUM ('lump_sum', 'monthly', 'hybrid');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  ghana_card_number TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID REFERENCES users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  region TEXT NOT NULL,
  monthly_rent NUMERIC NOT NULL,
  bedrooms INT NOT NULL DEFAULT 1,
  status property_status DEFAULT 'vacant',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  landlord_id UUID REFERENCES users(id),
  tenant_id UUID REFERENCES users(id),
  monthly_amount NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  escrow_balance NUMERIC DEFAULT 0,
  advance_months INT DEFAULT 6,
  advance_disbursed BOOLEAN DEFAULT FALSE,
  payout_mode payout_mode DEFAULT 'monthly',
  status lease_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES leases(id) ON DELETE CASCADE,
  payer_id UUID REFERENCES users(id),
  recipient_id UUID REFERENCES users(id),
  amount NUMERIC NOT NULL,
  moolre_reference TEXT UNIQUE,
  type payment_type NOT NULL,
  status payment_status DEFAULT 'pending',
  due_date DATE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  channel notification_channel DEFAULT 'in_app',
  is_read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES leases(id) ON DELETE CASCADE,
  raised_by UUID REFERENCES users(id),
  description TEXT NOT NULL,
  status dispute_status DEFAULT 'open',
  ai_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_phone ON conversations(phone);
CREATE INDEX idx_conversations_user ON conversations(user_id);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Landlords manage own properties" ON properties
  FOR ALL USING (auth.uid() = landlord_id);

CREATE POLICY "Users see own leases" ON leases
  FOR SELECT USING (auth.uid() = landlord_id OR auth.uid() = tenant_id);

CREATE POLICY "Users see own payments" ON payments
  FOR SELECT USING (auth.uid() = payer_id OR auth.uid() = recipient_id);

CREATE POLICY "Users see own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users see own disputes" ON disputes
  FOR SELECT USING (auth.uid() = raised_by);
