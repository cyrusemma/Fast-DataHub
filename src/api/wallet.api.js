import { supabase, IS_MOCK } from './supabase'
import { mockTopup } from './mock/mockEdge'

export async function getWalletBalance() {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('wallets')
    .select('balance,currency,last_updated')
    .eq('user_id', user.id)
    .single()
  if (error) throw error
  return data
}

export async function verifyTopup(reference) {
  if (IS_MOCK) return mockTopup({ reference })
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/topup-verify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ reference }),
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.message)
  return data.data
}

function loadPaystackCheckout() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Paystack checkout is only available in the browser'))
  }

  if (window.PaystackPop) return Promise.resolve(window.PaystackPop)

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-paystack-inline]')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.PaystackPop), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Paystack checkout')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    script.dataset.paystackInline = 'true'
    script.onload = () => resolve(window.PaystackPop)
    script.onerror = () => reject(new Error('Failed to load Paystack checkout'))
    document.body.appendChild(script)
  })
}

export async function startTopupCheckout({ amount, email, reference, metadata = {} }) {
  if (IS_MOCK) return mockTopup({ amount, reference })

  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY
  if (!publicKey) throw new Error('Missing Paystack public key')

  const PaystackPop = await loadPaystackCheckout()

  return new Promise((resolve, reject) => {
    const checkout = PaystackPop.setup({
      key: publicKey,
      email,
      amount,
      ref: reference,
      currency: 'GHS',
      metadata,
      callback: async (response) => {
        try {
          const verified = await verifyTopup(response.reference || reference)
          resolve(verified)
        } catch (error) {
          reject(error)
        }
      },
      onClose: () => reject(new Error('Top-up cancelled')),
    })

    checkout.openIframe()
  })
}

// Mock-mode top-up: simulates a successful Paystack charge of `amount` pesewas.
export async function mockTopUp(amount) {
  return mockTopup({ amount })
}
