
import { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, Navigate, NavLink, useNavigate, Link } from 'react-router-dom'

// ── Feature pages ──────────────────────────────────────────────────────────
import FuelPage from './features/fuel/FuelPage'
import ExpensesPage from './features/expenses/ExpensesPage'
import ReportsPage from './features/reports/ReportsPage'
import SignupPage from './features/auth/SignupPage'
import VehiclesPage from './features/vehicles/VehiclesPage'
import DriversPage from './features/drivers/DriversPage'
import TripsPage from './features/trips/TripsPage'
import MaintenancePage from './features/maintenance/MaintenancePage'
import UsersPage from './features/users/UsersPage'

// ─── RBAC helpers ─────────────────────────────────────────────────────────
const ROLE_NAV = {
  fleet_manager:    ['/dashboard', '/vehicles', '/maintenance', '/users'],
  dispatcher:       ['/dashboard', '/trips'],
  safety_officer:   ['/dashboard', '/drivers', '/maintenance'],
  financial_analyst:['/dashboard', '/fuel', '/expenses', '/reports'],
}

function canAccess(role, path) {
  const allowed = ROLE_NAV[role]
  if (!allowed) return false
  return allowed.some((p) => path === p || path.startsWith(p + '/'))
}

// ─── Theme Context ─────────────────────────────────────────────────────────
const ThemeContext = createContext(null)
export const useTheme = () => useContext(ThemeContext)

function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('transitops-theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('transitops-theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark(d => !d) }}>
      {children}
    </ThemeContext.Provider>
  )
}

// ─── Auth Context ──────────────────────────────────────────────────────────
const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('transitops-user')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })

  const login = (userData, token) => {
    localStorage.setItem('transitops-token', token)
    localStorage.setItem('transitops-user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('transitops-token')
    localStorage.removeItem('transitops-user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Icons ─────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 18 }) => {
  const icons = {
    dashboard:  <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    truck:      <><rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>,
    users:      <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    route:      <><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></>,
    wrench:     <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>,
    fuel:       <><line x1="3" y1="22" x2="15" y2="22"/><line x1="4" y1="9" x2="14" y2="9"/><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-6.93a2 2 0 0 0-.59-1.41L19 7"/></>,
    dollar:     <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
    chart:      <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    logout:     <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    sun:        <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
    moon:       <><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></>,
    bell:       <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
    shield:     <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    key:        <><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/></>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  )
}

// ─── Role-based nav items ──────────────────────────────────────────────────
const ALL_NAV_ITEMS = [
  { label: 'Dashboard',    icon: 'dashboard', path: '/dashboard', roles: ['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst'] },
  // Fleet Manager scope
  { label: 'Vehicles',     icon: 'truck',     path: '/vehicles',    roles: ['fleet_manager'] },
  { label: 'Maintenance',  icon: 'wrench',    path: '/maintenance', roles: ['fleet_manager', 'safety_officer'] },
  { label: 'Users',        icon: 'key',       path: '/users',       roles: ['fleet_manager'] },
  // Dispatcher scope
  { label: 'Trips',        icon: 'route',     path: '/trips',       roles: ['fleet_manager', 'dispatcher'] },
  // Safety Officer scope
  { label: 'Drivers',      icon: 'shield',    path: '/drivers',     roles: ['fleet_manager', 'safety_officer'] },
  // Financial Analyst scope
  { label: 'Fuel Logs',    icon: 'fuel',      path: '/fuel',        roles: ['financial_analyst', 'fleet_manager'] },
  { label: 'Expenses',     icon: 'dollar',    path: '/expenses',    roles: ['financial_analyst', 'fleet_manager'] },
  { label: 'Reports',      icon: 'chart',     path: '/reports',     roles: ['financial_analyst', 'fleet_manager'] },
]

const ROLE_LABEL = {
  fleet_manager:    '🚛 Fleet Manager',
  dispatcher:       '🗺️ Dispatcher',
  safety_officer:   '🛡️ Safety Officer',
  financial_analyst:'📊 Financial Analyst',
}

// ─── Sidebar ──────────────────────────────────────────────────────────────
function Sidebar() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const role = user?.role

  const navItems = ALL_NAV_ITEMS.filter((item) => item.roles.includes(role))

  return (
    <aside className="sidebar">
      <div style={{ padding: '0 1.5rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="truck" size={18} />
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '1rem', lineHeight: 1 }}>TransitOps</div>
            <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: 2 }}>Fleet Management</div>
          </div>
        </div>
      </div>

      {/* Role chip */}
      <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Your Role</div>
        <div style={{ fontSize: '0.8125rem', color: '#cbd5e1', fontWeight: 600 }}>{ROLE_LABEL[role] || role}</div>
      </div>

      <nav style={{ flex: 1, paddingTop: '0.75rem' }}>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon name={item.icon} size={16} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '1rem 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {user && (
          <div style={{ padding: '0 1.25rem 0.75rem' }}>
            <div style={{ color: 'white', fontSize: '0.8125rem', fontWeight: 600 }}>{user.name || user.email}</div>
            <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: 2 }}>{user.email}</div>
          </div>
        )}
        <button className="nav-item" onClick={() => { logout(); navigate('/login') }} style={{ color: '#ef4444' }}>
          <Icon name="logout" size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}

// ─── Topbar ───────────────────────────────────────────────────────────────
function Topbar({ title }) {
  const { dark, toggle } = useTheme()
  return (
    <header className="topbar">
      <h1 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, flex: 1 }}>{title}</h1>
      <button onClick={toggle} className="btn btn-secondary btn-sm" id="theme-toggle" title={dark ? 'Light mode' : 'Dark mode'}>
        <Icon name={dark ? 'sun' : 'moon'} size={15} />
        {dark ? 'Light' : 'Dark'}
      </button>
    </header>
  )
}

// ─── Protected Layout ─────────────────────────────────────────────────────
function AppLayout({ title, children }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Topbar title={title} />
        <main className="page-content animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}

// ─── Access Denied page ────────────────────────────────────────────────────
function AccessDenied() {
  const { user } = useAuth()
  const roleLabel = ROLE_LABEL[user?.role] || user?.role
  const allowedPaths = ROLE_NAV[user?.role] || []
  return (
    <AppLayout title="Access Denied">
      <div className="card" style={{ textAlign: 'center', padding: '3rem', maxWidth: 500, margin: '0 auto' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
        <h2 style={{ margin: '0 0 0.5rem' }}>Access Restricted</h2>
        <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
          Your role <strong>{roleLabel}</strong> does not have permission to access this page.
        </p>
        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
          Your accessible modules: <strong style={{ color: 'var(--color-accent)' }}>
            {allowedPaths.slice(1).map((p) => p.replace('/', '')).join(', ')}
          </strong>
        </div>
        <Link to="/dashboard" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
          ← Back to Dashboard
        </Link>
      </div>
    </AppLayout>
  )
}

// ─── RBAC Route Guard ──────────────────────────────────────────────────────
function RoleRoute({ path, title, children }) {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!canAccess(user.role, path)) return <AccessDenied />
  return <AppLayout title={title}>{children}</AppLayout>
}

// ─── Login Page ───────────────────────────────────────────────────────────
function Login() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const body = new URLSearchParams()
      body.append('username', form.email)
      body.append('password', form.password)
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Login failed')
      login({ email: form.email, role: data.role, id: data.user_id }, data.access_token)
      // Redirect to first allowed path for role
      const firstPath = ROLE_NAV[data.role]?.[0] || '/dashboard'
      navigate(firstPath)
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 20px 40px rgba(59,130,246,0.4)' }}>
            <Icon name="truck" size={28} />
          </div>
          <h1 style={{ color: 'white', margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>TransitOps</h1>
          <p style={{ color: '#94a3b8', margin: '0.5rem 0 0', fontSize: '0.875rem' }}>Smart Transport Operations Platform</p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', padding: '2rem' }}>
          <h2 style={{ color: 'white', margin: '0 0 1.5rem', fontSize: '1.125rem', fontWeight: 600 }}>Sign in to your account</h2>
          {error && <div className="alert-banner alert-danger" style={{ marginBottom: '1rem', borderRadius: '0.5rem' }}>⚠️ {error}</div>}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ color: '#94a3b8' }}>Email address</label>
              <input id="login-email" type="email" className="form-input" placeholder="you@company.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required
                style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ color: '#94a3b8' }}>Password</label>
              <input id="login-password" type="password" className="form-input" placeholder="••••••••" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required
                style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }} />
            </div>
            <button id="login-submit" type="submit" className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8125rem', marginTop: '1.25rem', marginBottom: 0 }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: '#60a5fa', fontWeight: 600, textDecoration: 'none' }}>Sign up</Link>
          </p>
        </div>

        {/* Role guide */}
        <div style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.875rem', padding: '1rem 1.25rem' }}>
          <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Role Access Guide</div>
          <div style={{ display: 'grid', gap: '0.4rem' }}>
            {Object.entries(ROLE_LABEL).map(([role, label]) => (
              <div key={role} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ color: '#94a3b8' }}>{label}</span>
                <span style={{ color: '#475569' }}>{ROLE_NAV[role]?.slice(1).map((p) => p.replace('/', '')).join(', ')}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.75rem', marginTop: '1.5rem' }}>
          TransitOps © 2024 — Odoo Hackathon Demo
        </p>
      </div>
    </div>
  )
}

// ─── Dashboard ─────────────────────────────────────────────────────────────
function Dashboard() {
  const [kpis, setKpis] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const token = localStorage.getItem('transitops-token')

  useEffect(() => {
    fetch('/api/v1/dashboard/kpis', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setKpis(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  const KPI = ({ label, value, accent }) => (
    <div className="kpi-card" style={{ '--accent-color': accent }}>
      <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{label}</div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: accent || 'var(--color-text)' }}>{value ?? '—'}</div>
    </div>
  )

  return (
    <AppLayout title="Dashboard">
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="loading-spinner" /></div>
      ) : kpis ? (
        <>
          {kpis.alerts?.licenses_expiring_soon?.length > 0 && (
            <div className="alert-banner alert-warning">
              <Icon name="bell" size={18} />
              <div>
                <strong>{kpis.alerts.licenses_expiring_soon.length} driver license(s) expiring within 7 days</strong>
                <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                  {kpis.alerts.licenses_expiring_soon.map(d => `${d.name} (${d.days_until_expiry}d)`).join(' · ')}
                </div>
              </div>
            </div>
          )}
          {kpis.alerts?.licenses_expired?.length > 0 && (
            <div className="alert-banner alert-danger">
              <Icon name="bell" size={18} />
              <strong>{kpis.alerts.licenses_expired.length} driver license(s) have expired!</strong>
            </div>
          )}

          <h2 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>Fleet Status</h2>
          <div className="grid-kpi" style={{ marginBottom: '1.5rem' }}>
            <KPI label="Available Vehicles" value={kpis.vehicles?.available} accent="var(--color-success)" />
            <KPI label="Active Trips" value={kpis.vehicles?.on_trip} accent="var(--color-accent)" />
            <KPI label="In Maintenance" value={kpis.vehicles?.in_maintenance} accent="var(--color-warning)" />
            <KPI label="Fleet Utilization" value={`${kpis.vehicles?.fleet_utilization_pct}%`} accent="#8b5cf6" />
          </div>

          <h2 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>Operations</h2>
          <div className="grid-kpi">
            <KPI label="Dispatched Trips" value={kpis.trips?.active} accent="var(--color-accent)" />
            <KPI label="Pending Trips" value={kpis.trips?.pending} accent="var(--color-warning)" />
            <KPI label="Completed Trips" value={kpis.trips?.completed} accent="var(--color-success)" />
            <KPI label="Drivers On Duty" value={kpis.drivers?.on_duty} accent="#ec4899" />
            <KPI label="Available Drivers" value={kpis.drivers?.available} accent="var(--color-success)" />
            <KPI label="Total Vehicles" value={kpis.vehicles?.total} accent="var(--color-text-muted)" />
          </div>
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p className="text-muted">Could not load dashboard data. Make sure the backend is running.</p>
        </div>
      )}
    </AppLayout>
  )
}

// ─── App Router ────────────────────────────────────────────────────────────
export default function App() {
  const { user } = useAuth?.() || {}

  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  )
}

function AppRoutes() {
  const { user } = useAuth()
  const role = user?.role

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Dashboard — all roles */}
      <Route path="/dashboard" element={<Dashboard />} />

      {/* Fleet Manager */}
      <Route path="/vehicles"    element={<RoleRoute path="/vehicles"    title="Vehicles"><VehiclesPage userRole={role} /></RoleRoute>} />
      <Route path="/users"       element={<RoleRoute path="/users"       title="User Management"><UsersPage /></RoleRoute>} />

      {/* Fleet Manager + Safety Officer */}
      <Route path="/maintenance" element={<RoleRoute path="/maintenance" title="Maintenance"><MaintenancePage userRole={role} /></RoleRoute>} />
      <Route path="/drivers"     element={<RoleRoute path="/drivers"     title="Drivers"><DriversPage userRole={role} /></RoleRoute>} />

      {/* Fleet Manager + Dispatcher */}
      <Route path="/trips"       element={<RoleRoute path="/trips"       title="Trips"><TripsPage userRole={role} /></RoleRoute>} />

      {/* Financial Analyst + Fleet Manager */}
      <Route path="/fuel"        element={<RoleRoute path="/fuel"        title="Fuel Logs"><FuelPage /></RoleRoute>} />
      <Route path="/expenses"    element={<RoleRoute path="/expenses"    title="Expenses"><ExpensesPage /></RoleRoute>} />
      <Route path="/reports"     element={<RoleRoute path="/reports"     title="Reports"><ReportsPage /></RoleRoute>} />

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
