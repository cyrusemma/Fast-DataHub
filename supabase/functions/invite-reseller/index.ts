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
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!profile || !['AGENT', 'SUPER_ADMIN'].includes(profile.role)) throw new Error('Only agents can invite resellers')
    const inviteCode = profile.invite_code || `AGT-${user.id.slice(0, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    if (!profile.invite_code) await supabase.from('profiles').update({ invite_code: inviteCode }).eq('id', user.id)
    return json({ success: true, inviteCode, inviteUrl: `${Deno.env.get('SITE_URL') || ''}/register?invite=${inviteCode}` })
  } catch (error) {
    return json({ success: false, error: error.message }, 400)
  }
})
