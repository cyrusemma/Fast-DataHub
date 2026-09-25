// In-memory mock database for DataHUB, persisted to localStorage so it survives
// page reloads. Mirrors the Supabase schema in DATAHUB_BUILD_1.md.
// Money is always integer pesewas (GHS * 100).

const DB_KEY = 'datahub-mock-db-v3'

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
  // [network, name, mb, days, cost_price, selling_price, agent_price, reseller_price]
  ['MTN', 'MTN 1GB Bundle', 1024, 0, 375, 410, 390, 400],
  ['MTN', 'MTN 2GB Bundle', 2048, 0, 780, 850, 810, 830],
  ['MTN', 'MTN 3GB Bundle', 3072, 0, 1150, 1250, 1190, 1220],
  ['MTN', 'MTN 4GB Bundle', 4096, 0, 1540, 1680, 1600, 1640],
  ['MTN', 'MTN 5GB Bundle', 5120, 0, 1880, 2050, 1950, 2000],
  ['MTN', 'MTN 6GB Bundle', 6144, 0, 2200, 2400, 2290, 2350],
  ['MTN', 'MTN 8GB Bundle', 8192, 0, 2940, 3200, 3050, 3130],
  ['MTN', 'MTN 10GB Bundle', 10240, 0, 3720, 4050, 3860, 3960],
  ['MTN', 'MTN 15GB Bundle', 15360, 0, 5480, 5950, 5680, 5820],
  ['MTN', 'MTN 20GB Bundle', 20480, 0, 7320, 7950, 7590, 7780],
  ['MTN', 'MTN 25GB Bundle', 25600, 0, 8850, 9600, 9170, 9400],
  ['MTN', 'MTN 30GB Bundle', 30720, 0, 10880, 11800, 11270, 11550],
  ['MTN', 'MTN 40GB Bundle', 40960, 0, 14580, 15800, 15100, 15480],
  ['MTN', 'MTN 50GB Bundle', 51200, 0, 18180, 19700, 18830, 19300],
  ['TELECEL', 'Telecel 10GB Rollover', 10240, 60, 3550, 3850, 3680, 3770],
  ['TELECEL', 'Telecel 15GB Rollover', 15360, 60, 5050, 5485, 5250, 5370],
  ['TELECEL', 'Telecel 20GB Rollover', 20480, 60, 6800, 7380, 7060, 7220],
  ['TELECEL', 'Telecel 25GB Rollover', 25600, 60, 8360, 9075, 8690, 8880],
  ['TELECEL', 'Telecel 30GB Rollover', 30720, 60, 9920, 10770, 10310, 10540],
  ['TELECEL', 'Telecel 35GB Rollover', 35840, 60, 12040, 13065, 12510, 12790],
  ['TELECEL', 'Telecel 40GB Rollover', 40960, 60, 13140, 14260, 13660, 13960],
  ['TELECEL', 'Telecel 45GB Rollover', 46080, 60, 14240, 15455, 14800, 15130],
  ['TELECEL', 'Telecel 50GB Rollover', 51200, 60, 16360, 17750, 17000, 17380],
  ['TELECEL', 'Telecel 100GB Rollover', 102400, 60, 36500, 39700, 38000, 38900],
  ['AT', 'AT 1GB Non-Expiry', 1024, 0, 380, 430, 400, 415],
  ['AT', 'AT 2GB Non-Expiry', 2048, 0, 760, 860, 800, 830],
  ['AT', 'AT 5GB Non-Expiry', 5120, 0, 1900, 2150, 2000, 2070],
  ['AT', 'AT 10GB Non-Expiry', 10240, 0, 3700, 4200, 3900, 4050],
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
