import { useState, useEffect, useCallback } from 'react'
import client from '../../api/client'

const STATUS_STYLE = {
  available:  { bg: 'rgba(34,197,94,0.12)',   color: '#22c55e' },
  on_trip:    { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6' },
  off_duty:   { bg: 'rgba(100,116,139,0.12)', color: '#64748b' },
  suspended:  { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
}

const DRIVER_STATUSES = ['available', 'on_trip', 'off_duty', 'suspended']
const LICENSE_CATS = ['LMV', 'HMV', 'HPMV', 'MGV', 'LMV-TR', 'PSV']

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.off_duty
  return (
    <span style={{ display: 'inline-block', padding: '0.2rem 0.65rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', background: s.bg, color: s.color }}>
      {status?.replace('_', ' ')}
    </span>
  )
}

function SafetyBar({ score }) {
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ width: 70, height: 6, background: 'var(--color-border)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 99, transition: 'width 0.6s' }} />
      </div>
      <span style={{ fontSize: '0.8rem', fontWeight: 700, color }}>{score}</span>
    </div>
  )
}

function LicenseExpiry({ expiry, days }) {
  const expired = days < 0
  const warn = days >= 0 && days <= 30
  const color = expired ? '#ef4444' : warn ? '#f59e0b' : 'var(--color-text-muted)'
  const icon = expired ? '🔴' : warn ? '⚠️' : '✅'
  return (
    <span style={{ color, fontSize: '0.8125rem', fontWeight: expired || warn ? 700 : 400 }}>
      {icon} {expiry}
      {expired && ' (Expired)'}
      {warn && !expired && ` (${days}d left)`}
    </span>
  )
}

// ── Add/Edit Modal ─────────────────────────────────────────────────────────
function DriverModal({ driver, onSave, onClose }) {
  const isEdit = Boolean(driver?.id)
  const [form, setForm] = useState({
    name: driver?.name ?? '',
    license_number: driver?.license_number ?? '',
    license_category: driver?.license_category ?? 'LMV',
    license_expiry: driver?.license_expiry ?? '',
    contact_number: driver?.contact_number ?? '',
    safety_score: driver?.safety_score ?? 100,
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setErr('')
    try {
      const payload = { ...form, safety_score: Number(form.safety_score) }
      if (isEdit) await client.put(`/drivers/${driver.id}`, payload)
      else await client.post('/drivers/', payload)
      onSave()
    } catch (ex) { setErr(ex.response?.data?.detail || 'Save failed') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: '1rem', border: '1px solid var(--color-border)', padding: '2rem', width: '100%', maxWidth: 520, boxShadow: 'var(--shadow-lg)', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.125rem', fontWeight: 700 }}>{isEdit ? '✏️ Edit Driver' : '👤 Add Driver'}</h2>
        {err && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid #ef4444', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem', color: '#ef4444', fontSize: '0.875rem' }}>⚠️ {err}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label className="form-label">Full Name *</label>
              <input className="form-input" value={form.name} onChange={set('name')} required placeholder="e.g. Ramesh Kumar" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">License Number *</label>
                <input className="form-input" value={form.license_number} onChange={set('license_number')} required disabled={isEdit} placeholder="MH0120230001234" />
              </div>
              <div>
                <label className="form-label">License Category</label>
                <select className="form-input" value={form.license_category} onChange={set('license_category')}>
                  {LICENSE_CATS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">License Expiry *</label>
                <input className="form-input" type="date" value={form.license_expiry} onChange={set('license_expiry')} required />
              </div>
              <div>
                <label className="form-label">Contact Number</label>
                <input className="form-input" type="tel" value={form.contact_number} onChange={set('contact_number')} placeholder="9XXXXXXXXX" />
              </div>
            </div>
            <div>
              <label className="form-label">Safety Score (0–100)</label>
              <input className="form-input" type="number" min="0" max="100" value={form.safety_score} onChange={set('safety_score')} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Update' : 'Add Driver'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Status Modal ───────────────────────────────────────────────────────────
function StatusModal({ driver, onSave, onClose }) {
  const [status, setStatus] = useState(driver.status)
  const [saving, setSaving] = useState(false)
  const handleSave = async () => {
    setSaving(true)
    try { await client.patch(`/drivers/${driver.id}/status`, { status }); onSave() }
    catch { } finally { setSaving(false) }
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: '1rem', border: '1px solid var(--color-border)', padding: '2rem', width: '100%', maxWidth: 340, boxShadow: 'var(--shadow-lg)' }}>
        <h3 style={{ margin: '0 0 1rem', fontWeight: 700 }}>Change Status — {driver.name}</h3>
        <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {DRIVER_STATUSES.map((s) => (
            <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.875rem', borderRadius: '0.5rem', border: `1.5px solid ${status === s ? 'var(--color-accent)' : 'var(--color-border)'}`, cursor: 'pointer', background: status === s ? 'rgba(59,130,246,0.07)' : 'transparent' }}>
              <input type="radio" value={s} checked={status === s} onChange={() => setStatus(s)} style={{ accentColor: 'var(--color-accent)' }} />
              <StatusBadge status={s} />
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? '…' : 'Update'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function DriversPage({ userRole }) {
  const canEdit = ['fleet_manager', 'safety_officer'].includes(userRole)
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [statusModal, setStatusModal] = useState(null)
  const [filters, setFilters] = useState({ search: '', status: '', license_category: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.search) params.search = filters.search
      if (filters.status) params.status = filters.status
      if (filters.license_category) params.license_category = filters.license_category
      const res = await client.get('/drivers/', { params })
      setDrivers(res.data)
    } catch { } finally { setLoading(false) }
  }, [filters])

  useEffect(() => { load() }, [load])

  const expiring = drivers.filter((d) => d.days_until_expiry >= 0 && d.days_until_expiry <= 30).length
  const expired = drivers.filter((d) => !d.is_license_valid).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.375rem' }}>👥 Driver Management</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Track drivers, licenses, and safety scores</p>
        </div>
        {canEdit && <button id="driver-add-btn" className="btn btn-primary" onClick={() => setModal('add')}>+ Add Driver</button>}
      </div>

      {/* Alerts */}
      {expired > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', padding: '0.875rem 1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center', color: '#ef4444', fontWeight: 600 }}>
          🔴 {expired} driver license{expired > 1 ? 's' : ''} expired — action required
        </div>
      )}
      {expiring > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '0.75rem', padding: '0.875rem 1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center', color: '#f59e0b', fontWeight: 600 }}>
          ⚠️ {expiring} driver license{expiring > 1 ? 's' : ''} expiring within 30 days
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: '1rem' }}>
        {[
          { label: 'Total Drivers', value: drivers.length, color: 'var(--color-accent)' },
          { label: 'Available', value: drivers.filter((d) => d.status === 'available').length, color: '#22c55e' },
          { label: 'On Trip', value: drivers.filter((d) => d.status === 'on_trip').length, color: '#3b82f6' },
          { label: 'Suspended', value: drivers.filter((d) => d.status === 'suspended').length, color: '#ef4444' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '2 1 200px' }}>
          <label className="form-label">Search</label>
          <input className="form-input" placeholder="Name or license no.…" value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} />
        </div>
        <div style={{ flex: '1 1 130px' }}>
          <label className="form-label">Status</label>
          <select className="form-input" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
            <option value="">All</option>
            {DRIVER_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div style={{ flex: '1 1 130px' }}>
          <label className="form-label">License Cat.</label>
          <select className="form-input" value={filters.license_category} onChange={(e) => setFilters((f) => ({ ...f, license_category: e.target.value }))}>
            <option value="">All</option>
            {LICENSE_CATS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ search: '', status: '', license_category: '' })}>Clear</button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="loading-spinner" /></div>
        ) : drivers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👥</div>
            <p>No drivers found. {canEdit && 'Add one to get started.'}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.03)' }}>
                  {['Name', 'License No.', 'Category', 'License Expiry', 'Safety Score', 'Contact', 'Status', canEdit ? 'Actions' : ''].map((h) => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {drivers.map((d, i) => (
                  <tr key={d.id}
                    style={{ borderBottom: '1px solid var(--color-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)'}
                  >
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>{d.name}</td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: 'var(--color-accent)' }}>{d.license_number}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{d.license_category || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}><LicenseExpiry expiry={d.license_expiry} days={d.days_until_expiry} /></td>
                    <td style={{ padding: '0.75rem 1rem' }}><SafetyBar score={d.safety_score} /></td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{d.contact_number || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}><StatusBadge status={d.status} /></td>
                    {canEdit && (
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => setModal(d)} title="Edit">✏️</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setStatusModal(d)} title="Change Status">🔄</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal !== null && <DriverModal driver={modal === 'add' ? null : modal} onSave={() => { setModal(null); load() }} onClose={() => setModal(null)} />}
      {statusModal && <StatusModal driver={statusModal} onSave={() => { setStatusModal(null); load() }} onClose={() => setStatusModal(null)} />}
    </div>
  )
}
