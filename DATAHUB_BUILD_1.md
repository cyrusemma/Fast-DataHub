# DATAHUB — FULL BUILD INSTRUCTIONS FOR CLAUDE CODE (Supabase Edition)

> **How to use this file:**
> Open Claude Code in your project folder and send:
> `"Read DATAHUB_BUILD.md in full, then start building from Phase 1. Do not skip any section. Ask me before deviating from anything in this spec."`

---

## OVERVIEW

You are building **DataHUB** — a production-grade mobile data reseller platform for the Ghanaian market.
Every feature must be fully functional end-to-end. No placeholder UI. No hardcoded mock data. Real data on every screen.

**What DataHUB is:**
- A retail platform where users buy mobile data bundles
- An agent + reseller network with tiered commissions
- A wallet + payments system (Paystack top-ups, internal wallets)
- A telecom fulfillment layer (MTN, Telecel, AirtelTigo — mocked until real API keys)

---

## TECH STACK

### Frontend
- React 18 + Vite
- Tailwind CSS
- React Router v6 (protected + role-aware routes)
- Framer Motion (page transitions, modals, sidebar)
- TanStack Query v5 (data fetching + caching)
- React Hook Form + Zod (form validation)
- Recharts (analytics charts)
- Zustand (global auth + wallet state)
- Sonner (toast notifications)
- Lucide React (ALL icons — never use emojis as icons)
- date-fns (date formatting)

### Backend — Supabase
- **Supabase Auth** — registration, login, JWT, sessions, password reset
- **Supabase Database** — PostgreSQL with RLS policies
- **Supabase Edge Functions** — buy-data, topup-verify, paystack-webhook, invite-reseller
- **Supabase Realtime** — live wallet balance updates

### Payments
- Paystack (GHS, Ghana)

---

## PROJECT STRUCTURE

```
datahub/
├── src/
│   ├── api/
│   │   ├── supabase.js
│   │   ├── auth.api.js
│   │   ├── wallet.api.js
│   │   ├── bundles.api.js
│   │   ├── transactions.api.js
│   │   ├── agents.api.js
│   │   └── admin.api.js
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── DataTable.jsx
│   │   │   ├── Spinner.jsx
│   │   │   └── EmptyState.jsx
│   │   ├── layouts/
│   │   │   ├── AuthLayout.jsx
│   │   │   ├── DashboardLayout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── TopBar.jsx
│   │   └── shared/
│   │       ├── WalletCard.jsx
│   │       ├── TransactionRow.jsx
│   │       ├── BundleCard.jsx
│   │       ├── StatCard.jsx
│   │       ├── NetworkSelector.jsx
│   │       └── RecentTransactions.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useWallet.js
│   │   ├── useTransactions.js
│   │   └── useRole.js
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── ForgotPassword.jsx
│   │   ├── admin/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminUsers.jsx
│   │   │   ├── AdminTransactions.jsx
│   │   │   ├── AdminAgents.jsx
│   │   │   ├── AdminBundles.jsx
│   │   │   ├── AdminFinance.jsx
│   │   │   └── AdminAuditLogs.jsx
│   │   ├── agent/
│   │   │   ├── AgentDashboard.jsx
│   │   │   ├── AgentResellers.jsx
│   │   │   ├── AgentBuyBulk.jsx
│   │   │   ├── AgentCommissions.jsx
│   │   │   └── AgentWallet.jsx
│   │   ├── reseller/
│   │   │   ├── ResellerDashboard.jsx
│   │   │   ├── ResellerSellData.jsx
│   │   │   ├── ResellerEarnings.jsx
│   │   │   └── ResellerWallet.jsx
│   │   └── customer/
│   │       ├── CustomerDashboard.jsx
│   │       ├── CustomerBuyData.jsx
│   │       └── CustomerHistory.jsx
│   ├── store/
│   │   ├── authStore.js
│   │   └── walletStore.js
│   ├── router/
│   │   ├── index.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── RoleRedirect.jsx
│   └── utils/
│       ├── formatCurrency.js
│       ├── formatDate.js
│       ├── phoneValidation.js
│       └── constants.js
│
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   ├── functions/
│   │   ├── buy-data/index.ts
│   │   ├── topup-verify/index.ts
│   │   ├── paystack-webhook/index.ts
│   │   └── invite-reseller/index.ts
│   └── seed.sql
│
├── .env.local
├── .env.example
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## ENVIRONMENT VARIABLES

`.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_key
```

Supabase Edge Function secrets (Dashboard → Settings → Edge Functions → Secrets):
```
PAYSTACK_SECRET_KEY=sk_test_your_key
SITE_URL=http://localhost:5173
```

---

## SUPABASE CLIENT

```javascript
// src/api/supabase.js
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: true, autoRefreshToken: true } }
);
```

---

## DATABASE SCHEMA

Run as `supabase/migrations/001_initial_schema.sql` in Supabase SQL editor:

```sql
-- ENUMS
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN','NETWORK_ADMIN','AGENT','RESELLER','CUSTOMER','AUDITOR');
CREATE TYPE user_status AS ENUM ('ACTIVE','SUSPENDED','PENDING');
CREATE TYPE transaction_type AS ENUM ('TOPUP','DATA_PURCHASE','COMMISSION','WITHDRAWAL','REFUND');
CREATE TYPE transaction_status AS ENUM ('PENDING','SUCCESS','FAILED','REVERSED');
CREATE TYPE network AS ENUM ('MTN','TELECEL','AT');
CREATE TYPE commission_status AS ENUM ('PENDING','PAID');

-- PROFILES (extends auth.users)
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT UNIQUE NOT NULL,
  phone        TEXT UNIQUE NOT NULL,
  first_name   TEXT NOT NULL,
  last_name    TEXT NOT NULL,
  role         user_role NOT NULL DEFAULT 'CUSTOMER',
  status       user_status NOT NULL DEFAULT 'ACTIVE',
  agent_id     UUID REFERENCES profiles(id),
  kyc_verified BOOLEAN DEFAULT FALSE,
  invite_code  TEXT UNIQUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- WALLETS
CREATE TABLE wallets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  balance        BIGINT NOT NULL DEFAULT 0,
  locked_balance BIGINT NOT NULL DEFAULT 0,
  currency       TEXT NOT NULL DEFAULT 'GHS',
  last_updated   TIMESTAMPTZ DEFAULT NOW()
);

-- DATA BUNDLES
CREATE TABLE data_bundles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network        network NOT NULL,
  name           TEXT NOT NULL,
  data_size_mb   INTEGER NOT NULL,
  validity_days  INTEGER NOT NULL,
  cost_price     BIGINT NOT NULL,
  selling_price  BIGINT NOT NULL,
  agent_price    BIGINT NOT NULL,
  reseller_price BIGINT NOT NULL,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- TRANSACTIONS
CREATE TABLE transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id),
  type            transaction_type NOT NULL,
  amount          BIGINT NOT NULL,
  fee             BIGINT NOT NULL DEFAULT 0,
  balance_before  BIGINT NOT NULL,
  balance_after   BIGINT NOT NULL,
  status          transaction_status NOT NULL DEFAULT 'PENDING',
  reference       TEXT UNIQUE NOT NULL,
  idempotency_key TEXT UNIQUE NOT NULL,
  network         network,
  recipient_phone TEXT,
  bundle_id       UUID REFERENCES data_bundles(id),
  metadata        JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- COMMISSIONS
CREATE TABLE commissions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  amount         BIGINT NOT NULL,
  type           TEXT NOT NULL,
  status         commission_status NOT NULL DEFAULT 'PENDING',
  paid_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT LOGS
CREATE TABLE audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES profiles(id),
  action     TEXT NOT NULL,
  resource   TEXT NOT NULL,
  metadata   JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_network ON transactions(network);
CREATE INDEX idx_commissions_user_id ON commissions(user_id);
CREATE INDEX idx_profiles_agent_id ON profiles(agent_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- AUTO-CREATE WALLET ON PROFILE INSERT
CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_new_profile AFTER INSERT ON profiles FOR EACH ROW EXECUTE FUNCTION handle_new_profile();

-- HELPER FUNCTIONS FOR RLS
CREATE OR REPLACE FUNCTION get_my_role() RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
  SELECT role IN ('SUPER_ADMIN','NETWORK_ADMIN') FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "admin view all profiles" ON profiles FOR SELECT USING (is_admin());
CREATE POLICY "agent view resellers" ON profiles FOR SELECT USING (agent_id = auth.uid());
CREATE POLICY "own profile update" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "admin update any profile" ON profiles FOR UPDATE USING (is_admin());
CREATE POLICY "insert own profile" ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- WALLETS POLICIES
CREATE POLICY "own wallet" ON wallets FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "admin view wallets" ON wallets FOR SELECT USING (is_admin());

-- TRANSACTIONS POLICIES
CREATE POLICY "own transactions" ON transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "admin view all transactions" ON transactions FOR SELECT USING (is_admin());
CREATE POLICY "agent view reseller transactions" ON transactions FOR SELECT USING (
  user_id IN (SELECT id FROM profiles WHERE agent_id = auth.uid())
);

-- DATA BUNDLES POLICIES
CREATE POLICY "view active bundles" ON data_bundles FOR SELECT TO authenticated USING (is_active = TRUE);
CREATE POLICY "admin view all bundles" ON data_bundles FOR SELECT USING (is_admin());
CREATE POLICY "admin insert bundles" ON data_bundles FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "admin update bundles" ON data_bundles FOR UPDATE USING (is_admin());

-- COMMISSIONS POLICIES
CREATE POLICY "own commissions" ON commissions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "admin view all commissions" ON commissions FOR SELECT USING (is_admin());

-- AUDIT LOGS POLICIES
CREATE POLICY "admin and auditor view logs" ON audit_logs FOR SELECT USING (
  get_my_role() IN ('SUPER_ADMIN','NETWORK_ADMIN','AUDITOR')
);

-- ATOMIC WALLET FUNCTIONS (called by Edge Functions with service role)
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

-- ADMIN DASHBOARD STATS FUNCTION
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

-- REVENUE CHART FUNCTION
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
```

---

## EDGE FUNCTIONS

### buy-data (`supabase/functions/buy-data/index.ts`)

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authErr || !user) throw new Error('Unauthorized')

    const { bundleId, recipientPhone, idempotencyKey } = await req.json()

    // 1. Idempotency check
    const { data: existingTx } = await supabase.from('transactions').select('*').eq('idempotency_key', idempotencyKey).maybeSingle()
    if (existingTx) return new Response(JSON.stringify({ success: true, data: existingTx, cached: true }), { headers: { ...cors, 'Content-Type': 'application/json' } })

    // 2. Get profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (profile.status === 'SUSPENDED') throw new Error('Account is suspended')

    // 3. Get bundle
    const { data: bundle } = await supabase.from('data_bundles').select('*').eq('id', bundleId).eq('is_active', true).single()
    if (!bundle) throw new Error('Bundle not found or inactive')

    // 4. Determine price by role
    const priceMap: Record<string, bigint> = {
      CUSTOMER: bundle.selling_price, RESELLER: bundle.reseller_price,
      AGENT: bundle.agent_price, SUPER_ADMIN: bundle.cost_price, NETWORK_ADMIN: bundle.cost_price,
    }
    const price = priceMap[profile.role] ?? bundle.selling_price

    // 5. Get wallet
    const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single()
    if (wallet.balance < price) throw new Error('Insufficient wallet balance')

    // 6. Deduct wallet atomically
    const { error: deductErr } = await supabase.rpc('deduct_wallet', { p_user_id: user.id, p_amount: price })
    if (deductErr) throw new Error('Wallet deduction failed: ' + deductErr.message)

    const { data: newWallet } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single()

    // 7. Create PENDING transaction
    const reference = `DH-${Date.now()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`
    const { data: tx } = await supabase.from('transactions').insert({
      user_id: user.id, type: 'DATA_PURCHASE', amount: price,
      balance_before: wallet.balance, balance_after: newWallet.balance,
      status: 'PENDING', reference, idempotency_key: idempotencyKey,
      network: bundle.network, recipient_phone: recipientPhone, bundle_id: bundleId,
      metadata: { bundle_name: bundle.name, data_size_mb: bundle.data_size_mb },
    }).select().single()

    // 8. Fulfil with telecom (mocked)
    const telecom = await fulfillBundle(bundle.network, recipientPhone, bundle.name)

    if (telecom.success) {
      const { data: successTx } = await supabase.from('transactions')
        .update({ status: 'SUCCESS', metadata: { ...tx.metadata, telecom_ref: telecom.reference } })
        .eq('id', tx.id).select().single()

      if (profile.role === 'RESELLER' && profile.agent_id) {
        await payCommission(supabase, tx.id, profile, bundle)
      }

      await supabase.from('audit_logs').insert({
        user_id: user.id, action: 'DATA_PURCHASE_SUCCESS', resource: 'transaction',
        metadata: { transaction_id: tx.id, bundle: bundle.name, recipient: recipientPhone },
      })

      return new Response(JSON.stringify({ success: true, data: successTx }), { headers: { ...cors, 'Content-Type': 'application/json' } })
    } else {
      await supabase.rpc('credit_wallet', { p_user_id: user.id, p_amount: price })
      await supabase.from('transactions').update({ status: 'FAILED', metadata: { ...tx.metadata, error: telecom.message } }).eq('id', tx.id)
      await trackFailed(supabase, user.id)
      throw new Error(telecom.message || 'Telecom fulfillment failed')
    }
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: err.message }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
  }
})

async function fulfillBundle(network: string, phone: string, name: string) {
  await new Promise(r => setTimeout(r, 800 + Math.random() * 1200))
  return Math.random() > 0.10
    ? { success: true, reference: `TELECOM-${network}-${Date.now()}` }
    : { success: false, message: 'Network temporarily unavailable' }
}

async function payCommission(supabase: any, txId: string, reseller: any, bundle: any) {
  const amount = bundle.reseller_price - bundle.agent_price
  if (amount <= 0) return
  await supabase.from('commissions').insert({ user_id: reseller.agent_id, transaction_id: txId, amount, type: 'AGENT', status: 'PENDING' })
  await supabase.rpc('credit_wallet', { p_user_id: reseller.agent_id, p_amount: amount })
  await supabase.from('commissions').update({ status: 'PAID', paid_at: new Date().toISOString() }).eq('transaction_id', txId)
}

async function trackFailed(supabase: any, userId: string) {
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString()
  const { count } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'FAILED').gte('created_at', oneHourAgo)
  if (count >= 5) {
    await supabase.from('profiles').update({ status: 'SUSPENDED' }).eq('id', userId)
    await supabase.from('audit_logs').insert({ user_id: userId, action: 'AUTO_SUSPEND', resource: 'profile', metadata: { reason: '5+ failed tx in 1hr' } })
  }
}
```

### topup-verify (`supabase/functions/topup-verify/index.ts`)

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: { user } } = await supabase.auth.getUser(req.headers.get('Authorization')!.replace('Bearer ', ''))
    if (!user) throw new Error('Unauthorized')

    const { reference } = await req.json()

    // Idempotency
    const { data: exists } = await supabase.from('transactions').select('*').eq('reference', reference).maybeSingle()
    if (exists?.status === 'SUCCESS') return new Response(JSON.stringify({ success: true, data: exists, cached: true }), { headers: { ...cors, 'Content-Type': 'application/json' } })

    // Verify Paystack
    const ps = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}` }
    })
    const psData = await ps.json()
    if (!psData.status || psData.data.status !== 'success') throw new Error('Payment verification failed')

    const amount = psData.data.amount // pesewas
    const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single()
    await supabase.rpc('credit_wallet', { p_user_id: user.id, p_amount: amount })
    const { data: newWallet } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single()

    const { data: tx } = await supabase.from('transactions').upsert({
      user_id: user.id, type: 'TOPUP', amount,
      balance_before: wallet.balance, balance_after: newWallet.balance,
      status: 'SUCCESS', reference, idempotency_key: `topup_${reference}`,
      metadata: { channel: psData.data.channel },
    }, { onConflict: 'reference' }).select().single()

    return new Response(JSON.stringify({ success: true, data: tx }), { headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: err.message }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
  }
})
```

### paystack-webhook (`supabase/functions/paystack-webhook/index.ts`)

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

serve(async (req) => {
  const body = await req.text()
  const sig = req.headers.get('x-paystack-signature')
  const hash = createHmac('sha512', Deno.env.get('PAYSTACK_SECRET_KEY')!).update(body).digest('hex')
  if (hash !== sig) return new Response('Invalid signature', { status: 401 })

  const event = JSON.parse(body)
  if (event.event !== 'charge.success') return new Response('OK', { status: 200 })

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { reference, amount, metadata } = event.data
  const userId = metadata?.user_id
  if (!userId) return new Response('Missing user_id', { status: 400 })

  const { data: exists } = await supabase.from('transactions').select('id').eq('reference', reference).maybeSingle()
  if (exists) return new Response('Already processed', { status: 200 })

  const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', userId).single()
  await supabase.rpc('credit_wallet', { p_user_id: userId, p_amount: amount })
  const { data: newWallet } = await supabase.from('wallets').select('balance').eq('user_id', userId).single()
  await supabase.from('transactions').insert({
    user_id: userId, type: 'TOPUP', amount,
    balance_before: wallet.balance, balance_after: newWallet.balance,
    status: 'SUCCESS', reference, idempotency_key: `webhook_${reference}`,
    metadata: { source: 'paystack_webhook' },
  })

  return new Response('OK', { status: 200 })
})
```

### invite-reseller (`supabase/functions/invite-reseller/index.ts`)

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: { user } } = await supabase.auth.getUser(req.headers.get('Authorization')!.replace('Bearer ', ''))
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role, invite_code').eq('id', user.id).single()
  if (!['AGENT','SUPER_ADMIN'].includes(profile.role)) return new Response(JSON.stringify({ error: 'Only agents can invite resellers' }), { status: 403 })

  let code = profile.invite_code
  if (!code) {
    code = `AGT-${user.id.slice(0,6).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`
    await supabase.from('profiles').update({ invite_code: code }).eq('id', user.id)
  }

  return new Response(
    JSON.stringify({ success: true, inviteCode: code, inviteUrl: `${Deno.env.get('SITE_URL')}/register?invite=${code}` }),
    { headers: { ...cors, 'Content-Type': 'application/json' } }
  )
})
```

---

## FRONTEND: AUTH API

```javascript
// src/api/auth.api.js
import { supabase } from './supabase'

export async function register({ email, password, firstName, lastName, phone, role, inviteCode }) {
  if (['AGENT','RESELLER'].includes(role)) {
    const { data: inviter } = await supabase.from('profiles').select('id,role').eq('invite_code', inviteCode).single()
    if (!inviter) throw new Error('Invalid invite code')
    if (role === 'RESELLER' && inviter.role !== 'AGENT') throw new Error('Invite code is not from an agent')
  }

  const { data: authData, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error

  const profilePayload = { id: authData.user.id, email, phone, first_name: firstName, last_name: lastName, role }

  if (role === 'RESELLER') {
    const { data: agent } = await supabase.from('profiles').select('id').eq('invite_code', inviteCode).single()
    profilePayload.agent_id = agent.id
  }

  const { error: profileErr } = await supabase.from('profiles').insert(profilePayload)
  if (profileErr) throw profileErr
  return authData
}

export async function login({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
  if (profile?.status === 'SUSPENDED') { await supabase.auth.signOut(); throw new Error('Account suspended. Contact support.') }
  return { session: data.session, profile }
}

export async function logout() { await supabase.auth.signOut() }

export async function forgotPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
  if (error) throw error
}

export async function getCurrentProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  return data
}
```

---

## FRONTEND: WALLET + TRANSACTIONS API

```javascript
// src/api/wallet.api.js
import { supabase } from './supabase'

export async function getWalletBalance() {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase.from('wallets').select('balance,currency,last_updated').eq('user_id', user.id).single()
  if (error) throw error
  return data
}

export async function verifyTopup(reference) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/topup-verify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ reference }),
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.message)
  return data.data
}

// src/api/transactions.api.js
import { supabase } from './supabase'

export async function buyData({ bundleId, recipientPhone, idempotencyKey }) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/buy-data`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ bundleId, recipientPhone, idempotencyKey }),
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.message)
  return data.data
}

export async function getTransactions({ page = 1, limit = 20, type, status, network, from, to } = {}) {
  const { data: { user } } = await supabase.auth.getUser()
  let query = supabase
    .from('transactions')
    .select('*, data_bundles(name,data_size_mb,validity_days)', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range((page-1)*limit, page*limit-1)
  if (type) query = query.eq('type', type)
  if (status) query = query.eq('status', status)
  if (network) query = query.eq('network', network)
  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)
  const { data, count, error } = await query
  if (error) throw error
  return { data, total: count, page, limit, totalPages: Math.ceil(count/limit) }
}
```

---

## FRONTEND: BUNDLES + ADMIN API

```javascript
// src/api/bundles.api.js
import { supabase } from './supabase'

export async function getBundles({ network, role } = {}) {
  let query = supabase.from('data_bundles').select('*').eq('is_active', true).order('data_size_mb')
  if (network) query = query.eq('network', network)
  const { data, error } = await query
  if (error) throw error
  const priceField = { CUSTOMER:'selling_price', RESELLER:'reseller_price', AGENT:'agent_price', SUPER_ADMIN:'cost_price', NETWORK_ADMIN:'cost_price' }[role] || 'selling_price'
  return data.map(b => ({ ...b, price: b[priceField] }))
}

// src/api/admin.api.js
import { supabase } from './supabase'

export async function getAdminDashboardStats() {
  const { data, error } = await supabase.rpc('get_admin_dashboard_stats')
  if (error) throw error
  return data
}

export async function getRevenueChart(days = 30) {
  const { data, error } = await supabase.rpc('get_revenue_chart', { p_days: days })
  if (error) throw error
  return data
}

export async function getAllUsers({ page=1, limit=20, role, status } = {}) {
  let query = supabase.from('profiles').select('*, wallets(balance)', { count: 'exact' })
    .order('created_at', { ascending: false }).range((page-1)*limit, page*limit-1)
  if (role) query = query.eq('role', role)
  if (status) query = query.eq('status', status)
  const { data, count, error } = await query
  if (error) throw error
  return { data, total: count }
}

export async function updateUserStatus(userId, status) {
  const { error } = await supabase.from('profiles').update({ status }).eq('id', userId)
  if (error) throw error
  await supabase.from('audit_logs').insert({ action: `USER_${status}`, resource: 'profile', metadata: { target_user_id: userId } })
}

export async function getAllTransactions({ page=1, limit=20, type, status, network, from, to } = {}) {
  let query = supabase.from('transactions').select('*, profiles(first_name,last_name,email), data_bundles(name)', { count: 'exact' })
    .order('created_at', { ascending: false }).range((page-1)*limit, page*limit-1)
  if (type) query = query.eq('type', type)
  if (status) query = query.eq('status', status)
  if (network) query = query.eq('network', network)
  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)
  const { data, count, error } = await query
  if (error) throw error
  return { data, total: count }
}
```

---

## ZUSTAND STORES

```javascript
// src/store/authStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(persist(
  (set) => ({
    profile: null, session: null, isAuthenticated: false,
    setAuth: (profile, session) => set({ profile, session, isAuthenticated: true }),
    updateProfile: (u) => set(s => ({ profile: { ...s.profile, ...u } })),
    clearAuth: () => set({ profile: null, session: null, isAuthenticated: false }),
  }),
  { name: 'datahub-auth' }
))

// src/store/walletStore.js
import { create } from 'zustand'

export const useWalletStore = create((set) => ({
  balance: 0,
  setBalance: (balance) => set({ balance }),
}))
```

---

## HOOKS

```javascript
// src/hooks/useAuth.js
import { useEffect } from 'react'
import { supabase } from '../api/supabase'
import { useAuthStore } from '../store/authStore'
import { getCurrentProfile } from '../api/auth.api'

export function useAuthListener() {
  const { setAuth, clearAuth } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) { const p = await getCurrentProfile(); if (p) setAuth(p, session) }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) { const p = await getCurrentProfile(); if (p) setAuth(p, session) }
      else if (event === 'SIGNED_OUT') clearAuth()
    })

    return () => subscription.unsubscribe()
  }, [])
}

// src/hooks/useRole.js
import { useAuthStore } from '../store/authStore'

export function useRole() {
  const { profile } = useAuthStore()
  const role = profile?.role || 'CUSTOMER'

  const navItems = {
    SUPER_ADMIN: [
      { label: 'Dashboard', icon: 'LayoutDashboard', path: '/admin' },
      { label: 'Users', icon: 'Users', path: '/admin/users' },
      { label: 'Transactions', icon: 'ArrowLeftRight', path: '/admin/transactions' },
      { label: 'Agents', icon: 'UserCheck', path: '/admin/agents' },
      { label: 'Bundles', icon: 'Package', path: '/admin/bundles' },
      { label: 'Finance', icon: 'DollarSign', path: '/admin/finance' },
      { label: 'Audit Logs', icon: 'ScrollText', path: '/admin/audit-logs' },
    ],
    NETWORK_ADMIN: [
      { label: 'Dashboard', icon: 'LayoutDashboard', path: '/admin' },
      { label: 'Transactions', icon: 'ArrowLeftRight', path: '/admin/transactions' },
      { label: 'Agents', icon: 'UserCheck', path: '/admin/agents' },
      { label: 'Bundles', icon: 'Package', path: '/admin/bundles' },
    ],
    AGENT: [
      { label: 'Dashboard', icon: 'LayoutDashboard', path: '/agent' },
      { label: 'Buy Bulk', icon: 'ShoppingCart', path: '/agent/buy-bulk' },
      { label: 'My Resellers', icon: 'Users', path: '/agent/resellers' },
      { label: 'Commissions', icon: 'Banknote', path: '/agent/commissions' },
      { label: 'Wallet', icon: 'Wallet', path: '/agent/wallet' },
    ],
    RESELLER: [
      { label: 'Dashboard', icon: 'LayoutDashboard', path: '/reseller' },
      { label: 'Sell Data', icon: 'Wifi', path: '/reseller/sell' },
      { label: 'Earnings', icon: 'TrendingUp', path: '/reseller/earnings' },
      { label: 'Wallet', icon: 'Wallet', path: '/reseller/wallet' },
    ],
    CUSTOMER: [
      { label: 'Home', icon: 'Home', path: '/' },
      { label: 'Buy Data', icon: 'Wifi', path: '/buy' },
      { label: 'History', icon: 'History', path: '/history' },
    ],
  }

  const dashboardPath = {
    SUPER_ADMIN: '/admin', NETWORK_ADMIN: '/admin',
    AGENT: '/agent', RESELLER: '/reseller', CUSTOMER: '/', AUDITOR: '/admin/audit-logs',
  }[role]

  return { role, navItems: navItems[role] || navItems.CUSTOMER, dashboardPath }
}

// src/hooks/useWallet.js
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../api/supabase'
import { useAuthStore } from '../store/authStore'
import { useWalletStore } from '../store/walletStore'

export function useWallet() {
  const { profile } = useAuthStore()
  const { setBalance } = useWalletStore()

  const query = useQuery({
    queryKey: ['wallet', profile?.id],
    queryFn: async () => {
      const { data } = await supabase.from('wallets').select('balance').eq('user_id', profile.id).single()
      return data
    },
    enabled: !!profile?.id,
    onSuccess: (data) => setBalance(data.balance),
  })

  useEffect(() => {
    if (!profile?.id) return
    const channel = supabase.channel(`wallet:${profile.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'wallets', filter: `user_id=eq.${profile.id}` },
        (payload) => { setBalance(payload.new.balance); query.refetch() })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [profile?.id])

  return query
}
```

---

## ROUTER SETUP

```javascript
// src/router/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, profile } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(profile?.role)) return <Navigate to="/" replace />
  return children
}

// src/router/RoleRedirect.jsx
import { Navigate } from 'react-router-dom'
import { useRole } from '../hooks/useRole'

export function RoleRedirect() {
  const { dashboardPath } = useRole()
  return <Navigate to={dashboardPath} replace />
}
```

All routes in `src/router/index.jsx`:
- Public: `/login`, `/register`, `/forgot-password`, `/reset-password`
- Customer: `/` (Dashboard), `/buy` (BuyData), `/history`
- Agent: `/agent`, `/agent/buy-bulk`, `/agent/resellers`, `/agent/commissions`, `/agent/wallet`
- Reseller: `/reseller`, `/reseller/sell`, `/reseller/earnings`, `/reseller/wallet`
- Admin: `/admin`, `/admin/users`, `/admin/transactions`, `/admin/agents`, `/admin/bundles`, `/admin/finance`, `/admin/audit-logs`
- Root `/` → RoleRedirect

Wrap each role group in ProtectedRoute with `allowedRoles` prop.

---

## TAILWIND CONFIG

```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0066FF', 50: '#EBF2FF', 100: '#D6E5FF', 600: '#0052CC', 700: '#003D99' },
        success: { DEFAULT: '#00C48C', light: '#E6FAF5' },
        warning: { DEFAULT: '#FFB300', light: '#FFF8E6' },
        danger:  { DEFAULT: '#FF4444', light: '#FFE8E8' },
        surface: '#F8FAFF',
        dark:    '#0A0F1E',
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
    },
  },
}
```

Add to `index.html` `<head>`:
```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
```

---

## UTILITY FUNCTIONS

```javascript
// src/utils/formatCurrency.js
// ALL money is stored as integers in pesewas (GHS * 100). NEVER use floats.
export const formatGHS = (pesewas) => `GHS ${(pesewas / 100).toFixed(2)}`
export const pesewasToGHS = (p) => p / 100
export const GHSToPesewas = (g) => Math.round(g * 100)

// src/utils/phoneValidation.js
export function isValidGhanaPhone(phone) {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  const n = cleaned.startsWith('+233') ? '0'+cleaned.slice(4) : cleaned.startsWith('233') ? '0'+cleaned.slice(3) : cleaned
  return /^0(2[0-9]|5[0-9])\d{7}$/.test(n)
}

export function normalizeGhanaPhone(phone) {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  if (cleaned.startsWith('+233')) return '0'+cleaned.slice(4)
  if (cleaned.startsWith('233')) return '0'+cleaned.slice(3)
  return cleaned
}
```

---

## SEED DATA

Run `supabase/seed.sql` in Supabase SQL editor after migration:

```sql
INSERT INTO data_bundles (network,name,data_size_mb,validity_days,cost_price,selling_price,agent_price,reseller_price) VALUES
('MTN','MTN 100MB Daily',100,1,100,150,120,130),
('MTN','MTN 1GB Weekly',1024,7,500,700,550,600),
('MTN','MTN 3GB Monthly',3072,30,1200,1600,1300,1400),
('MTN','MTN 10GB Monthly',10240,30,3500,4500,3800,4000),
('TELECEL','Telecel 200MB Daily',200,1,120,180,140,155),
('TELECEL','Telecel 1.5GB Weekly',1536,7,600,800,650,700),
('TELECEL','Telecel 4GB Monthly',4096,30,1400,1900,1550,1650),
('TELECEL','Telecel 12GB Monthly',12288,30,4000,5000,4200,4500),
('AT','AT 150MB Daily',150,1,110,160,130,140),
('AT','AT 1GB Weekly',1024,7,520,720,570,620),
('AT','AT 3.5GB Monthly',3584,30,1300,1750,1400,1500),
('AT','AT 8GB Monthly',8192,30,2800,3600,3000,3200);
```

For user accounts: create via Supabase Auth admin API using service role key in a one-time Node script.

Accounts to create:
- admin@datahub.gh / Admin1234! → SUPER_ADMIN
- netadmin@datahub.gh / Admin1234! → NETWORK_ADMIN
- agent1@datahub.gh, agent2@datahub.gh, agent3@datahub.gh / Agent1234! → AGENT
- reseller1-9@datahub.gh / Reseller1234! → RESELLER (3 per agent)
- customer1-15@datahub.gh / Customer1234! → CUSTOMER

After accounts created, top up wallets:
```sql
UPDATE wallets SET balance = 50000 WHERE user_id IN (SELECT id FROM profiles WHERE role = 'AGENT');
UPDATE wallets SET balance = 10000 WHERE user_id IN (SELECT id FROM profiles WHERE role = 'RESELLER');
UPDATE wallets SET balance = FLOOR(RANDOM()*3000+2000) WHERE user_id IN (SELECT id FROM profiles WHERE role = 'CUSTOMER');
```

---

## EDGE FUNCTION DEPLOYMENT

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy buy-data
supabase functions deploy topup-verify
supabase functions deploy paystack-webhook
supabase functions deploy invite-reseller
```

Set secrets in Supabase Dashboard → Settings → Edge Functions → Secrets.

---

## CALLING EDGE FUNCTIONS (pattern for all function calls)

```javascript
async function callEdgeFunction(name, body) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.message)
  return data.data
}
```

---

## UI DESIGN RULES (apply to every component)

1. **Icons:** Lucide React only. Never use emojis as icons.
2. **Fonts:** Plus Jakarta Sans (headings), DM Sans (body/UI)
3. **Colors:** always use Tailwind custom colors defined in config — no ad hoc hex values in JSX
4. **Sidebar:** dark bg `#0A0F1E`, white text, `rounded-xl` active pill
5. **Page background:** `bg-surface` (`#F8FAFF`)
6. **Cards:** `bg-white rounded-xl shadow-sm`
7. **Loading:** every data fetch shows skeleton or Spinner — never blank/empty screen during loading
8. **Empty states:** every list/table shows EmptyState component when no data
9. **Animations:** Framer Motion for page transitions (fade+translateY), modal open/close, sidebar drawer
10. **Mobile:** sidebar as drawer on mobile (hamburger), tables scroll horizontally on small screens
11. **Network colors:** MTN=`#FFCC00`+dark text, Telecel=`#E40000`+white text, AirtelTigo=`#003087`+white text
12. **Transaction amounts:** green text for credits (TOPUP, COMMISSION), red for debits (DATA_PURCHASE)
13. **Status badges:** SUCCESS=success color, PENDING=warning, FAILED=danger, REVERSED=gray

---

## BUILD ORDER

```
PHASE 1 — Setup
  1. Create Vite+React project, install all packages
  2. Tailwind config + Google Fonts in index.html
  3. Create Supabase project at supabase.com
  4. Run 001_initial_schema.sql in SQL editor (includes RLS, DB functions, triggers)
  5. src/api/supabase.js — client singleton
  6. Zustand stores (authStore, walletStore)
  7. .env.local with Supabase URL + anon key

PHASE 2 — Auth
  8. src/api/auth.api.js — all auth functions
  9. useAuthListener hook
  10. Login page (React Hook Form + Zod)
  11. Register page (role select, conditional invite code)
  12. ForgotPassword + reset-password pages
  13. Router (all routes, ProtectedRoute, RoleRedirect)
  14. AuthLayout
  15. TEST: register, login, session persists on page refresh, logout

PHASE 3 — Layout + UI Components
  16. All UI components (Button, Input, Card, Badge, Modal, DataTable, Spinner, EmptyState)
  17. DashboardLayout + Sidebar (role-based nav) + TopBar (live wallet balance)
  18. useRole hook

PHASE 4 — Wallet
  19. Verify deduct_wallet + credit_wallet DB functions work (test in SQL editor)
  20. wallet.api.js (getWalletBalance, verifyTopup)
  21. useWallet hook with Realtime subscription
  22. WalletCard component
  23. TopUp flow (Paystack initialize → redirect → verifyTopup on callback)
  24. Deploy topup-verify edge function
  25. TEST: top up wallet, see balance update live via Realtime

PHASE 5 — Bundles + Buy Data
  26. Run seed.sql (bundles)
  27. bundles.api.js + BundleCard + NetworkSelector
  28. Deploy buy-data edge function
  29. CustomerBuyData.jsx — full 4-step flow (network → bundle → phone → confirm modal)
  30. Success screen (checkmark animation) + failure screen
  31. CustomerHistory.jsx (DataTable + filters + detail modal)
  32. CustomerDashboard.jsx
  33. TEST: complete full buy-data flow end-to-end

PHASE 6 — Agent + Reseller
  34. Deploy invite-reseller edge function
  35. agents.api.js
  36. Agent pages (Dashboard, BuyBulk, Resellers, Commissions, Wallet)
  37. Reseller pages (Dashboard, SellData, Earnings, Wallet)
  38. TEST: reseller buys data → agent gets commission → both wallets update

PHASE 7 — Admin
  39. admin.api.js (stats, revenue chart, users, transactions)
  40. AdminDashboard (StatCards + Recharts LineChart + BarChart)
  41. AdminUsers (DataTable + suspend/activate)
  42. AdminTransactions (all users, all filters)
  43. AdminBundles (CRUD with modals)
  44. AdminAgents (performance table)
  45. AdminFinance (summary cards + Recharts PieChart)
  46. AdminAuditLogs (read-only)

PHASE 8 — Polish + Deploy
  47. Deploy paystack-webhook edge function
  48. Create seed user accounts (service role script)
  49. Error boundaries on all routes
  50. Loading skeleton audit — every page
  51. Empty states audit — every list/table
  52. Mobile responsiveness pass
  53. README.md
```

---

## FINAL NOTES

- Follow the build order above exactly — do not skip phases
- Run the migration SQL before writing any code
- Edge functions must be deployed before testing buy-data or topup
- All money stored as integers in pesewas — convert only at display time
- RLS controls what users can read — edge functions use service role key for all writes
- Realtime wallet updates use Supabase channel subscriptions
- Seed admin login: **admin@datahub.gh / Admin1234!**
- No hardcoded content in JSX — every screen reads live from Supabase
- Ask before deviating from any decision in this spec

---
*End of DATAHUB_BUILD.md — Supabase Edition*
