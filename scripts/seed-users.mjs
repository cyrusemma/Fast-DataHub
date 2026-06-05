import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running seed:users.')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

const users = [
  ['admin@datahub.gh', 'Admin1234!', 'Ama', 'Mensah', '0241000001', 'SUPER_ADMIN', null],
  ['netadmin@datahub.gh', 'Admin1234!', 'Kofi', 'Boateng', '0241000002', 'NETWORK_ADMIN', null],
  ['auditor@datahub.gh', 'Auditor1234!', 'Esi', 'Owusu', '0241000003', 'AUDITOR', null],
  ['agent1@datahub.gh', 'Agent1234!', 'Yaw', 'Asante', '0242000001', 'AGENT', 'AGT-01-DEMO'],
  ['agent2@datahub.gh', 'Agent1234!', 'Akua', 'Darko', '0242000002', 'AGENT', 'AGT-02-DEMO'],
  ['agent3@datahub.gh', 'Agent1234!', 'Kwesi', 'Appiah', '0242000003', 'AGENT', 'AGT-03-DEMO'],
]

for (let i = 1; i <= 9; i++) {
  users.push([`reseller${i}@datahub.gh`, 'Reseller1234!', `Reseller`, `${i}`, `02530000${String(i).padStart(2, '0')}`, 'RESELLER', null])
}

for (let i = 1; i <= 15; i++) {
  users.push([`customer${i}@datahub.gh`, 'Customer1234!', `Customer`, `${i}`, `05590000${String(i).padStart(2, '0')}`, 'CUSTOMER', null])
}

const agentIds = []

for (const [email, password, firstName, lastName, phone, role, inviteCode] of users) {
  const { data: existing } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle()
  if (existing) {
    if (role === 'AGENT') agentIds.push(existing.id)
    console.log(`skip ${email}`)
    continue
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw error

  let agent_id = null
  if (role === 'RESELLER') agent_id = agentIds[Math.floor((Number(lastName) - 1) / 3)] || null

  const { error: profileError } = await supabase.from('profiles').insert({
    id: data.user.id,
    email,
    phone,
    first_name: firstName,
    last_name: lastName,
    role,
    agent_id,
    invite_code: inviteCode,
    kyc_verified: role !== 'CUSTOMER',
  })
  if (profileError) throw profileError
  if (role === 'AGENT') agentIds.push(data.user.id)
  console.log(`created ${email}`)
}

await supabase.from('wallets').update({ balance: 50000 }).in('user_id', agentIds)
await supabase.rpc('credit_wallet', { p_user_id: agentIds[0], p_amount: 0 }).catch(() => {})
console.log('Seed users complete. Run the wallet top-up SQL from DATAHUB_BUILD_1.md for reseller/customer demo balances if needed.')
