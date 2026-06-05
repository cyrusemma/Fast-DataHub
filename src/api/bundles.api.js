import { supabase } from './supabase'

const PRICE_FIELD = {
  CUSTOMER: 'selling_price',
  RESELLER: 'reseller_price',
  AGENT: 'agent_price',
  SUPER_ADMIN: 'cost_price',
  NETWORK_ADMIN: 'cost_price',
}

export async function getBundles({ network, role } = {}) {
  let query = supabase.from('data_bundles').select('*').eq('is_active', true).order('data_size_mb')
  if (network) query = query.eq('network', network)
  const { data, error } = await query
  if (error) throw error
  const priceField = PRICE_FIELD[role] || 'selling_price'
  return (data || []).map((b) => ({ ...b, price: b[priceField] }))
}

// Admin CRUD
export async function getAllBundles() {
  const { data, error } = await supabase.from('data_bundles').select('*').order('network').order('data_size_mb')
  if (error) throw error
  return data
}

export async function createBundle(payload) {
  const { data, error } = await supabase.from('data_bundles').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateBundle(id, payload) {
  const { data, error } = await supabase.from('data_bundles').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function toggleBundle(id, isActive) {
  const { error } = await supabase.from('data_bundles').update({ is_active: isActive }).eq('id', id)
  if (error) throw error
}
