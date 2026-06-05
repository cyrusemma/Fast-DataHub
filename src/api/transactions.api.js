import { supabase, IS_MOCK } from './supabase'
import { mockBuyData } from './mock/mockEdge'

export async function buyData({ bundleId, recipientPhone, idempotencyKey }) {
  if (IS_MOCK) return mockBuyData({ bundleId, recipientPhone, idempotencyKey })
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

// Lightweight recent-activity feed for dashboards.
export async function getRecentTransactions(limit = 5) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('transactions')
    .select('*, data_bundles(name,data_size_mb)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(0, limit - 1)
  if (error) throw error
  return data
}

// Aggregate stats for the current user (used by customer/reseller dashboards).
export async function getMyStats() {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('transactions')
    .select('type,amount,status,created_at')
    .eq('user_id', user.id)
  if (error) throw error
  const rows = data || []
  const purchases = rows.filter((t) => t.type === 'DATA_PURCHASE' && t.status === 'SUCCESS')
  const today = new Date().toDateString()
  return {
    totalSpent: purchases.reduce((s, t) => s + t.amount, 0),
    purchaseCount: purchases.length,
    todayCount: rows.filter((t) => new Date(t.created_at).toDateString() === today).length,
    successCount: rows.filter((t) => t.status === 'SUCCESS').length,
    totalCount: rows.length,
  }
}
