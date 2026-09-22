import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { userId } = await req.json()
    if (!userId) throw new Error('Missing userId')

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    // Count failed data purchases in the last 1 hour
    const { count, error: countErr } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('type', 'DATA_PURCHASE')
      .eq('status', 'FAILED')
      .gte('created_at', oneHourAgo)

    if (countErr) throw countErr

    if ((count || 0) >= 5) {
      // Auto-suspend user account
      await supabase.from('profiles').update({ status: 'SUSPENDED' }).eq('id', userId)

      // Record in audit log
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'AUTO_SUSPEND',
        resource: 'USER',
        metadata: {
          reason: 'fraud_threshold_exceeded',
          failed_count: count,
          window_hours: 1,
        },
      })

      return json({ suspended: true, failedCount: count, message: 'Account automatically suspended due to excessive failed attempts.' })
    }

    return json({ suspended: false, failedCount: count || 0 })
  } catch (error) {
    return json({ success: false, message: error.message }, 400)
  }
})
