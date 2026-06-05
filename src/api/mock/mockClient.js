// A focused mock of the supabase-js client surface used by DataHUB.
// Supports the chainable query builder, auth, rpc, and realtime channels so the
// real api/*.js modules work unchanged against in-memory data.

import { getDB, saveDB, uuid } from './mockData'

const SESSION_KEY = 'datahub-mock-session'
const delay = (ms = 220) => new Promise((r) => setTimeout(r, ms + Math.random() * 180))

/* ----------------------------- realtime bus ----------------------------- */
const walletSubs = [] // { id, userId, cb }
function emitWalletChange(userId) {
  const db = getDB()
  const wallet = db.wallets.find((w) => w.user_id === userId)
  if (!wallet) return
  walletSubs
    .filter((s) => s.userId === userId)
    .forEach((s) => s.cb({ new: { ...wallet }, old: { ...wallet }, eventType: 'UPDATE' }))
}

/* ------------------------------ auth bus -------------------------------- */
const authListeners = []
function fireAuth(event, session) {
  authListeners.forEach((cb) => cb(event, session))
}
function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
  } catch {
    return null
  }
}
function storeSession(session) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  else localStorage.removeItem(SESSION_KEY)
}

/* --------------------------- query builder ------------------------------ */
class QueryBuilder {
  constructor(table) {
    this.table = table
    this.filters = []
    this._order = null
    this._range = null
    this._select = '*'
    this._count = null
    this._head = false
    this._op = 'select'
    this._payload = null
    this._onConflict = null
    this._single = false
    this._maybe = false
  }

  select(cols = '*', opts = {}) {
    this._select = cols
    if (opts.count) this._count = opts.count
    if (opts.head) this._head = true
    if (this._op !== 'select' && this._op !== '_done') this._returnSelect = true
    return this
  }
  insert(payload) { this._op = 'insert'; this._payload = payload; return this }
  update(payload) { this._op = 'update'; this._payload = payload; return this }
  upsert(payload, opts = {}) { this._op = 'upsert'; this._payload = payload; this._onConflict = opts.onConflict; return this }
  delete() { this._op = 'delete'; return this }

  eq(col, val) { this.filters.push((r) => r[col] === val); return this }
  neq(col, val) { this.filters.push((r) => r[col] !== val); return this }
  in(col, arr) { this.filters.push((r) => arr.includes(r[col])); return this }
  gte(col, val) { this.filters.push((r) => new Date(r[col]) >= new Date(val) || r[col] >= val); return this }
  lte(col, val) { this.filters.push((r) => new Date(r[col]) <= new Date(val) || r[col] <= val); return this }
  gt(col, val) { this.filters.push((r) => r[col] > val); return this }
  lt(col, val) { this.filters.push((r) => r[col] < val); return this }
  order(col, opts = {}) { this._order = { col, ascending: opts.ascending !== false }; return this }
  range(from, to) { this._range = [from, to]; return this }
  limit(n) { this._range = [0, n - 1]; return this }
  single() { this._single = true; return this }
  maybeSingle() { this._maybe = true; return this }

  _match(rows) {
    return rows.filter((r) => this.filters.every((f) => f(r)))
  }

  _attachRelations(row) {
    const db = getDB()
    const sel = this._select
    const out = { ...row }
    if (this.table === 'transactions') {
      if (sel.includes('data_bundles')) {
        out.data_bundles = db.data_bundles.find((b) => b.id === row.bundle_id) || null
      }
      if (sel.includes('profiles')) {
        out.profiles = db.profiles.find((p) => p.id === row.user_id) || null
      }
    }
    if (this.table === 'profiles' && sel.includes('wallets')) {
      out.wallets = db.wallets.find((w) => w.user_id === row.id) || null
    }
    if (this.table === 'commissions' && sel.includes('transactions')) {
      out.transactions = db.transactions.find((t) => t.id === row.transaction_id) || null
    }
    return out
  }

  async _run() {
    await delay()
    const db = getDB()
    const table = db[this.table]
    if (!table) return { data: null, error: { message: `Unknown table ${this.table}` } }

    if (this._op === 'insert' || this._op === 'upsert') {
      const items = Array.isArray(this._payload) ? this._payload : [this._payload]
      const inserted = []
      for (const item of items) {
        if (this._op === 'upsert' && this._onConflict) {
          const existing = table.find((r) => r[this._onConflict] === item[this._onConflict])
          if (existing) {
            Object.assign(existing, item, { updated_at: new Date().toISOString() })
            inserted.push(existing)
            continue
          }
        }
        const row = {
          id: item.id || uuid(),
          created_at: new Date().toISOString(),
          ...item,
        }
        table.unshift(row)
        inserted.push(row)
        // emulate AFTER INSERT trigger: auto-create wallet for a new profile
        if (this.table === 'profiles' && !db.wallets.some((w) => w.user_id === row.id)) {
          db.wallets.push({ id: uuid(), user_id: row.id, balance: 0, locked_balance: 0, currency: 'GHS', last_updated: new Date().toISOString() })
        }
      }
      saveDB()
      const data = this._single ? inserted[0] : this._maybe ? inserted[0] ?? null : inserted
      return { data, error: null }
    }

    if (this._op === 'update') {
      const matched = this._match(table)
      matched.forEach((r) => Object.assign(r, this._payload, { updated_at: new Date().toISOString() }))
      saveDB()
      const data = this._single ? matched[0] : matched
      return { data: data ?? null, error: null }
    }

    if (this._op === 'delete') {
      const keep = []
      const removed = []
      table.forEach((r) => (this.filters.every((f) => f(r)) ? removed.push(r) : keep.push(r)))
      db[this.table] = keep
      saveDB()
      return { data: removed, error: null }
    }

    // select
    let rows = this._match(table)
    const count = rows.length
    if (this._order) {
      const { col, ascending } = this._order
      rows = [...rows].sort((a, b) => {
        const av = a[col], bv = b[col]
        const cmp = av < bv ? -1 : av > bv ? 1 : 0
        return ascending ? cmp : -cmp
      })
    }
    if (this._range) rows = rows.slice(this._range[0], this._range[1] + 1)
    if (this._head) return { data: null, count, error: null }
    rows = rows.map((r) => this._attachRelations(r))

    if (this._single) {
      if (rows.length === 0) return { data: null, error: { message: 'No rows found', code: 'PGRST116' } }
      return { data: rows[0], count, error: null }
    }
    if (this._maybe) return { data: rows[0] ?? null, count, error: null }
    return { data: rows, count, error: null }
  }

  then(resolve, reject) {
    return this._run().then(resolve, reject)
  }
}

/* ------------------------------- rpc ------------------------------------ */
async function rpc(fn, params = {}) {
  await delay()
  const db = getDB()
  switch (fn) {
    case 'deduct_wallet': {
      const w = db.wallets.find((x) => x.user_id === params.p_user_id)
      if (!w) return { data: null, error: { message: 'Wallet not found' } }
      if (w.balance < params.p_amount)
        return { data: null, error: { message: `Insufficient balance. Have ${w.balance}, need ${params.p_amount}` } }
      w.balance -= params.p_amount
      w.last_updated = new Date().toISOString()
      saveDB()
      emitWalletChange(params.p_user_id)
      return { data: null, error: null }
    }
    case 'credit_wallet': {
      const w = db.wallets.find((x) => x.user_id === params.p_user_id)
      if (!w) return { data: null, error: { message: 'Wallet not found' } }
      w.balance += params.p_amount
      w.last_updated = new Date().toISOString()
      saveDB()
      emitWalletChange(params.p_user_id)
      return { data: null, error: null }
    }
    case 'get_admin_dashboard_stats': {
      const tx = db.transactions
      const today = new Date().toDateString()
      const isToday = (t) => new Date(t.created_at).toDateString() === today
      const purchases = tx.filter((t) => t.type === 'DATA_PURCHASE' && t.status === 'SUCCESS')
      const successFail = tx.filter((t) => t.status === 'SUCCESS' || t.status === 'FAILED')
      const success = tx.filter((t) => t.status === 'SUCCESS')
      return {
        data: {
          total_revenue: purchases.reduce((s, t) => s + t.amount, 0),
          today_revenue: purchases.filter(isToday).reduce((s, t) => s + t.amount, 0),
          total_transactions: tx.filter((t) => t.status !== 'PENDING').length,
          today_transactions: tx.filter(isToday).length,
          failed_transactions: tx.filter((t) => t.status === 'FAILED').length,
          success_rate: successFail.length ? Math.round((success.length / successFail.length) * 1000) / 10 : 0,
        },
        error: null,
      }
    }
    case 'get_revenue_chart': {
      const days = params.p_days || 30
      const out = []
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000)
        const key = d.toISOString().slice(0, 10)
        const dayTx = db.transactions.filter(
          (t) => t.type === 'DATA_PURCHASE' && t.status === 'SUCCESS' && t.created_at.slice(0, 10) === key
        )
        out.push({ date: key, revenue: dayTx.reduce((s, t) => s + t.amount, 0), tx_count: dayTx.length })
      }
      return { data: out, error: null }
    }
    default:
      return { data: null, error: { message: `Unknown rpc ${fn}` } }
  }
}

/* ------------------------------- auth ----------------------------------- */
const auth = {
  async signUp({ email, password }) {
    await delay()
    const db = getDB()
    const key = email.toLowerCase()
    if (db.credentials[key]) return { data: { user: null, session: null }, error: { message: 'User already registered' } }
    const id = uuid()
    db.credentials[key] = password
    const user = { id, email }
    const session = { access_token: `mock-${id}`, user }
    db.session = session
    saveDB()
    storeSession(session)
    setTimeout(() => fireAuth('SIGNED_IN', session), 0)
    return { data: { user, session }, error: null }
  },

  async signInWithPassword({ email, password }) {
    await delay()
    const db = getDB()
    const key = email.toLowerCase()
    if (!db.credentials[key] || db.credentials[key] !== password)
      return { data: { user: null, session: null }, error: { message: 'Invalid login credentials' } }
    const profile = db.profiles.find((p) => p.email.toLowerCase() === key)
    if (!profile) return { data: { user: null, session: null }, error: { message: 'Profile not found' } }
    const user = { id: profile.id, email: profile.email }
    const session = { access_token: `mock-${profile.id}`, user }
    db.session = session
    saveDB()
    storeSession(session)
    setTimeout(() => fireAuth('SIGNED_IN', session), 0)
    return { data: { user, session }, error: null }
  },

  async signOut() {
    await delay(120)
    const db = getDB()
    db.session = null
    saveDB()
    storeSession(null)
    setTimeout(() => fireAuth('SIGNED_OUT', null), 0)
    return { error: null }
  },

  async getSession() {
    const session = loadSession()
    return { data: { session }, error: null }
  },

  async getUser() {
    const session = loadSession()
    return { data: { user: session?.user ?? null }, error: null }
  },

  async resetPasswordForEmail() {
    await delay()
    return { data: {}, error: null }
  },

  onAuthStateChange(cb) {
    authListeners.push(cb)
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const i = authListeners.indexOf(cb)
            if (i > -1) authListeners.splice(i, 1)
          },
        },
      },
    }
  },
}

/* ---------------------------- channels ---------------------------------- */
function channel(name) {
  const chan = {
    _name: name,
    _id: uuid(),
    on(_event, opts, cb) {
      const filter = opts?.filter || ''
      const m = /user_id=eq\.(.+)/.exec(filter)
      if (m) walletSubs.push({ id: this._id, userId: m[1], cb })
      return this
    },
    subscribe(cb) {
      if (cb) cb('SUBSCRIBED')
      return this
    },
  }
  return chan
}

function removeChannel(chan) {
  if (!chan?._id) return
  for (let i = walletSubs.length - 1; i >= 0; i--) {
    if (walletSubs[i].id === chan._id) walletSubs.splice(i, 1)
  }
}

export const mockSupabase = {
  __isMock: true,
  from: (table) => new QueryBuilder(table),
  rpc,
  auth,
  channel,
  removeChannel,
}
