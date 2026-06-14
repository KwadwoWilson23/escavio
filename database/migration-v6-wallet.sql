-- Wallet system: tenant deposits freely, funds lock on lease creation
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance NUMERIC DEFAULT 0,        -- available (can withdraw)
  locked_balance NUMERIC DEFAULT 0, -- locked for leases (cannot withdraw, only disburse to landlord)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- deposit, withdrawal, lock, disburse, fee
  amount NUMERIC NOT NULL,
  balance_after NUMERIC NOT NULL,
  description TEXT,
  reference TEXT,
  lease_id UUID REFERENCES leases(id),
  status TEXT DEFAULT 'success', -- success, pending, failed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_txn_wallet ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_txn_user ON wallet_transactions(user_id);
