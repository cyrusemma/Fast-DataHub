# DataHUB

Production-style mobile data reseller platform for Ghana, built with React, Vite, Tailwind, Supabase, Paystack, TanStack Query, Zustand, Recharts, Framer Motion, and Lucide icons.

## Run locally

```bash
npm install
npm run dev
```

The app runs in mock mode when `.env.local` contains placeholder Supabase values. Mock mode includes seeded users, bundles, wallets, transactions, commissions, realtime-like wallet updates, top-ups, and data purchases.

Demo logins:

- `admin@datahub.gh` / `Admin1234!`
- `agent1@datahub.gh` / `Agent1234!`
- `reseller1@datahub.gh` / `Reseller1234!`
- `customer1@datahub.gh` / `Customer1234!`

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/migrations/001_initial_schema.sql` in the SQL editor.
3. Run `supabase/seed.sql` for bundle data.
4. Fill `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_key
```

5. Set Edge Function secrets:

```env
PAYSTACK_SECRET_KEY=sk_test_your_key
SITE_URL=http://localhost:5173
```

6. Deploy functions:

```bash
supabase functions deploy buy-data
supabase functions deploy topup-verify
supabase functions deploy paystack-webhook
supabase functions deploy invite-reseller
```

## Seed users

```bash
$env:SUPABASE_URL="https://your-project.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
npm run seed:users
```

All money values are stored as integer pesewas.
