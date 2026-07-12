import { useState, useEffect, useCallback } from 'react'
import client from '../../api/client'

const STATUS_STYLE = {
  draft:       { bg: 'rgba(100,116,139,0.12)', color: '#64748b' },
  dispatched:  { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6' },
  completed:   { bg: 'rgba(34,197,94,0.12)',   color: '#22c55e' },
  cancelled:   { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
}

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.draft
  return (
    <span style={{ display: 'inline-block', padding: '0.2rem 0.65rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', background: s.bg, color: s.color }}>
      {status}
    </span>
  )
}

// ── Create Trip Modal ──────────────────────────────────────────────────────
function CreateTripModal({ vehicles, drivers, onSave, onClose }) {
  const [form, setForm] = useState({ source: '', destination: '', vehicle_id: '', driver_id: '', cargo_weight: '', distance: '', revenue: '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setErr('')
    try {
      await client.post('/trips/', {
        source: form.source,
        destination: form.destination,
        vehicle_id: Number(form.vehicle_id),
        driver_id: Number(form.driver_id),
        cargo_weight: Number(form.cargo_weight),
        distance: Number(form.distance),
        revenue: form.revenue ? Number(form.revenue) : 0,
      })
      onSave()
    } catch (ex) { setErr(ex.response?.data?.detail || 'Failed to create trip') }
    finally { setSaving(false) }
  }

  const availableVehicles = vehicles.filter((v) => v.status === 'available')
  const availableDrivers = drivers.filter((d) => d.status === 'available')

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: '1rem', border: '1px solid var(--color-border)', padding: '2rem', width: '100%', maxWidth: 540, boxShadow: 'var(--shadow-lg)', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.125rem', fontWeight: 700 }}>🗺️ Schedule New Trip</h2>
        {err && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid #ef4444', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem', color: '#ef4444', fontSize: '0.875rem' }}>⚠️ {err}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Source *</label>
                <input className="form-input" value={form.source} onChange={set('source')} required placeholder="e.g. Mumbai" />
              </div>
              <div>
                <label className="form-label">Destination *</label>
                <input className="form-input" value={form.destination} onChange={set('destination')} required placeholder="e.g. Pune" />
              </div>
            </div>
            <div>
              <label className="form-label">Vehicle *</label>
              <select className="form-input" value={form.vehicle_id} onChange={set('vehicle_id')} required>
                <option value="">Select available vehicle…</option>
                {availableVehicles.map((v) => <option key={v.id} value={v.id}>{v.reg_number} — {v.model_name} ({v.type})</option>)}
              </select>
              {availableVehicles.length === 0 && <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: 4 }}>⚠️ No available vehicles</div>}
            </div>
            <div>
              <label className="form-label">Driver *</label>
              <select className="form-input" value={form.driver_id} onChange={set('driver_id')} required>
                <option value="">Select available driver…</option>
                {availableDrivers.map((d) => <option key={d.id} value={d.id}>{d.name} — {d.license_number}</option>)}
              </select>
              {availableDrivers.length === 0 && <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: 4 }}>⚠️ No available drivers</div>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Cargo (tonnes) *</label>
                <input className="form-input" type="number" min="0.01" step="0.01" value={form.cargo_weight} onChange={set('cargo_weight')} required />
              </div>
              <div>
                <label className="form-label">Distance (km) *</label>
                <input className="form-input" type="number" min="1" value={form.distance} onChange={set('distance')} required />
              </div>
              <div>
                <label className="form-label">Revenue (₹)</label>
                <input className="form-input" type="number" min="0" step="0.01" value={form.revenue} onChange={set('revenue')} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Schedule Trip'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Complete Trip Modal ────────────────────────────────────────────────────
function CompleteTripModal({ trip, onSave, onClose }) {
  const [odometer, setOdometer] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const handleComplete = async () => {
    if (!odometer) { setErr('Final odometer reading is required'); return }
    setSaving(true); setErr('')
    try {
      await client.post(`/trips/${trip.id}/complete`, null, { params: { final_odometer: Number(odometer) } })
      onSave()
    } catch (ex) { setErr(ex.response?.data?.detail || 'Failed') }
    finally { setSaving(false) }
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: '1rem', border: '1px solid var(--color-border)', padding: '2rem', width: '100%', maxWidth: 380, boxShadow: 'var(--shadow-lg)' }}>
        <h3 style={{ margin: '0 0 0.5rem', fontWeight: 700 }}>✅ Complete Trip #{trip.id}</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: '0 0 1.25rem' }}>{trip.source} → {trip.destination}</p>
        {err && <div style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '0.75rem' }}>⚠️ {err}</div>}
        <label className="form-label">Final Odometer Reading (km) *</label>
        <input className="form-input" type="number" min="0" value={odometer} onChange={(e) => setOdometer(e.target.value)} placeholder="Current odometer reading" style={{ marginBottom: '1.25rem' }} />
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleComplete} disabled={saving} style={{ background: '#22c55e', border: 'none' }}>{saving ? '…' : 'Mark Complete'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function TripsPage({ userRole }) {
  const canCreate = ['fleet_manager', 'dispatcher'].includes(userRole)
  const canDispatch = ['fleet_manager', 'dispatcher'].includes(userRole)
  const [trips, setTrips] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [createModal, setCreateModal] = useState(false)
  const [completeModal, setCompleteModal] = useState(null)
  const [acting, setActing] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [tRes, vRes, dRes] = await Promise.all([
        client.get('/trips/'),
        client.get('/vehicles/'),
        client.get('/drivers/'),
      ])
      setTrips(tRes.data)
      setVehicles(vRes.data)
      setDrivers(dRes.data)
    } catch { } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const doAction = async (trip, action) => {
    setActing(trip.id + action)
    try {
      if (action === 'dispatch') await client.post(`/trips/${trip.id}/dispatch`)
      if (action === 'cancel') {
        if (!window.confirm('Cancel this trip?')) return
        await client.post(`/trips/${trip.id}/cancel`)
      }
      await load()
    } catch (ex) { alert(ex.response?.data?.detail || `Failed to ${action}`) }
    finally { setActing(null) }
  }

  const filtered = filterStatus ? trips.filter((t) => t.status === filterStatus) : trips

  const getVehicle = (id) => vehicles.find((v) => v.id === id)
  const getDriver = (id) => drivers.find((d) => d.id === id)

  const counts = { total: trips.length, draft: 0, dispatched: 0, completed: 0, cancelled: 0 }
  trips.forEach((t) => { if (counts[t.status] !== undefined) counts[t.status]++ })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.375rem' }}>🗺️ Trip Management</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Schedule, dispatch and complete trips</p>
        </div>
        {canCreate && <button id="trip-create-btn" className="btn btn-primary" onClick={() => setCreateModal(true)}>+ Schedule Trip</button>}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px,1fr))', gap: '1rem' }}>
        {[
          { label: 'Total', value: counts.total, color: 'var(--color-text-muted)' },
          { label: 'Draft', value: counts.draft, color: '#64748b' },
          { label: 'Dispatched', value: counts.dispatched, color: '#3b82f6' },
          { label: 'Completed', value: counts.completed, color: '#22c55e' },
          { label: 'Cancelled', value: counts.cancelled, color: '#ef4444' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: '1rem 1.25rem', cursor: 'pointer' }}
            onClick={() => setFilterStatus(filterStatus === s.label.toLowerCase() ? '' : s.label.toLowerCase())}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter strip */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {['', 'draft', 'dispatched', 'completed', 'cancelled'].map((s) => (
          <button key={s || 'all'} onClick={() => setFilterStatus(s)}
            style={{ padding: '0.375rem 0.875rem', borderRadius: 999, fontSize: '0.8125rem', fontWeight: 600, border: `1.5px solid ${filterStatus === s ? 'var(--color-accent)' : 'var(--color-border)'}`, background: filterStatus === s ? 'rgba(59,130,246,0.1)' : 'transparent', color: filterStatus === s ? 'var(--color-accent)' : 'var(--color-text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}>
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="loading-spinner" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🗺️</div>
            <p>No trips found. {canCreate && 'Schedule one to get started.'}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.03)' }}>
                  {['#', 'Route', 'Vehicle', 'Driver', 'Cargo', 'Distance', 'Revenue', 'Status', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => {
                  const veh = getVehicle(t.vehicle_id)
                  const drv = getDriver(t.driver_id)
                  return (
                    <tr key={t.id}
                      style={{ borderBottom: '1px solid var(--color-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)'}
                    >
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>#{t.id}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ fontWeight: 700 }}>{t.source}</span>
                        <span style={{ color: 'var(--color-text-muted)', margin: '0 0.25rem' }}>→</span>
                        <span style={{ fontWeight: 700 }}>{t.destination}</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-accent)', fontWeight: 600 }}>{veh?.reg_number || `#${t.vehicle_id}`}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{drv?.name || `#${t.driver_id}`}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{t.cargo_weight} t</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{t.distance || t.planned_distance} km</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#22c55e' }}>
                        {t.revenue ? `₹${Number(t.revenue).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}><StatusBadge status={t.status} /></td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {canDispatch && t.status === 'draft' && (
                          <button className="btn btn-sm" onClick={() => doAction(t, 'dispatch')}
                            disabled={acting === t.id + 'dispatch'}
                            style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', marginRight: 4 }}>
                            {acting === t.id + 'dispatch' ? '…' : '▶ Dispatch'}
                          </button>
                        )}
                        {canDispatch && t.status === 'dispatched' && (
                          <>
                            <button className="btn btn-sm" onClick={() => setCompleteModal(t)}
                              style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', marginRight: 4 }}>
                              ✅ Complete
                            </button>
                            <button className="btn btn-sm" onClick={() => doAction(t, 'cancel')}
                              disabled={acting === t.id + 'cancel'}
                              style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                              {acting === t.id + 'cancel' ? '…' : '✕ Cancel'}
                            </button>
                          </>
                        )}
                        {(t.status === 'completed' || t.status === 'cancelled') && (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {createModal && <CreateTripModal vehicles={vehicles} drivers={drivers} onSave={() => { setCreateModal(false); load() }} onClose={() => setCreateModal(false)} />}
      {completeModal && <CompleteTripModal trip={completeModal} onSave={() => { setCompleteModal(null); load() }} onClose={() => setCompleteModal(null)} />}
    </div>
  )
}
