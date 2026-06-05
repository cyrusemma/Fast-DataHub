import { supabase, IS_MOCK } from './supabase'
import { mockInviteReseller } from './mock/mockEdge'

export async function getInviteCode() {
  if (IS_MOCK) return mockInviteReseller()
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-reseller`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Could not generate invite code')
  return { inviteCode: data.inviteCode, inviteUrl: data.inviteUrl }
}

// Resellers under the current agent (with wallet balance).
export async function getMyResellers() {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('profiles')
    .select('*, wallets(balance)')
    .eq('agent_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getMyCommissions({ status } = {}) {
  const { data: { user } } = await supabase.auth.getUser()
  let query = supabase
    .from('commissions')
    .select('*, transactions(reference,network,created_at)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

// Aggregate agent stats: reseller count, commission totals.
export async function getAgentStats() {
  const { data: { user } } = await supabase.auth.getUser()
  const [{ data: resellers }, { data: commissions }] = await Promise.all([
    supabase.from('profiles').select('id').eq('agent_id', user.id),
    supabase.from('commissions').select('amount,status').eq('user_id', user.id),
  ])
  const comm = commissions || []
  return {
    resellerCount: (resellers || []).length,
    totalCommission: comm.reduce((s, c) => s + c.amount, 0),
    paidCommission: comm.filter((c) => c.status === 'PAID').reduce((s, c) => s + c.amount, 0),
    pendingCommission: comm.filter((c) => c.status === 'PENDING').reduce((s, c) => s + c.amount, 0),
  }
}

// Reseller earnings: commissions generated FOR this reseller's agent are the
// agent's; a reseller's own "earnings" = margin between their sale price and what
// they paid. We surface their successful sales + computed margin.
export async function getResellerEarnings() {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('transactions')
    .select('*, data_bundles(name,reseller_price,agent_price)')
    .eq('user_id', user.id)
    .eq('type', 'DATA_PURCHASE')
    .eq('status', 'SUCCESS')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}
