import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) throw new Error('Unauthorized')

    const { reference } = await req.json()
    const paystack = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}` },
    }).then((r) => r.json())
    if (!paystack.status || paystack.data.status !== 'success') throw new Error('Payment not successful')

    const amount = paystack.data.amount
    const existing = await supabase.from('transactions').select('*').eq('reference', reference).maybeSingle()
    if (existing.data?.status === 'SUCCESS') return json({ success: true, data: existing.data, cached: true })

    const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single()
    await supabase.rpc('credit_wallet', { p_user_id: user.id, p_amount: amount })
    const { data: newWallet } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single()
    const { data: tx } = await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'TOPUP',
      amount,
      balance_before: wallet.balance,
      balance_after: newWallet.balance,
      status: 'SUCCESS',
      reference,
      idempotency_key: `topup_${reference}`,
      metadata: { provider: 'paystack', channel: paystack.data.channel },
    }).select().single()
    return json({ success: true, data: tx })
  } catch (error) {
    return json({ success: false, message: error.message }, 400)
  }
})
