import { supabase } from './supabase'
import { pricingEngine } from '../services/pricingEngine'

const PRICE_FIELD = {
  CUSTOMER: 'selling_price',
  RESELLER: 'reseller_price',
  AGENT: 'agent_price',
  SUPER_ADMIN: 'cost_price',
  NETWORK_ADMIN: 'cost_price',
}

export async function getBundles({ network, role, userId } = {}) {
  let query = supabase.from('data_bundles').select('*').eq('is_active', true).order('data_size_mb')
  if (network) query = query.eq('network', network)
  const { data, error } = await query
  if (error) throw error
  const priceField = PRICE_FIELD[role] || 'selling_price'

  // Apply custom overrides if user is reseller or agent
  let customOverrides = {}
  if (role === 'RESELLER') {
    customOverrides = pricingEngine.getResellerCustomPrices(userId || 'reseller-default')
  } else if (role === 'AGENT') {
    customOverrides = pricingEngine.getAgentCustomPrices(userId || 'agent-default')
  }

  return (data || [])
    .filter((b) => customOverrides[b.id]?.enabled !== false)
    .map((b) => {
      let customPrice = customOverrides[b.id]?.selling_price
      let price = (role === 'RESELLER' && customPrice) ? customPrice : b[priceField]
      return { ...b, price }
    })
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
