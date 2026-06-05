export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  NETWORK_ADMIN: 'NETWORK_ADMIN',
  AGENT: 'AGENT',
  RESELLER: 'RESELLER',
  CUSTOMER: 'CUSTOMER',
  AUDITOR: 'AUDITOR',
}

export const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  NETWORK_ADMIN: 'Network Admin',
  AGENT: 'Agent',
  RESELLER: 'Reseller',
  CUSTOMER: 'Customer',
  AUDITOR: 'Auditor',
}

export const NETWORKS = {
  MTN: { id: 'MTN', label: 'MTN', color: '#FFCC00', text: '#0A0F1E' },
  TELECEL: { id: 'TELECEL', label: 'Telecel', color: '#E40000', text: '#FFFFFF' },
  AT: { id: 'AT', label: 'AirtelTigo', color: '#003087', text: '#FFFFFF' },
}

export const NETWORK_LIST = Object.values(NETWORKS)

export const TRANSACTION_TYPES = ['TOPUP', 'DATA_PURCHASE', 'COMMISSION', 'WITHDRAWAL', 'REFUND']
export const TRANSACTION_STATUSES = ['PENDING', 'SUCCESS', 'FAILED', 'REVERSED']

export const STATUS_VARIANT = {
  SUCCESS: 'success',
  PENDING: 'warning',
  FAILED: 'danger',
  REVERSED: 'neutral',
  ACTIVE: 'success',
  SUSPENDED: 'danger',
}

// Credit types render green, debits render red (UI rule #12).
export const CREDIT_TYPES = ['TOPUP', 'COMMISSION', 'REFUND']
export const DEBIT_TYPES = ['DATA_PURCHASE', 'WITHDRAWAL']

export const TOPUP_PRESETS = [1000, 2000, 5000, 10000, 20000, 50000] // pesewas
