import { supabase, IS_MOCK } from './supabase'
import { getDB, saveDB } from './mock/mockData'

const DEFAULT_THEME = {
  mode: 'light',
  palette: 'default',
  primaryColor: null,
  accentColor: null,
}

export async function getPlatformTheme() {
  if (IS_MOCK) {
    const db = getDB()
    return db.platform_settings?.theme || DEFAULT_THEME
  }

  const { data, error } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'theme')
    .maybeSingle()

  if (error) {
    console.warn('Could not fetch platform theme:', error.message)
    return DEFAULT_THEME
  }
  return data?.value || DEFAULT_THEME
}

export async function setPlatformTheme(themeObj) {
  if (IS_MOCK) {
    const db = getDB()
    if (!db.platform_settings) db.platform_settings = {}
    db.platform_settings.theme = themeObj
    saveDB()
    return themeObj
  }

  const { data, error } = await supabase
    .from('platform_settings')
    .upsert({ key: 'theme', value: themeObj, updated_at: new Date().toISOString() })
    .select()
    .single()

  if (error) throw error
  return data?.value || themeObj
}

export async function getAgentTheme(agentId) {
  if (!agentId) return null

  if (IS_MOCK) {
    const db = getDB()
    const agent = db.profiles.find((p) => p.id === agentId)
    return agent?.agent_theme || null
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('agent_theme')
    .eq('id', agentId)
    .maybeSingle()

  if (error) {
    console.warn('Could not fetch agent theme:', error.message)
    return null
  }
  return data?.agent_theme || null
}

export async function setAgentTheme(themeObj) {
  if (IS_MOCK) {
    const db = getDB()
    const currentUserId = db.session?.user?.id
    if (!currentUserId) throw new Error('Unauthorized')
    const agent = db.profiles.find((p) => p.id === currentUserId)
    if (agent) {
      agent.agent_theme = themeObj
      saveDB()
    }
    return themeObj
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('profiles')
    .update({ agent_theme: themeObj })
    .eq('id', user.id)

  if (error) throw error
  return themeObj
}
