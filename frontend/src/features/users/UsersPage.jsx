import { useState, useEffect, useCallback } from 'react'
import client from '../../api/client'

const ROLE_INFO = {
  fleet_manager:    { label: 'Fleet Manager',    icon: '🚛', color: '#6366f1', access: 'Fleet, Maintenance' },
  dispatcher:       { label: 'Dispatcher',       icon: '🗺️', color: '#3b82f6', access: 'Dashboard, Trips' },
  safety_officer:   { label: 'Safety Officer',   icon: '🛡️', color: '#f59e0b', access: 'Drivers, Compliance' },
  financial_analyst:{ label: 'Financial Analyst',icon: '📊', color: '#22c55e', access: 'Fuel & Expenses, Analytics' },
}

function RoleBadge({ role }) {
  const r = ROLE_INFO[role] || { label: role, icon: '👤', color: '#64748b', access: '' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.75rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, background: `${r.color}18`, color: r.color, border: `1px solid ${r.color}30` }}>
      {r.icon} {r.label}
    </span>
  )
}

// ── Create User Modal ──────────────────────────────────────────────────────
function CreateUserModal({ onSave, onClose }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'fleet_manager' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setErr('')
    try {
      await client.post('/auth/users', form)
      onSave()
    } catch (ex) { setErr(ex.response?.data?.detail || 'Failed to create user') }
    finally { setSaving(false) }
  }

  const selectedRoleInfo = ROLE_INFO[form.role]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: '1rem', border: '1px solid var(--color-border)', padding: '2rem', width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-lg)' }}>
        <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.125rem', fontWeight: 700 }}>👤 Create Account</h2>
        {err && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid #ef4444', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem', color: '#ef4444', fontSize: '0.875rem' }}>⚠️ {err}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.name} onChange={set('name')} placeholder="e.g. Rajesh Kumar" />
            </div>
            <div>
              <label className="form-label">Email *</label>
              <input className="form-input" type="email" value={form.email} onChange={set('email')} required placeholder="user@company.com" />
            </div>
            <div>
              <label className="form-label">Password *</label>
              <input className="form-input" type="password" value={form.password} onChange={set('password')} required placeholder="Min. 6 characters" minLength={6} />
            </div>
            <div>
              <label className="form-label">Role *</label>
              <select className="form-input" value={form.role} onChange={set('role')}>
                {Object.entries(ROLE_INFO).map(([v, r]) => (
                  <option key={v} value={v}>{r.icon} {r.label}</option>
                ))}
              </select>
              {selectedRoleInfo && (
                <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--color-text-muted)', background: 'rgba(0,0,0,0.04)', padding: '0.5rem 0.75rem', borderRadius: '0.375rem' }}>
                  Access: <strong style={{ color: selectedRoleInfo.color }}>{selectedRoleInfo.access}</strong>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create Account'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [createModal, setCreateModal] = useState(false)
  const [deactivating, setDeactivating] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await client.get('/auth/users')
      setUsers(res.data)
    } catch { } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleDeactivate = async (user) => {
    if (!window.confirm(`Deactivate account for ${user.email}?`)) return
    setDeactivating(user.id)
    try { await client.patch(`/auth/users/${user.id}/deactivate`) } finally { setDeactivating(null) }
    load()
  }

  const byRole = Object.keys(ROLE_INFO).reduce((a, r) => {
    a[r] = users.filter((u) => u.role === r)
    return a
  }, {})

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.375rem' }}>🔐 User Management</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Create and manage platform accounts (Fleet Manager access only)
          </p>
        </div>
        <button id="user-create-btn" className="btn btn-primary" onClick={() => setCreateModal(true)}>+ Create Account</button>
      </div>

      {/* RBAC Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '1rem' }}>
        {Object.entries(ROLE_INFO).map(([role, r]) => (
          <div key={role} className="card" style={{ padding: '1rem 1.25rem', borderLeft: `3px solid ${r.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '1.25rem' }}>{r.icon}</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: r.color }}>{byRole[role]?.length || 0}</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 2 }}>{r.label}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{r.access}</div>
            {['fleet_manager', 'safety_officer'].includes(role) && (
              <div style={{ marginTop: 6, fontSize: '0.65rem', color: r.color, fontWeight: 600, background: `${r.color}12`, padding: '2px 6px', borderRadius: 4, display: 'inline-block' }}>
                Admin-created only
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="loading-spinner" /></div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
            <p>No users found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.03)' }}>
                  {['Name', 'Email', 'Role', 'Module Access', 'Status', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id}
                    style={{ borderBottom: '1px solid var(--color-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)', transition: 'background 0.15s', opacity: u.is_active ? 1 : 0.55 }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)'}
                  >
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>{u.name || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--color-accent)' }}>{u.email}</td>
                    <td style={{ padding: '0.75rem 1rem' }}><RoleBadge role={u.role} /></td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                      {ROLE_INFO[u.role]?.access || '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: u.is_active ? '#22c55e' : '#ef4444' }}>
                        {u.is_active ? '● Active' : '● Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {u.is_active && (
                        <button className="btn btn-sm"
                          onClick={() => handleDeactivate(u)}
                          disabled={deactivating === u.id}
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', fontSize: '0.75rem' }}>
                          {deactivating === u.id ? '…' : 'Deactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {createModal && <CreateUserModal onSave={() => { setCreateModal(false); load() }} onClose={() => setCreateModal(false)} />}
    </div>
  )
}
