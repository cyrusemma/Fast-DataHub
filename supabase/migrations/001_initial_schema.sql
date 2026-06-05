CREATE TYPE user_role AS ENUM ('SUPER_ADMIN','NETWORK_ADMIN','AGENT','RESELLER','CUSTOMER','AUDITOR');
CREATE TYPE user_status AS ENUM ('ACTIVE','SUSPENDED','PENDING');
CREATE TYPE transaction_type AS ENUM ('TOPUP','DATA_PURCHASE','COMMISSION','WITHDRAWAL','REFUND');
CREATE TYPE transaction_status AS ENUM ('PENDING','SUCCESS','FAILED','REVERSED');
CREATE TYPE network AS ENUM ('MTN','TELECEL','AT');
CREATE TYPE commission_status AS ENUM ('PENDING','PAID');

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'CUSTOMER',
  status user_status NOT NULL DEFAULT 'ACTIVE',
  agent_id UUID REFERENCES profiles(id),
  kyc_verified BOOLEAN DEFAULT FALSE,
  invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  balance BIGINT NOT NULL DEFAULT 0,
  locked_balance BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'GHS',
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE data_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network network NOT NULL,
  name TEXT NOT NULL,
  data_size_mb INTEGER NOT NULL,
  validity_days INTEGER NOT NULL,
  cost_price BIGINT NOT NULL,
  selling_price BIGINT NOT NULL,
  agent_price BIGINT NOT NULL,
  reseller_price BIGINT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  type transaction_type NOT NULL,
  amount BIGINT NOT NULL,
  fee BIGINT NOT NULL DEFAULT 0,
  balance_before BIGINT NOT NULL,
  balance_after BIGINT NOT NULL,
  status transaction_status NOT NULL DEFAULT 'PENDING',
  reference TEXT UNIQUE NOT NULL,
  idempotency_key TEXT UNIQUE NOT NULL,
  network network,
  recipient_phone TEXT,
  bundle_id UUID REFERENCES data_bundles(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  amount BIGINT NOT NULL,
  type TEXT NOT NULL,
  status commission_status NOT NULL DEFAULT 'PENDING',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_network ON transactions(network);
CREATE INDEX idx_commissions_user_id ON commissions(user_id);
CREATE INDEX idx_profiles_agent_id ON profiles(agent_id);
CREATE INDEX idx_profiles_role ON profiles(role);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER trg_new_profile AFTER INSERT ON profiles FOR EACH ROW EXECUTE FUNCTION handle_new_profile();

CREATE OR REPLACE FUNCTION get_my_role() RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
  SELECT role IN ('SUPER_ADMIN','NETWORK_ADMIN') FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "admin view all profiles" ON profiles FOR SELECT USING (is_admin());
CREATE POLICY "agent view resellers" ON profiles FOR SELECT USING (agent_id = auth.uid());
CREATE POLICY "own profile update" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "admin update any profile" ON profiles FOR UPDATE USING (is_admin());
CREATE POLICY "insert own profile" ON profiles FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "own wallet" ON wallets FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "admin view wallets" ON wallets FOR SELECT USING (is_admin());

CREATE POLICY "own transactions" ON transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "admin view all transactions" ON transactions FOR SELECT USING (is_admin());
CREATE POLICY "agent view reseller transactions" ON transactions FOR SELECT USING (
  user_id IN (SELECT id FROM profiles WHERE agent_id = auth.uid())
);

CREATE POLICY "view active bundles" ON data_bundles FOR SELECT TO authenticated USING (is_active = TRUE);
CREATE POLICY "admin view all bundles" ON data_bundles FOR SELECT USING (is_admin());
CREATE POLICY "admin insert bundles" ON data_bundles FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "admin update bundles" ON data_bundles FOR UPDATE USING (is_admin());

CREATE POLICY "own commissions" ON commissions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "admin view all commissions" ON commissions FOR SELECT USING (is_admin());
CREATE POLICY "admin and auditor view logs" ON audit_logs FOR SELECT USING (
  get_my_role() IN ('SUPER_ADMIN','NETWORK_ADMIN','AUDITOR')
);

CREATE OR REPLACE FUNCTION deduct_wallet(p_user_id UUID, p_amount BIGINT)
RETURNS void AS $$
DECLARE current_balance BIGINT;
BEGIN
  SELECT balance INTO current_balance FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  IF current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance. Have %, need %', current_balance, p_amount;
  END IF;
  UPDATE wallets SET balance = balance - p_amount, last_updated = NOW() WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION credit_wallet(p_user_id UUID, p_amount BIGINT)
RETURNS void AS $$
BEGIN
  UPDATE wallets SET balance = balance + p_amount, last_updated = NOW() WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_admin_dashboard_stats() RETURNS JSON AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'total_revenue', COALESCE(SUM(amount) FILTER (WHERE type='DATA_PURCHASE' AND status='SUCCESS'),0),
    'today_revenue', COALESCE(SUM(amount) FILTER (WHERE type='DATA_PURCHASE' AND status='SUCCESS' AND DATE(created_at)=CURRENT_DATE),0),
    'total_transactions', COUNT(*) FILTER (WHERE status != 'PENDING'),
    'today_transactions', COUNT(*) FILTER (WHERE DATE(created_at)=CURRENT_DATE),
    'failed_transactions', COUNT(*) FILTER (WHERE status='FAILED'),
    'success_rate', ROUND(COUNT(*) FILTER (WHERE status='SUCCESS') * 100.0 / NULLIF(COUNT(*) FILTER (WHERE status IN ('SUCCESS','FAILED')),0), 1)
  ) INTO result FROM transactions;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_revenue_chart(p_days INTEGER DEFAULT 30)
RETURNS TABLE(date TEXT, revenue BIGINT, tx_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT TO_CHAR(d.day,'YYYY-MM-DD'), COALESCE(SUM(t.amount),0)::BIGINT, COUNT(t.id)::BIGINT
  FROM generate_series(CURRENT_DATE-(p_days-1), CURRENT_DATE, '1 day'::interval) AS d(day)
  LEFT JOIN transactions t ON DATE(t.created_at)=d.day AND t.type='DATA_PURCHASE' AND t.status='SUCCESS'
  GROUP BY d.day ORDER BY d.day;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
