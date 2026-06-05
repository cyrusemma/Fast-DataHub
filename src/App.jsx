import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthListener } from './hooks/useAuth'
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
import CustomerHistory from './pages/customer/CustomerHistory'
import CustomerWallet from './pages/customer/CustomerWallet'
import AgentDashboard from './pages/agent/AgentDashboard'
import AgentBuyBulk from './pages/agent/AgentBuyBulk'
import AgentResellers from './pages/agent/AgentResellers'
import AgentCommissions from './pages/agent/AgentCommissions'
import AgentWallet from './pages/agent/AgentWallet'
import ResellerDashboard from './pages/reseller/ResellerDashboard'
import ResellerSellData from './pages/reseller/ResellerSellData'
import ResellerEarnings from './pages/reseller/ResellerEarnings'
import ResellerWallet from './pages/reseller/ResellerWallet'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminTransactions from './pages/admin/AdminTransactions'
import AdminAgents from './pages/admin/AdminAgents'
import AdminBundles from './pages/admin/AdminBundles'
import AdminFinance from './pages/admin/AdminFinance'
import AdminAuditLogs from './pages/admin/AdminAuditLogs'
import ErrorBoundary from './components/ErrorBoundary'

const customerRoles = ['CUSTOMER']
const resellerRoles = ['RESELLER']
const agentRoles = ['AGENT']
const adminRoles = ['SUPER_ADMIN', 'NETWORK_ADMIN']
const auditRoles = ['SUPER_ADMIN', 'NETWORK_ADMIN', 'AUDITOR']

function Guard({ roles, children }) {
  return <ProtectedRoute allowedRoles={roles}>{children}</ProtectedRoute>
}

export default function App() {
  const { ready } = useAuthListener()
  if (!ready) return <FullPageSpinner label="Preparing DataHUB..." />

  return (
    <ErrorBoundary>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<Guard roles={[...customerRoles, ...resellerRoles, ...agentRoles, ...auditRoles]}><DashboardLayout /></Guard>}>
        <Route path="/" element={<RoleRedirect />} />
        <Route path="/home" element={<Guard roles={customerRoles}><CustomerDashboard /></Guard>} />
        <Route path="/buy" element={<Guard roles={customerRoles}><CustomerBuyData /></Guard>} />
        <Route path="/history" element={<Guard roles={customerRoles}><CustomerHistory /></Guard>} />
        <Route path="/wallet" element={<Guard roles={customerRoles}><CustomerWallet /></Guard>} />

        <Route path="/agent" element={<Guard roles={agentRoles}><AgentDashboard /></Guard>} />
        <Route path="/agent/buy-bulk" element={<Guard roles={agentRoles}><AgentBuyBulk /></Guard>} />
        <Route path="/agent/resellers" element={<Guard roles={agentRoles}><AgentResellers /></Guard>} />
        <Route path="/agent/commissions" element={<Guard roles={agentRoles}><AgentCommissions /></Guard>} />
        <Route path="/agent/wallet" element={<Guard roles={agentRoles}><AgentWallet /></Guard>} />

        <Route path="/reseller" element={<Guard roles={resellerRoles}><ResellerDashboard /></Guard>} />
        <Route path="/reseller/sell" element={<Guard roles={resellerRoles}><ResellerSellData /></Guard>} />
        <Route path="/reseller/earnings" element={<Guard roles={resellerRoles}><ResellerEarnings /></Guard>} />
        <Route path="/reseller/wallet" element={<Guard roles={resellerRoles}><ResellerWallet /></Guard>} />

        <Route path="/admin" element={<Guard roles={adminRoles}><AdminDashboard /></Guard>} />
        <Route path="/admin/users" element={<Guard roles={adminRoles}><AdminUsers /></Guard>} />
        <Route path="/admin/transactions" element={<Guard roles={auditRoles}><AdminTransactions /></Guard>} />
        <Route path="/admin/agents" element={<Guard roles={adminRoles}><AdminAgents /></Guard>} />
        <Route path="/admin/bundles" element={<Guard roles={adminRoles}><AdminBundles /></Guard>} />
        <Route path="/admin/finance" element={<Guard roles={adminRoles}><AdminFinance /></Guard>} />
        <Route path="/admin/audit-logs" element={<Guard roles={auditRoles}><AdminAuditLogs /></Guard>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </ErrorBoundary>
  )
}
