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

export async function getAllUsers({ page = 1, limit = 20, role, status } = {}) {
  let query = supabase
    .from('profiles')
    .select('*, wallets(balance)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)
  if (role) query = query.eq('role', role)
  if (status) query = query.eq('status', status)
  const { data, count, error } = await query
  if (error) throw error
  return { data, total: count, page, limit, totalPages: Math.max(1, Math.ceil((count || 0) / limit)) }
}

export async function updateUserStatus(userId, status) {
  const { error } = await supabase.from('profiles').update({ status }).eq('id', userId)
  if (error) throw error
  await supabase.from('audit_logs').insert({
    user_id: userId,
    action: `USER_${status}`,
    resource: 'profile',
    metadata: { target_user_id: userId },
  })
}

export async function getAllTransactions({ page = 1, limit = 20, type, status, network, from, to } = {}) {
  let query = supabase
    .from('transactions')
    .select('*, profiles(first_name,last_name,email), data_bundles(name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)
  if (type) query = query.eq('type', type)
  if (status) query = query.eq('status', status)
  if (network) query = query.eq('network', network)
  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)
  const { data, count, error } = await query
  if (error) throw error
  return { data, total: count, page, limit, totalPages: Math.max(1, Math.ceil((count || 0) / limit)) }
}

export async function getAuditLogs({ page = 1, limit = 30 } = {}) {
  const { data, count, error } = await supabase
    .from('audit_logs')
    .select('*, profiles(first_name,last_name,email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)
  if (error) throw error
  return { data, total: count, page, limit, totalPages: Math.max(1, Math.ceil((count || 0) / limit)) }
}

// Agent performance leaderboard (mock-friendly aggregate).
export async function getAgentPerformance() {
  const { data: agents } = await supabase.from('profiles').select('*').eq('role', 'AGENT')
  const { data: resellers } = await supabase.from('profiles').select('id,agent_id').eq('role', 'RESELLER')
  const { data: commissions } = await supabase.from('commissions').select('user_id,amount,status')
  return (agents || []).map((a) => {
    const myResellers = (resellers || []).filter((r) => r.agent_id === a.id)
    const myComm = (commissions || []).filter((c) => c.user_id === a.id)
    return {
      ...a,
      resellerCount: myResellers.length,
      totalCommission: myComm.reduce((s, c) => s + c.amount, 0),
      pendingCommission: myComm.filter((c) => c.status === 'PENDING').reduce((s, c) => s + c.amount, 0),
    }
  })
}

// Finance breakdown: revenue, cost, margin + revenue-by-network for pie chart.
export async function getFinanceSummary() {
  const { data: tx } = await supabase
    .from('transactions')
    .select('amount,type,status,network,bundle_id')
    .eq('type', 'DATA_PURCHASE')
    .eq('status', 'SUCCESS')
  const { data: bundles } = await supabase.from('data_bundles').select('id,cost_price')
  const costMap = Object.fromEntries((bundles || []).map((b) => [b.id, b.cost_price]))

  const rows = tx || []
  const revenue = rows.reduce((s, t) => s + t.amount, 0)
  const cost = rows.reduce((s, t) => s + (costMap[t.bundle_id] || 0), 0)
  const byNetwork = {}
  rows.forEach((t) => {
    byNetwork[t.network] = (byNetwork[t.network] || 0) + t.amount
  })
  return {
    revenue,
    cost,
    margin: revenue - cost,
    byNetwork: Object.entries(byNetwork).map(([network, value]) => ({ network, value })),
  }
}
