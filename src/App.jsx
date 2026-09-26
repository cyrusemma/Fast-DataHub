import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthListener } from './hooks/useAuth'
import { useThemeInit } from './hooks/useThemeInit'
import { FullPageSpinner } from './components/ui/Spinner'
import DashboardLayout from './components/layouts/DashboardLayout'
import { ProtectedRoute } from './router/ProtectedRoute'
import { RoleRedirect } from './router/RoleRedirect'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import CustomerDashboard from './pages/customer/CustomerDashboard'
import CustomerBuyData from './pages/customer/CustomerBuyData'
import CustomerAirtime from './pages/customer/CustomerAirtime'
import CustomerReferrals from './pages/customer/CustomerReferrals'
import CustomerHistory from './pages/customer/CustomerHistory'
import CustomerWallet from './pages/customer/CustomerWallet'
import AgentDashboard from './pages/agent/AgentDashboard'
import AgentBuyBulk from './pages/agent/AgentBuyBulk'
import AgentPricingEngine from './pages/agent/AgentPricingEngine'
import AgentResellers from './pages/agent/AgentResellers'
import AgentCommissions from './pages/agent/AgentCommissions'
import AgentThemeSettings from './pages/agent/AgentThemeSettings'
import ResellerDashboard from './pages/reseller/ResellerDashboard'
import ResellerPricingEngine from './pages/reseller/ResellerPricingEngine'
import ResellerEarnings from './pages/reseller/ResellerEarnings'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminTransactions from './pages/admin/AdminTransactions'
import AdminBundles from './pages/admin/AdminBundles'
import AdminFinance from './pages/admin/AdminFinance'
import AdminAuditLogs from './pages/admin/AdminAuditLogs'
import AdminThemeSettings from './pages/admin/AdminThemeSettings'
import AdminPricingEngine from './pages/admin/AdminPricingEngine'
import NotFound from './pages/NotFound'
import ErrorBoundary from './components/ErrorBoundary'

const customerRoles = ['CUSTOMER', 'RESELLER', 'AGENT', 'SUPER_ADMIN', 'NETWORK_ADMIN']
const resellerRoles = ['RESELLER']
const agentRoles = ['AGENT']
const adminRoles = ['SUPER_ADMIN', 'NETWORK_ADMIN']
const auditRoles = ['SUPER_ADMIN', 'NETWORK_ADMIN', 'AUDITOR']

function Guard({ roles, children }) {
  return <ProtectedRoute allowedRoles={roles}>{children}</ProtectedRoute>
}

export default function App() {
  const { ready } = useAuthListener()
  useThemeInit()

  if (!ready) return <FullPageSpinner label="Preparing DataHUB..." />

  return (
    <ErrorBoundary>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<Guard roles={[...customerRoles, ...auditRoles]}><DashboardLayout /></Guard>}>
        <Route path="/" element={<RoleRedirect />} />
        
        {/* Core Customer / Shared Routes */}
        <Route path="/home" element={<Guard roles={customerRoles}><CustomerDashboard /></Guard>} />
        <Route path="/buy" element={<Guard roles={customerRoles}><CustomerBuyData /></Guard>} />
        <Route path="/airtime" element={<Guard roles={customerRoles}><CustomerAirtime /></Guard>} />
        <Route path="/referrals" element={<Guard roles={customerRoles}><CustomerReferrals /></Guard>} />
        <Route path="/history" element={<Guard roles={customerRoles}><CustomerHistory /></Guard>} />
        <Route path="/wallet" element={<Guard roles={customerRoles}><CustomerWallet /></Guard>} />

        {/* Agent Routes */}
        <Route path="/agent" element={<Guard roles={agentRoles}><AgentDashboard /></Guard>} />
        <Route path="/agent/buy-bulk" element={<Guard roles={agentRoles}><AgentBuyBulk /></Guard>} />
        <Route path="/agent/pricing" element={<Guard roles={agentRoles}><AgentPricingEngine /></Guard>} />
        <Route path="/agent/resellers" element={<Guard roles={agentRoles}><AgentResellers /></Guard>} />
        <Route path="/agent/commissions" element={<Guard roles={agentRoles}><AgentCommissions /></Guard>} />
        <Route path="/agent/theme" element={<Guard roles={agentRoles}><AgentThemeSettings /></Guard>} />
        <Route path="/agent/wallet" element={<Navigate to="/wallet" replace />} />

        {/* Reseller Routes */}
        <Route path="/reseller" element={<Guard roles={resellerRoles}><ResellerDashboard /></Guard>} />
        <Route path="/reseller/sell" element={<Navigate to="/buy" replace />} />
        <Route path="/reseller/pricing" element={<Guard roles={resellerRoles}><ResellerPricingEngine /></Guard>} />
        <Route path="/reseller/earnings" element={<Guard roles={resellerRoles}><ResellerEarnings /></Guard>} />
        <Route path="/reseller/wallet" element={<Navigate to="/wallet" replace />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<Guard roles={adminRoles}><AdminDashboard /></Guard>} />
        <Route path="/admin/pricing" element={<Guard roles={adminRoles}><AdminPricingEngine /></Guard>} />
        <Route path="/admin/users" element={<Guard roles={adminRoles}><AdminUsers /></Guard>} />
        <Route path="/admin/agents" element={<Navigate to="/admin/users" replace />} />
        <Route path="/admin/transactions" element={<Guard roles={auditRoles}><AdminTransactions /></Guard>} />
        <Route path="/admin/bundles" element={<Guard roles={adminRoles}><AdminBundles /></Guard>} />
        <Route path="/admin/finance" element={<Guard roles={adminRoles}><AdminFinance /></Guard>} />
        <Route path="/admin/theme" element={<Guard roles={adminRoles}><AdminThemeSettings /></Guard>} />
        <Route path="/admin/audit-logs" element={<Guard roles={auditRoles}><AdminAuditLogs /></Guard>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
    </ErrorBoundary>
  )
}
