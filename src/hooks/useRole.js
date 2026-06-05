import { useAuthStore } from '../store/authStore'

const navItems = {
  SUPER_ADMIN: [
    { label: 'Dashboard', icon: 'LayoutDashboard', path: '/admin' },
    { label: 'Users', icon: 'Users', path: '/admin/users' },
    { label: 'Transactions', icon: 'ArrowLeftRight', path: '/admin/transactions' },
    { label: 'Agents', icon: 'UserCheck', path: '/admin/agents' },
    { label: 'Bundles', icon: 'Package', path: '/admin/bundles' },
    { label: 'Finance', icon: 'DollarSign', path: '/admin/finance' },
    { label: 'Audit Logs', icon: 'ScrollText', path: '/admin/audit-logs' },
  ],
  NETWORK_ADMIN: [
    { label: 'Dashboard', icon: 'LayoutDashboard', path: '/admin' },
    { label: 'Transactions', icon: 'ArrowLeftRight', path: '/admin/transactions' },
    { label: 'Agents', icon: 'UserCheck', path: '/admin/agents' },
    { label: 'Bundles', icon: 'Package', path: '/admin/bundles' },
  ],
  AUDITOR: [
    { label: 'Audit Logs', icon: 'ScrollText', path: '/admin/audit-logs' },
    { label: 'Transactions', icon: 'ArrowLeftRight', path: '/admin/transactions' },
  ],
  AGENT: [
    { label: 'Dashboard', icon: 'LayoutDashboard', path: '/agent' },
    { label: 'Buy Bulk', icon: 'ShoppingCart', path: '/agent/buy-bulk' },
    { label: 'My Resellers', icon: 'Users', path: '/agent/resellers' },
    { label: 'Commissions', icon: 'Banknote', path: '/agent/commissions' },
    { label: 'Wallet', icon: 'Wallet', path: '/agent/wallet' },
  ],
  RESELLER: [
    { label: 'Dashboard', icon: 'LayoutDashboard', path: '/reseller' },
    { label: 'Sell Data', icon: 'Wifi', path: '/reseller/sell' },
    { label: 'Earnings', icon: 'TrendingUp', path: '/reseller/earnings' },
    { label: 'Wallet', icon: 'Wallet', path: '/reseller/wallet' },
  ],
  CUSTOMER: [
    { label: 'Home', icon: 'Home', path: '/home' },
    { label: 'Buy Data', icon: 'Wifi', path: '/buy' },
    { label: 'History', icon: 'History', path: '/history' },
  ],
}

const dashboardPaths = {
  SUPER_ADMIN: '/admin',
  NETWORK_ADMIN: '/admin',
  AGENT: '/agent',
  RESELLER: '/reseller',
  CUSTOMER: '/home',
  AUDITOR: '/admin/audit-logs',
}

export function useRole() {
  const { profile } = useAuthStore()
  const role = profile?.role || 'CUSTOMER'
  return {
    role,
    navItems: navItems[role] || navItems.CUSTOMER,
    dashboardPath: dashboardPaths[role] || '/',
  }
}
