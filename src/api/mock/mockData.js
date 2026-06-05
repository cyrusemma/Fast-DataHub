// In-memory mock database for DataHUB, persisted to localStorage so it survives
// page reloads. Mirrors the Supabase schema in DATAHUB_BUILD_1.md.
// Money is always integer pesewas (GHS * 100).

const DB_KEY = 'datahub-mock-db-v1'

const uuid = () =>
  (crypto.randomUUID && crypto.randomUUID()) ||
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString()
const hoursAgo = (n) => new Date(Date.now() - n * 3600000).toISOString()
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

const BUNDLE_SEED = [
  ['MTN', 'MTN 100MB Daily', 100, 1, 100, 150, 120, 130],
  ['MTN', 'MTN 1GB Weekly', 1024, 7, 500, 700, 550, 600],
  ['MTN', 'MTN 3GB Monthly', 3072, 30, 1200, 1600, 1300, 1400],
  ['MTN', 'MTN 10GB Monthly', 10240, 30, 3500, 4500, 3800, 4000],
  ['TELECEL', 'Telecel 200MB Daily', 200, 1, 120, 180, 140, 155],
  ['TELECEL', 'Telecel 1.5GB Weekly', 1536, 7, 600, 800, 650, 700],
  ['TELECEL', 'Telecel 4GB Monthly', 4096, 30, 1400, 1900, 1550, 1650],
  ['TELECEL', 'Telecel 12GB Monthly', 12288, 30, 4000, 5000, 4200, 4500],
  ['AT', 'AT 150MB Daily', 150, 1, 110, 160, 130, 140],
  ['AT', 'AT 1GB Weekly', 1024, 7, 520, 720, 570, 620],
  ['AT', 'AT 3.5GB Monthly', 3584, 30, 1300, 1750, 1400, 1500],
  ['AT', 'AT 8GB Monthly', 8192, 30, 2800, 3600, 3000, 3200],
]

function buildSeed() {
  const profiles = []
  const wallets = []
  const credentials = {} // email -> password
  const transactions = []
  const commissions = []
  const audit_logs = []

  const data_bundles = BUNDLE_SEED.map(
    ([network, name, mb, days, cost, selling, agent, reseller]) => ({
      id: uuid(),
      network,
      name,
      data_size_mb: mb,
      validity_days: days,
      cost_price: cost,
      selling_price: selling,
      agent_price: agent,
      reseller_price: reseller,
      is_active: true,
      created_at: daysAgo(60),
    })
  )

  const addUser = ({ email, password, firstName, lastName, phone, role, balance, agentId = null, inviteCode = null }) => {
    const id = uuid()
    profiles.push({
      id,
      email,
      phone,
      first_name: firstName,
      last_name: lastName,
      role,
      status: 'ACTIVE',
      agent_id: agentId,
      kyc_verified: role !== 'CUSTOMER',
      invite_code: inviteCode,
      created_at: daysAgo(rand(20, 90)),
      updated_at: daysAgo(rand(0, 10)),
    })
    wallets.push({
      id: uuid(),
      user_id: id,
      balance,
      locked_balance: 0,
      currency: 'GHS',
      last_updated: daysAgo(rand(0, 5)),
    })
    credentials[email.toLowerCase()] = password
    return id
  }

  // Admins
  addUser({ email: 'admin@datahub.gh', password: 'Admin1234!', firstName: 'Ama', lastName: 'Mensah', phone: '0241000001', role: 'SUPER_ADMIN', balance: 0 })
  addUser({ email: 'netadmin@datahub.gh', password: 'Admin1234!', firstName: 'Kofi', lastName: 'Boateng', phone: '0241000002', role: 'NETWORK_ADMIN', balance: 0 })
  addUser({ email: 'auditor@datahub.gh', password: 'Auditor1234!', firstName: 'Esi', lastName: 'Owusu', phone: '0241000003', role: 'AUDITOR', balance: 0 })

  // Agents (3) with invite codes
  const agentNames = [['Yaw', 'Asante'], ['Akua', 'Darko'], ['Kwesi', 'Appiah']]
  const agentIds = []
  for (let i = 0; i < 3; i++) {
    const id = addUser({
      email: `agent${i + 1}@datahub.gh`,
      password: 'Agent1234!',
      firstName: agentNames[i][0],
      lastName: agentNames[i][1],
      phone: `024200000${i + 1}`,
      role: 'AGENT',
      balance: 50000,
      inviteCode: `AGT-${(i + 1).toString().padStart(2, '0')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    })
    agentIds.push(id)
  }

  // Resellers (9 — 3 per agent)
  const resellerIds = []
  let rIndex = 1
  for (let a = 0; a < 3; a++) {
    for (let j = 0; j < 3; j++) {
      const id = addUser({
        email: `reseller${rIndex}@datahub.gh`,
        password: 'Reseller1234!',
        firstName: pick(['Abena', 'Kojo', 'Adwoa', 'Kwabena', 'Afia', 'Yaw']),
        lastName: pick(['Osei', 'Mensah', 'Addo', 'Tetteh', 'Quaye']),
        phone: `02530000${rIndex.toString().padStart(2, '0')}`,
        role: 'RESELLER',
        balance: 10000,
        agentId: agentIds[a],
      })
      resellerIds.push({ id, agentId: agentIds[a] })
      rIndex++
    }
  }

  // Customers (15)
  const customerIds = []
  for (let i = 1; i <= 15; i++) {
    const id = addUser({
      email: `customer${i}@datahub.gh`,
      password: 'Customer1234!',
      firstName: pick(['Nana', 'Efua', 'Kwame', 'Akosua', 'Fiifi', 'Maame', 'Kojo', 'Adjoa']),
      lastName: pick(['Annan', 'Bekoe', 'Dadzie', 'Frimpong', 'Gyasi', 'Hayford']),
      phone: `05590000${i.toString().padStart(2, '0')}`,
      role: 'CUSTOMER',
      balance: rand(2000, 5000),
      agentId: null,
    })
    customerIds.push(id)
  }

  const walletOf = (userId) => wallets.find((w) => w.user_id === userId)
  const ref = () => `DH-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`

  // Generate realistic historical transactions across the last 30 days.
  const buyers = [
    ...customerIds.map((id) => ({ id, role: 'CUSTOMER', priceField: 'selling_price' })),
    ...resellerIds.map((r) => ({ id: r.id, role: 'RESELLER', agentId: r.agentId, priceField: 'reseller_price' })),
  ]

  for (let i = 0; i < 320; i++) {
    const buyer = pick(buyers)
    const bundle = pick(data_bundles)
    const price = bundle[buyer.priceField]
    const created = daysAgo(rand(0, 29))
    const outcome = Math.random()
    const status = outcome > 0.92 ? 'FAILED' : outcome > 0.88 ? 'PENDING' : 'SUCCESS'
    const wallet = walletOf(buyer.id)
    const balanceBefore = wallet.balance
    const balanceAfter = status === 'SUCCESS' ? Math.max(0, balanceBefore - price) : balanceBefore
    const txId = uuid()
    transactions.push({
      id: txId,
      user_id: buyer.id,
      type: 'DATA_PURCHASE',
      amount: price,
      fee: 0,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      status,
      reference: ref(),
      idempotency_key: uuid(),
      network: bundle.network,
      recipient_phone: `0${pick(['24', '55', '20', '27'])}${rand(1000000, 9999999)}`,
      bundle_id: bundle.id,
      metadata: { bundle_name: bundle.name, data_size_mb: bundle.data_size_mb },
      created_at: created,
      updated_at: created,
    })

    // Reseller success → agent commission
    if (status === 'SUCCESS' && buyer.role === 'RESELLER' && buyer.agentId) {
      const amount = bundle.reseller_price - bundle.agent_price
      if (amount > 0) {
        commissions.push({
          id: uuid(),
          user_id: buyer.agentId,
          transaction_id: txId,
          amount,
          type: 'AGENT',
          status: Math.random() > 0.3 ? 'PAID' : 'PENDING',
          paid_at: Math.random() > 0.3 ? created : null,
          created_at: created,
        })
      }
    }
  }

  // Some top-ups for customers
  for (let i = 0; i < 60; i++) {
    const userId = pick(customerIds)
    const amount = pick([1000, 2000, 5000, 10000])
    const created = daysAgo(rand(0, 29))
    transactions.push({
      id: uuid(),
      user_id: userId,
      type: 'TOPUP',
      amount,
      fee: 0,
      balance_before: 0,
      balance_after: amount,
      status: 'SUCCESS',
      reference: ref(),
      idempotency_key: uuid(),
      network: null,
      recipient_phone: null,
      bundle_id: null,
      metadata: { channel: pick(['card', 'mobile_money']) },
      created_at: created,
      updated_at: created,
    })
  }

  // A couple of audit entries
  audit_logs.push(
    { id: uuid(), user_id: agentIds[0], action: 'DATA_PURCHASE_SUCCESS', resource: 'transaction', metadata: {}, ip_address: '102.176.0.1', created_at: hoursAgo(2) },
    { id: uuid(), user_id: profiles[0].id, action: 'USER_SUSPENDED', resource: 'profile', metadata: {}, ip_address: '102.176.0.2', created_at: hoursAgo(20) }
  )

  transactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return { profiles, wallets, data_bundles, transactions, commissions, audit_logs, credentials, session: null }
}

let _db = null

export function getDB() {
  if (_db) return _db
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) {
      _db = JSON.parse(raw)
      return _db
    }
  } catch {
    /* ignore */
  }
  _db = buildSeed()
  saveDB()
  return _db
}

export function saveDB() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(_db))
  } catch {
    /* ignore quota */
  }
}

export function resetDB() {
  localStorage.removeItem(DB_KEY)
  _db = buildSeed()
  saveDB()
  return _db
}

export { uuid }
