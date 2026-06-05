import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, json } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  return json({ success: true, message: 'Webhook received. Verification is handled by topup-verify.' })
})
