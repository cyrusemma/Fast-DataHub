// Local re-implementations of the Supabase Edge Functions (buy-data,
// topup-verify, invite-reseller) so the buy/top-up flows work end-to-end in
// mock mode. Logic mirrors supabase/functions/*/index.ts.

import { getDB, saveDB, uuid } from './mockData'
import { mockSupabase } from './mockClient'

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

function currentUserId() {
  const db = getDB()
  return db.session?.user?.id || null
}

const PRICE_FIELD = {
  CUSTOMER: 'selling_price',
  RESELLER: 'reseller_price',
  AGENT: 'agent_price',
  SUPER_ADMIN: 'cost_price',
  NETWORK_ADMIN: 'cost_price',
}

export async function mockBuyData({ bundleId, recipientPhone, idempotencyKey }) {
  const db = getDB()
  const userId = currentUserId()
  if (!userId) throw new Error('Unauthorized')

  // 1. Idempotency
  const existing = db.transactions.find((t) => t.idempotency_key === idempotencyKey)
  if (existing) return existing

  // 2. Profile
  const profile = db.profiles.find((p) => p.id === userId)
  if (!profile) throw new Error('Profile not found')
  if (profile.status === 'SUSPENDED') throw new Error('Account is suspended')

  // 3. Bundle
  const bundle = db.data_bundles.find((b) => b.id === bundleId && b.is_active)
  if (!bundle) throw new Error('Bundle not found or inactive')

  // 4. Price by role
  const price = bundle[PRICE_FIELD[profile.role] || 'selling_price']

  // 5 + 6. Wallet check + deduct
  const wallet = db.wallets.find((w) => w.user_id === userId)
  if (!wallet || wallet.balance < price) throw new Error('Insufficient wallet balance')
  const balanceBefore = wallet.balance
  const { error: deductErr } = await mockSupabase.rpc('deduct_wallet', { p_user_id: userId, p_amount: price })
  if (deductErr) throw new Error('Wallet deduction failed: ' + deductErr.message)
  const balanceAfter = db.wallets.find((w) => w.user_id === userId).balance

  // 7. PENDING transaction
  const reference = `DH-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
  const tx = {
    id: uuid(),
    user_id: userId,
    type: 'DATA_PURCHASE',
    amount: price,
    fee: 0,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    status: 'PENDING',
    reference,
    idempotency_key: idempotencyKey,
    network: bundle.network,
    recipient_phone: recipientPhone,
    bundle_id: bundleId,
    metadata: { bundle_name: bundle.name, data_size_mb: bundle.data_size_mb },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  db.transactions.unshift(tx)
  saveDB()

  // 8. Fulfil (mocked telecom — ~90% success)
  await delay(800 + Math.random() * 1200)
  const success = Math.random() > 0.1

  if (success) {
    tx.status = 'SUCCESS'
    tx.metadata = { ...tx.metadata, telecom_ref: `TELECOM-${bundle.network}-${Date.now()}` }
    tx.updated_at = new Date().toISOString()

    // Commission to agent for resellers
    if (profile.role === 'RESELLER' && profile.agent_id) {
      const amount = bundle.reseller_price - bundle.agent_price
      if (amount > 0) {
        db.commissions.unshift({
          id: uuid(),
          user_id: profile.agent_id,
          transaction_id: tx.id,
          amount,
          type: 'AGENT',
          status: 'PAID',
          paid_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        })
        await mockSupabase.rpc('credit_wallet', { p_user_id: profile.agent_id, p_amount: amount })
      }
    }

    db.audit_logs.unshift({
      id: uuid(),
      user_id: userId,
      action: 'DATA_PURCHASE_SUCCESS',
      resource: 'transaction',
      metadata: { transaction_id: tx.id, bundle: bundle.name, recipient: recipientPhone },
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString(),
    })
    saveDB()
    return tx
  } else {
    // Refund + mark failed
    await mockSupabase.rpc('credit_wallet', { p_user_id: userId, p_amount: price })
    tx.status = 'FAILED'
    tx.metadata = { ...tx.metadata, error: 'Network temporarily unavailable' }
    saveDB()
    throw new Error('Network temporarily unavailable')
  }
}

// Simulated Paystack top-up: credits wallet immediately and records a TOPUP tx.
export async function mockTopup({ amount, reference, channel = 'card' }) {
  const db = getDB()
  const userId = currentUserId()
  if (!userId) throw new Error('Unauthorized')

  const ref = reference || `TOPUP-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
  const existing = db.transactions.find((t) => t.reference === ref)
  if (existing?.status === 'SUCCESS') return existing

  const wallet = db.wallets.find((w) => w.user_id === userId)
  const balanceBefore = wallet.balance
  await delay(600)
  await mockSupabase.rpc('credit_wallet', { p_user_id: userId, p_amount: amount })
  const balanceAfter = db.wallets.find((w) => w.user_id === userId).balance

  const tx = {
    id: uuid(),
    user_id: userId,
    type: 'TOPUP',
    amount,
    fee: 0,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    status: 'SUCCESS',
    reference: ref,
    idempotency_key: `topup_${ref}`,
    network: null,
    recipient_phone: null,
    bundle_id: null,
    metadata: { channel, source: 'mock_paystack' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  db.transactions.unshift(tx)
  saveDB()
  return tx
}

export async function mockInviteReseller() {
  const db = getDB()
  const userId = currentUserId()
  if (!userId) throw new Error('Unauthorized')
  const profile = db.profiles.find((p) => p.id === userId)
  if (!['AGENT', 'SUPER_ADMIN'].includes(profile.role)) throw new Error('Only agents can invite resellers')

  let code = profile.invite_code
  if (!code) {
    code = `AGT-${userId.slice(0, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    profile.invite_code = code
    saveDB()
  }
  return { inviteCode: code, inviteUrl: `${window.location.origin}/register?invite=${code}` }
}
