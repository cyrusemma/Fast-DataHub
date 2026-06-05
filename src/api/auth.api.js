import { supabase } from './supabase'

export async function register({ email, password, firstName, lastName, phone, role, inviteCode }) {
  if (['AGENT', 'RESELLER'].includes(role)) {
    const { data: inviter } = await supabase.from('profiles').select('id,role').eq('invite_code', inviteCode).maybeSingle()
    if (!inviter) throw new Error('Invalid invite code')
    if (role === 'RESELLER' && inviter.role !== 'AGENT') throw new Error('Invite code is not from an agent')
  }

  const { data: authData, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error

  const profilePayload = { id: authData.user.id, email, phone, first_name: firstName, last_name: lastName, role }

  if (role === 'RESELLER') {
    const { data: agent } = await supabase.from('profiles').select('id').eq('invite_code', inviteCode).single()
    profilePayload.agent_id = agent.id
  }

  const { error: profileErr } = await supabase.from('profiles').insert(profilePayload)
  if (profileErr) throw profileErr
  return authData
}

export async function login({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
  if (profile?.status === 'SUSPENDED') {
    await supabase.auth.signOut()
    throw new Error('Account suspended. Contact support.')
  }
  return { session: data.session, profile }
}

export async function logout() {
  await supabase.auth.signOut()
}

export async function forgotPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw error
}

export async function getCurrentProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  return data
}
