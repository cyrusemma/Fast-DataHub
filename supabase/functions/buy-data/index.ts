import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/cors.ts'

const priceField: Record<string, string> = {
  CUSTOMER: 'selling_price',
  RESELLER: 'reseller_price',
  AGENT: 'agent_price',
  SUPER_ADMIN: 'cost_price',
  NETWORK_ADMIN: 'cost_price',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) throw new Error('Unauthorized')

    const { bundleId, recipientPhone, idempotencyKey } = await req.json()
    const { data: existing } = await supabase.from('transactions').select('*').eq('idempotency_key', idempotencyKey).maybeSingle()
    if (existing) return json({ success: true, data: existing, cached: true })

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!profile || profile.status === 'SUSPENDED') throw new Error('Account is suspended')
    const { data: bundle } = await supabase.from('data_bundles').select('*').eq('id', bundleId).eq('is_active', true).single()
    if (!bundle) throw new Error('Bundle not found or inactive')

    const amount = bundle[priceField[profile.role] || 'selling_price']
    const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single()
    if (!wallet || wallet.balance < amount) throw new Error('Insufficient wallet balance')
    const before = wallet.balance
    const { error: deductError } = await supabase.rpc('deduct_wallet', { p_user_id: user.id, p_amount: amount })
    if (deductError) throw deductError
    const { data: newWallet } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single()

    const reference = `DH-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
    const { data: tx, error: txError } = await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'DATA_PURCHASE',
      amount,
      balance_before: before,
      balance_after: newWallet.balance,
      status: 'SUCCESS',
      reference,
      idempotency_key: idempotencyKey,
      network: bundle.network,
      recipient_phone: recipientPhone,
      bundle_id: bundle.id,
      metadata: { bundle_name: bundle.name, data_size_mb: bundle.data_size_mb, telecom_mocked: true },
    }).select().single()
    if (txError) throw txError

    if (profile.role === 'RESELLER' && profile.agent_id) {
      const commission = bundle.reseller_price - bundle.agent_price
      if (commission > 0) {
        await supabase.from('commissions').insert({ user_id: profile.agent_id, transaction_id: tx.id, amount: commission, type: 'AGENT', status: 'PAID', paid_at: new Date().toISOString() })
        await supabase.rpc('credit_wallet', { p_user_id: profile.agent_id, p_amount: commission })
      }
    }

    await supabase.from('audit_logs').insert({ user_id: user.id, action: 'DATA_PURCHASE_SUCCESS', resource: 'transaction', metadata: { transaction_id: tx.id } })
    return json({ success: true, data: tx })
  } catch (error) {
    return json({ success: false, message: error.message }, 400)
  }
})
