import { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, Navigate, NavLink, useNavigate, Link } from 'react-router-dom'

import FuelPage from './features/fuel/FuelPage'
import ExpensesPage from './features/expenses/ExpensesPage'
import ReportsPage from './features/reports/ReportsPage'
import SignupPage from './features/auth/SignupPage'
import VehiclesPage from './features/vehicles/VehiclesPage'
import DriversPage from './features/drivers/DriversPage'
import TripsPage from './features/trips/TripsPage'
import MaintenancePage from './features/maintenance/MaintenancePage'
import UsersPage from './features/users/UsersPage'

// ─── RBAC ─────────────────────────────────────────────────────────────────
const ROLE_NAV = {
  fleet_manager:    ['/dashboard', '/vehicles', '/trips', '/drivers', '/maintenance', '/fuel', '/expenses', '/reports', '/users'],
  dispatcher:       ['/dashboard', '/trips'],
  safety_officer:   ['/dashboard', '/drivers', '/maintenance'],
  financial_analyst:['/dashboard', '/fuel', '/expenses', '/reports'],
}

function canAccess(role, path) {
  const allowed = ROLE_NAV[role]
  if (!allowed) return false
  return allowed.some((p) => path === p || path.startsWith(p + '/'))
}

// ─── Auth Context ──────────────────────────────────────────────────────────
const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('transitops-user')) } catch { return null }
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

// ─── SVG Icons ─────────────────────────────────────────────────────────────
const Icon = ({ name, size = 16 }) => {
  const paths = {
    dashboard:    <><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></>,
    truck:        <><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></>,
    users:        <><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></>,
    route:        <><path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7z"/></>,
    wrench:       <><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></>,
    fuel:         <><path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM18 10c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM8 18v-4.5H6L10 7v4.5h2L8 18z"/></>,
    dollar:       <><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></>,
    chart:        <><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></>,
    logout:       <><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></>,
    shield:       <><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></>,
    key:          <><path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></>,
    sun:          <><path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z"/></>,
    moon:         <><path d="M10 2c-1.82 0-3.53.5-5 1.35C7.99 5.08 10 8.3 10 12s-2.01 6.92-5 8.65C6.47 21.5 8.18 22 10 22c5.52 0 10-4.48 10-10S15.52 2 10 2z"/></>,
    chevron:      <><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></>,
    bell:         <><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {paths[name] || null}
    </svg>
  )
}

// ─── Role config ───────────────────────────────────────────────────────────
const ROLE_LABEL = {
  fleet_manager:    'Fleet Manager',
  dispatcher:       'Dispatcher',
  safety_officer:   'Safety Officer',
  financial_analyst:'Financial Analyst',
}

const ALL_NAV = [
  { label: 'Dashboard',   icon: 'dashboard', path: '/dashboard', roles: ['fleet_manager','dispatcher','safety_officer','financial_analyst'] },
  { label: 'Vehicles',    icon: 'truck',     path: '/vehicles',    roles: ['fleet_manager'] },
  { label: 'Trips',       icon: 'route',     path: '/trips',       roles: ['fleet_manager','dispatcher'] },
  { label: 'Drivers',     icon: 'shield',    path: '/drivers',     roles: ['fleet_manager','safety_officer'] },
  { label: 'Maintenance', icon: 'wrench',    path: '/maintenance', roles: ['fleet_manager','safety_officer'] },
  { label: 'Fuel Logs',   icon: 'fuel',      path: '/fuel',        roles: ['fleet_manager','financial_analyst'] },
  { label: 'Expenses',    icon: 'dollar',    path: '/expenses',    roles: ['fleet_manager','financial_analyst'] },
  { label: 'Reports',     icon: 'chart',     path: '/reports',     roles: ['fleet_manager','financial_analyst'] },
  { label: 'Users',       icon: 'key',       path: '/users',       roles: ['fleet_manager'] },
]

// ─── Sidebar ───────────────────────────────────────────────────────────────
function Sidebar() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const role = user?.role
  const navItems = ALL_NAV.filter(i => i.roles.includes(role))

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: '1.25rem 1rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 6,
            background: 'var(--odoo-purple)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon name="truck" size={16} />
          </div>
          <div>
            <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.9375rem', lineHeight: 1.2 }}>TransitOps</div>
            <div style={{ color: '#808080', fontSize: '0.6875rem', marginTop: 1 }}>Transport Platform</div>
          </div>
        </div>
      </div>

      {/* Role label */}
      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ fontSize: '0.625rem', color: '#606060', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Role</div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--odoo-purple-light)', fontWeight: 600 }}>{ROLE_LABEL[role] || role}</div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, paddingTop: '0.5rem' }}>
        {navItems.map(item => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon name={item.icon} size={15} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {user && (
          <div style={{ padding: '0.75rem 1rem 0.5rem' }}>
            <div style={{ color: '#E0E0E0', fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.3 }}>{user.name || user.email}</div>
            {user.name && <div style={{ color: '#606060', fontSize: '0.6875rem', marginTop: 1 }}>{user.email}</div>}
          </div>
        )}
        <button className="nav-item" onClick={() => { logout(); navigate('/login') }} style={{ color: '#888', marginBottom: '0.5rem' }}>
          <Icon name="logout" size={15} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}

// ─── Topbar ────────────────────────────────────────────────────────────────
function Topbar({ title }) {
  return (
    <header className="topbar">
      <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-text)', flex: 1 }}>{title}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
        Odoo Hackathon 2026
      </div>
    </header>
  )
}

// ─── Protected Layout ──────────────────────────────────────────────────────
function AppLayout({ title, children }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Topbar title={title} />
        <main className="page-content animate-fade-in">{children}</main>
      </div>
    </div>
  )
}

// ─── RBAC Route ────────────────────────────────────────────────────────────
function RoleRoute({ path, title, children }) {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!canAccess(user.role, path)) {
    return (
      <AppLayout title="Access Restricted">
        <div className="card" style={{ maxWidth: 480, margin: '2rem auto', padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FEF0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--color-danger)' }}>
            <Icon name="shield" size={22} />
          </div>
          <h2 style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.5rem' }}>Access Restricted</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Your role <strong>{ROLE_LABEL[user.role]}</strong> does not have access to this module.
          </p>
          <Link to="/dashboard" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Back to Dashboard
          </Link>
        </div>
      </AppLayout>
    )
  }
  return <AppLayout title={title}>{children}</AppLayout>
}

// ─── Login ─────────────────────────────────────────────────────────────────
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
      if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Login failed')
      login({ email: form.email, role: data.role, id: data.user_id, name: data.name }, data.access_token)
      navigate(ROLE_NAV[data.role]?.[0] || '/dashboard')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: '#F0EDF2',
    }}>
      {/* Left panel */}
      <div style={{
        flex: '0 0 400px', background: 'var(--odoo-purple)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '3rem', color: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="truck" size={22} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.01em' }}>TransitOps</span>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.3, marginBottom: '1rem' }}>
          Smart Transport Operations
        </h1>
        <p style={{ fontSize: '0.9375rem', opacity: 0.8, lineHeight: 1.6, marginBottom: '2.5rem' }}>
          Manage your entire fleet — vehicles, trips, drivers, maintenance, and analytics — from a single platform.
        </p>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {[
            { label: 'Fleet Management', desc: 'Real-time vehicle tracking' },
            { label: 'RBAC Security', desc: 'Role-based access control' },
            { label: 'Analytics', desc: 'Performance reports & ROI' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.6)', marginTop: 6, flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.label}</div>
                <div style={{ fontSize: '0.8125rem', opacity: 0.7 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right login panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.375rem', marginBottom: '0.375rem', color: 'var(--color-text)' }}>Sign in</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
            Enter your credentials to access the platform
          </p>

          {error && (
            <div className="alert-banner alert-danger" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label className="form-label">Email address</label>
              <input id="login-email" type="email" className="form-input" placeholder="you@company.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input id="login-password" type="password" className="form-input" placeholder="••••••••"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <button id="login-submit" type="submit" className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.625rem', marginTop: '0.25rem', fontSize: '0.9375rem' }}
              disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8125rem', marginTop: '1.25rem' }}>
            Need an account?{' '}
            <Link to="/signup" style={{ color: 'var(--odoo-purple)', fontWeight: 600, textDecoration: 'none' }}>
              Register here
            </Link>
          </p>

          {/* Role access reference */}
          <div style={{ marginTop: '2rem', padding: '1rem', background: '#FAF9FB', borderRadius: 6, border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.625rem' }}>Role Access Guide</div>
            {Object.entries(ROLE_NAV).map(([role, paths]) => (
              <div key={role} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '0.25rem 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--odoo-purple)', fontWeight: 600 }}>{ROLE_LABEL[role]}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>{paths.slice(1).map(p => p.replace('/', '')).join(', ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard ─────────────────────────────────────────────────────────────
function Dashboard() {
  const [kpis, setKpis] = useState(null)
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('transitops-token')

  useEffect(() => {
    fetch('/api/v1/dashboard/kpis', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setKpis(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  const KPI = ({ label, value, accent }) => (
    <div className="kpi-card" style={{ '--accent-color': accent }}>
      <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>{label}</div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: accent || 'var(--color-text)', lineHeight: 1 }}>{value ?? '—'}</div>
    </div>
  )

  const Section = ({ label }) => (
    <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', margin: '1.5rem 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ height: 1, flex: 1, background: 'var(--color-border)' }} />
      {label}
      <div style={{ height: 1, flex: 1, background: 'var(--color-border)' }} />
    </div>
  )

  return (
    <AppLayout title="Dashboard">
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem' }}>
          <div className="loading-spinner" />
        </div>
      ) : kpis ? (
        <>
          {kpis.alerts?.licenses_expiring_soon?.length > 0 && (
            <div className="alert-banner alert-warning" style={{ marginBottom: '1.25rem' }}>
              <Icon name="bell" size={16} />
              <div>
                <strong>{kpis.alerts.licenses_expiring_soon.length} driver license(s) expiring within 7 days</strong>
                <div style={{ fontSize: '0.8125rem', marginTop: 2 }}>
                  {kpis.alerts.licenses_expiring_soon.map(d => `${d.name} (${d.days_until_expiry}d)`).join(' · ')}
                </div>
              </div>
            </div>
          )}
          {kpis.alerts?.licenses_expired?.length > 0 && (
            <div className="alert-banner alert-danger" style={{ marginBottom: '1.25rem' }}>
              <Icon name="bell" size={16} />
              <strong>{kpis.alerts.licenses_expired.length} driver license(s) have expired</strong>
            </div>
          )}

          <Section label="Fleet Status" />
          <div className="grid-kpi">
            <KPI label="Available Vehicles" value={kpis.vehicles?.available} accent="var(--color-success)" />
            <KPI label="On Trip" value={kpis.vehicles?.on_trip} accent="var(--odoo-teal)" />
            <KPI label="In Maintenance" value={kpis.vehicles?.in_maintenance} accent="var(--color-warning)" />
            <KPI label="Fleet Utilization" value={`${kpis.vehicles?.fleet_utilization_pct ?? 0}%`} accent="var(--odoo-purple)" />
          </div>

          <Section label="Operations" />
          <div className="grid-kpi">
            <KPI label="Active Trips" value={kpis.trips?.active} accent="var(--odoo-teal)" />
            <KPI label="Pending Trips" value={kpis.trips?.pending} accent="var(--color-warning)" />
            <KPI label="Completed Trips" value={kpis.trips?.completed} accent="var(--color-success)" />
            <KPI label="Drivers On Duty" value={kpis.drivers?.on_duty} accent="var(--odoo-purple)" />
            <KPI label="Available Drivers" value={kpis.drivers?.available} accent="var(--color-success)" />
            <KPI label="Total Fleet" value={kpis.vehicles?.total} accent="var(--color-text-muted)" />
          </div>
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', maxWidth: 480, margin: '2rem auto' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>Unable to load dashboard data. Ensure the backend is running.</p>
        </div>
      )}
    </AppLayout>
  )
}

// ─── App Root ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

function AppRoutes() {
  const { user } = useAuth()
  const role = user?.role

  return (
    <Routes>
      <Route path="/login"  element={<Login />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/vehicles"    element={<RoleRoute path="/vehicles"    title="Vehicles"><VehiclesPage userRole={role} /></RoleRoute>} />
      <Route path="/trips"       element={<RoleRoute path="/trips"       title="Trips"><TripsPage userRole={role} /></RoleRoute>} />
      <Route path="/drivers"     element={<RoleRoute path="/drivers"     title="Drivers"><DriversPage userRole={role} /></RoleRoute>} />
      <Route path="/maintenance" element={<RoleRoute path="/maintenance" title="Maintenance"><MaintenancePage userRole={role} /></RoleRoute>} />
      <Route path="/fuel"        element={<RoleRoute path="/fuel"        title="Fuel Logs"><FuelPage /></RoleRoute>} />
      <Route path="/expenses"    element={<RoleRoute path="/expenses"    title="Expenses"><ExpensesPage /></RoleRoute>} />
      <Route path="/reports"     element={<RoleRoute path="/reports"     title="Reports"><ReportsPage /></RoleRoute>} />
      <Route path="/users"       element={<RoleRoute path="/users"       title="User Management"><UsersPage /></RoleRoute>} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
