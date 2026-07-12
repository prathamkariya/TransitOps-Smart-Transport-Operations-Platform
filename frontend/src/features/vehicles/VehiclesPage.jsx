import { useState, useEffect, useCallback } from 'react'
import client from '../../api/client'

const STATUS_STYLE = {
  available:     { bg: 'rgba(34,197,94,0.12)',   color: '#22c55e' },
  on_trip:       { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6' },
  in_shop:       { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
  retired:       { bg: 'rgba(100,116,139,0.12)', color: '#64748b' },
}

const VEHICLE_TYPES = ['truck', 'van', 'sedan', 'bus', 'motorcycle', 'other']
const VEHICLE_STATUSES = ['available', 'on_trip', 'in_shop', 'retired']

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.retired
  return (
    <span style={{
      display: 'inline-block', padding: '0.2rem 0.65rem', borderRadius: 999,
      fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
      background: s.bg, color: s.color,
    }}>{status?.replace('_', ' ')}</span>
  )
}

// ── Add/Edit Modal ─────────────────────────────────────────────────────────
function VehicleModal({ vehicle, onSave, onClose }) {
  const isEdit = Boolean(vehicle?.id)
  const [form, setForm] = useState({
    reg_number: vehicle?.reg_number ?? '',
    model_name: vehicle?.model_name ?? '',
    type: vehicle?.type ?? 'truck',
    max_load_capacity: vehicle?.max_load_capacity ?? '',
    acquisition_cost: vehicle?.acquisition_cost ?? '',
    region: vehicle?.region ?? '',
    odometer: vehicle?.odometer ?? 0,
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true); setErr('')
    try {
      const payload = {
        ...form,
        max_load_capacity: Number(form.max_load_capacity),
        acquisition_cost: Number(form.acquisition_cost),
        odometer: Number(form.odometer),
      }
      if (isEdit) {
        await client.put(`/vehicles/${vehicle.id}`, payload)
      } else {
        await client.post('/vehicles/', payload)
      }
      onSave()
    } catch (ex) {
      setErr(ex.response?.data?.detail || 'Save failed')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: '1rem', border: '1px solid var(--color-border)', padding: '2rem', width: '100%', maxWidth: 520, boxShadow: 'var(--shadow-lg)', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.125rem', fontWeight: 700 }}>
          {isEdit ? '✏️ Edit Vehicle' : '🚛 Add Vehicle'}
        </h2>
        {err && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid #ef4444', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem', color: '#ef4444', fontSize: '0.875rem' }}>⚠️ {err}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Registration No. *</label>
                <input className="form-input" value={form.reg_number} onChange={set('reg_number')} required disabled={isEdit} placeholder="e.g. MH12AB1234" />
              </div>
              <div>
                <label className="form-label">Model Name *</label>
                <input className="form-input" value={form.model_name} onChange={set('model_name')} required placeholder="e.g. Tata Ace" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Type *</label>
                <select className="form-input" value={form.type} onChange={set('type')}>
                  {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Region *</label>
                <input className="form-input" value={form.region} onChange={set('region')} required placeholder="e.g. Mumbai North" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Load Capacity (tonnes) *</label>
                <input className="form-input" type="number" min="0.1" step="0.1" value={form.max_load_capacity} onChange={set('max_load_capacity')} required />
              </div>
              <div>
                <label className="form-label">Acquisition Cost (₹) *</label>
                <input className="form-input" type="number" min="1" value={form.acquisition_cost} onChange={set('acquisition_cost')} required />
              </div>
            </div>
            {isEdit && (
              <div>
                <label className="form-label">Odometer (km)</label>
                <input className="form-input" type="number" min="0" value={form.odometer} onChange={set('odometer')} />
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Update' : 'Add Vehicle'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Status Change Modal ────────────────────────────────────────────────────
function StatusModal({ vehicle, onSave, onClose }) {
  const [status, setStatus] = useState(vehicle.status)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const handleSave = async () => {
    setSaving(true); setErr('')
    try {
      await client.patch(`/vehicles/${vehicle.id}/status`, { status })
      onSave()
    } catch (ex) { setErr(ex.response?.data?.detail || 'Failed') }
    finally { setSaving(false) }
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: '1rem', border: '1px solid var(--color-border)', padding: '2rem', width: '100%', maxWidth: 360, boxShadow: 'var(--shadow-lg)' }}>
        <h3 style={{ margin: '0 0 1rem', fontWeight: 700 }}>Change Status — {vehicle.reg_number}</h3>
        {err && <div style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '0.75rem' }}>⚠️ {err}</div>}
        <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {VEHICLE_STATUSES.map((s) => (
            <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.875rem', borderRadius: '0.5rem', border: `1.5px solid ${status === s ? 'var(--color-accent)' : 'var(--color-border)'}`, cursor: 'pointer', background: status === s ? 'rgba(59,130,246,0.07)' : 'transparent' }}>
              <input type="radio" value={s} checked={status === s} onChange={() => setStatus(s)} style={{ accentColor: 'var(--color-accent)' }} />
              <StatusBadge status={s} />
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Update Status'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function VehiclesPage({ userRole }) {
  const canEdit = userRole === 'fleet_manager'
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)       // null | 'add' | vehicle obj
  const [statusModal, setStatusModal] = useState(null)
  const [filters, setFilters] = useState({ search: '', status: '', type: '', region: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.search) params.search = filters.search
      if (filters.status) params.status = filters.status
      if (filters.type) params.type = filters.type
      if (filters.region) params.region = filters.region
      const res = await client.get('/vehicles/', { params })
      setVehicles(res.data)
    } catch { } finally { setLoading(false) }
  }, [filters])

  useEffect(() => { load() }, [load])

  const stats = {
    total: vehicles.length,
    available: vehicles.filter((v) => v.status === 'available').length,
    on_trip: vehicles.filter((v) => v.status === 'on_trip').length,
    in_shop: vehicles.filter((v) => v.status === 'in_shop').length,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.375rem' }}>🚛 Fleet Vehicles</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Manage and track your entire vehicle fleet</p>
        </div>
        {canEdit && <button id="vehicle-add-btn" className="btn btn-primary" onClick={() => setModal('add')}>+ Add Vehicle</button>}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: '1rem' }}>
        {[
          { label: 'Total Fleet', value: stats.total, color: 'var(--color-accent)' },
          { label: 'Available', value: stats.available, color: '#22c55e' },
          { label: 'On Trip', value: stats.on_trip, color: '#3b82f6' },
          { label: 'In Shop', value: stats.in_shop, color: '#f59e0b' },
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
          <input className="form-input" placeholder="Reg number or model…" value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} />
        </div>
        <div style={{ flex: '1 1 130px' }}>
          <label className="form-label">Status</label>
          <select className="form-input" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
            <option value="">All</option>
            {VEHICLE_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div style={{ flex: '1 1 130px' }}>
          <label className="form-label">Type</label>
          <select className="form-input" value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>
            <option value="">All</option>
            {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ flex: '1 1 130px' }}>
          <label className="form-label">Region</label>
          <input className="form-input" placeholder="Filter region…" value={filters.region} onChange={(e) => setFilters((f) => ({ ...f, region: e.target.value }))} />
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ search: '', status: '', type: '', region: '' })}>Clear</button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="loading-spinner" /></div>
        ) : vehicles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🚛</div>
            <p>No vehicles found. {canEdit && 'Add one to get started.'}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.03)' }}>
                  {['Reg No.', 'Model', 'Type', 'Region', 'Capacity', 'Odometer', 'Status', canEdit ? 'Actions' : ''].map((h) => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v, i) => (
                  <tr key={v.id}
                    style={{ borderBottom: '1px solid var(--color-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)'}
                  >
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--color-accent)' }}>{v.reg_number}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{v.model_name}</td>
                    <td style={{ padding: '0.75rem 1rem', textTransform: 'capitalize' }}>{v.type}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{v.region}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{v.max_load_capacity} t</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{v.odometer?.toLocaleString()} km</td>
                    <td style={{ padding: '0.75rem 1rem' }}><StatusBadge status={v.status} /></td>
                    {canEdit && (
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => setModal(v)} title="Edit">✏️</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setStatusModal(v)} title="Change Status">🔄</button>
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

      {/* Modals */}
      {modal !== null && (
        <VehicleModal vehicle={modal === 'add' ? null : modal} onSave={() => { setModal(null); load() }} onClose={() => setModal(null)} />
      )}
      {statusModal && (
        <StatusModal vehicle={statusModal} onSave={() => { setStatusModal(null); load() }} onClose={() => setStatusModal(null)} />
      )}
    </div>
  )
}
