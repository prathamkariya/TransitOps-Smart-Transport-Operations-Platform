import { useState, useEffect, useCallback } from 'react'
import client from '../../api/client'

const STATUS_COLORS = { available: { bg: '#D4EDDA', color: '#155724' }, on_trip: { bg: '#D1ECF1', color: '#0C5460' }, off_duty: { bg: '#F0F0F0', color: '#555555' }, suspended: { bg: '#F8D7DA', color: '#721C24' } }
const DRIVER_STATUSES = ['available', 'on_trip', 'off_duty', 'suspended']
const LICENSE_CATS = ['LMV', 'HMV', 'HPMV', 'MGV', 'LMV-TR', 'PSV']
const thStyle = { padding: '0.625rem 1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', background: '#FAFAFA', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }
const tdStyle = { padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', verticalAlign: 'middle', fontSize: '0.875rem' }

function Badge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.off_duty
  return <span style={{ display: 'inline-block', padding: '0.1875rem 0.5rem', borderRadius: 4, fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', background: s.bg, color: s.color }}>{status?.replace('_', ' ')}</span>
}

function ScoreBar({ score }) {
  const color = score >= 80 ? '#155724' : score >= 50 ? '#856404' : '#721C24'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ width: 64, height: 5, background: '#E0E0E0', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 99 }} />
      </div>
      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color }}>{score}</span>
    </div>
  )
}

function ExpiryCell({ expiry, days }) {
  const expired = days < 0, warn = days >= 0 && days <= 30
  const color = expired ? '#721C24' : warn ? '#856404' : 'var(--color-text-muted)'
  return <span style={{ color, fontSize: '0.8125rem', fontWeight: expired || warn ? 600 : 400 }}>
    {expiry}{expired ? ' (expired)' : warn ? ` (${days}d)` : ''}
  </span>
}

function DriverModal({ driver, onSave, onClose }) {
  const isEdit = Boolean(driver?.id)
  const [form, setForm] = useState({ name: driver?.name ?? '', license_number: driver?.license_number ?? '', license_category: driver?.license_category ?? 'LMV', license_expiry: driver?.license_expiry ?? '', contact_number: driver?.contact_number ?? '', safety_score: driver?.safety_score ?? 100 })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const submit = async e => {
    e.preventDefault(); setSaving(true); setErr('')
    try {
      const p = { ...form, safety_score: +form.safety_score }
      isEdit ? await client.put(`/drivers/${driver.id}`, p) : await client.post('/drivers/', p)
      onSave()
    } catch (ex) { setErr(ex.response?.data?.detail || 'Save failed') }
    finally { setSaving(false) }
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div className="card" style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', borderRadius: 8 }}>
        <div style={{ borderBottom: '1px solid var(--color-border)', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>{isEdit ? 'Edit Driver' : 'Add Driver'}</h3>
        </div>
        {err && <div className="alert-banner alert-danger" style={{ margin: '0 1.25rem 1rem' }}>{err}</div>}
        <form onSubmit={submit} style={{ padding: '0 1.25rem 1.25rem' }}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div><label className="form-label">Full Name</label><input className="form-input" value={form.name} onChange={set('name')} required placeholder="Ramesh Kumar" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><label className="form-label">License No.</label><input className="form-input" value={form.license_number} onChange={set('license_number')} required disabled={isEdit} /></div>
              <div><label className="form-label">Category</label><select className="form-input" value={form.license_category} onChange={set('license_category')}>{LICENSE_CATS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><label className="form-label">License Expiry</label><input className="form-input" type="date" value={form.license_expiry} onChange={set('license_expiry')} required /></div>
              <div><label className="form-label">Contact</label><input className="form-input" type="tel" value={form.contact_number} onChange={set('contact_number')} placeholder="9XXXXXXXXX" /></div>
            </div>
            <div><label className="form-label">Safety Score (0–100)</label><input className="form-input" type="number" min="0" max="100" value={form.safety_score} onChange={set('safety_score')} /></div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : isEdit ? 'Update' : 'Add Driver'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function StatusModal({ driver, onSave, onClose }) {
  const [status, setStatus] = useState(driver.status)
  const [saving, setSaving] = useState(false)
  const save = async () => { setSaving(true); try { await client.patch(`/drivers/${driver.id}/status`, { status }); onSave() } catch {} finally { setSaving(false) } }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div className="card" style={{ width: '100%', maxWidth: 320, borderRadius: 8 }}>
        <div style={{ borderBottom: '1px solid var(--color-border)', padding: '1rem 1.25rem', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>Change Status — {driver.name}</h3>
        </div>
        <div style={{ padding: '0 1.25rem', display: 'grid', gap: '0.4rem', marginBottom: '1.25rem' }}>
          {DRIVER_STATUSES.map(s => (
            <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.75rem', borderRadius: 5, border: `1px solid ${status === s ? 'var(--color-accent)' : 'var(--color-border)'}`, cursor: 'pointer', background: status === s ? 'rgba(113,75,103,0.06)' : 'transparent' }}>
              <input type="radio" value={s} checked={status === s} onChange={() => setStatus(s)} />
              <Badge status={s} />
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', padding: '0 1.25rem 1.25rem' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? '...' : 'Update'}</button>
        </div>
      </div>
    </div>
  )
}

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
      const r = await client.get('/drivers/', { params })
      setDrivers(r.data)
    } catch {} finally { setLoading(false) }
  }, [filters])

  useEffect(() => { load() }, [load])

  const expired = drivers.filter(d => !d.is_license_valid).length
  const expiring = drivers.filter(d => d.days_until_expiry >= 0 && d.days_until_expiry <= 30).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.25rem' }}>Driver Management</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>Track drivers, licenses, and safety scores</p>
        </div>
        {canEdit && <button id="driver-add-btn" className="btn btn-primary" onClick={() => setModal('add')}>Add Driver</button>}
      </div>

      {expired > 0 && <div className="alert-banner alert-danger">{expired} driver license{expired > 1 ? 's' : ''} expired — action required</div>}
      {expiring > 0 && <div className="alert-banner alert-warning">{expiring} driver license{expiring > 1 ? 's' : ''} expiring within 30 days</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: '1rem' }}>
        {[['Total', drivers.length, 'var(--odoo-purple)'], ['Available', drivers.filter(d => d.status === 'available').length, 'var(--color-success)'], ['On Trip', drivers.filter(d => d.status === 'on_trip').length, 'var(--odoo-teal)'], ['Suspended', drivers.filter(d => d.status === 'suspended').length, 'var(--color-danger)']].map(([l, v, c]) => (
          <div key={l} className="kpi-card" style={{ '--accent-color': c }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 4 }}>{l}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: c, lineHeight: 1 }}>{v}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '0.875rem 1rem', display: 'flex', gap: '0.625rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '2 1 180px' }}><label className="form-label">Search</label><input className="form-input" placeholder="Name or license..." value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} /></div>
        <div style={{ flex: '1 1 110px' }}><label className="form-label">Status</label><select className="form-input" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}><option value="">All</option>{DRIVER_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select></div>
        <div style={{ flex: '1 1 110px' }}><label className="form-label">License Cat.</label><select className="form-input" value={filters.license_category} onChange={e => setFilters(f => ({ ...f, license_category: e.target.value }))}><option value="">All</option>{LICENSE_CATS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
        <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ search: '', status: '', license_category: '' })}>Clear</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="loading-spinner" /></div>
        : drivers.length === 0 ? <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}><p>No drivers found. {canEdit && 'Add one to get started.'}</p></div>
        : <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Name', 'License No.', 'Category', 'Expiry', 'Safety Score', 'Contact', 'Status', canEdit ? 'Actions' : ''].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
              <tbody>
                {drivers.map(d => (
                  <tr key={d.id} style={{ transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={tdStyle}><span style={{ fontWeight: 700 }}>{d.name}</span></td>
                    <td style={tdStyle}><span style={{ fontFamily: 'monospace', color: 'var(--odoo-purple)', fontSize: '0.8125rem' }}>{d.license_number}</span></td>
                    <td style={{ ...tdStyle, color: 'var(--color-text-muted)' }}>{d.license_category || '—'}</td>
                    <td style={tdStyle}><ExpiryCell expiry={d.license_expiry} days={d.days_until_expiry} /></td>
                    <td style={tdStyle}><ScoreBar score={d.safety_score} /></td>
                    <td style={{ ...tdStyle, color: 'var(--color-text-muted)' }}>{d.contact_number || '—'}</td>
                    <td style={tdStyle}><Badge status={d.status} /></td>
                    {canEdit && <td style={tdStyle}><div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setModal(d)}>Edit</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setStatusModal(d)}>Status</button>
                    </div></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
      </div>

      {modal !== null && <DriverModal driver={modal === 'add' ? null : modal} onSave={() => { setModal(null); load() }} onClose={() => setModal(null)} />}
      {statusModal && <StatusModal driver={statusModal} onSave={() => { setStatusModal(null); load() }} onClose={() => setStatusModal(null)} />}
    </div>
  )
}
