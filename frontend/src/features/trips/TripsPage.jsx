import { useState, useEffect, useCallback } from 'react'
import client from '../../api/client'

const STATUS_COLORS = { draft: { bg: '#F0F0F0', color: '#555' }, dispatched: { bg: '#D1ECF1', color: '#0C5460' }, completed: { bg: '#D4EDDA', color: '#155724' }, cancelled: { bg: '#F8D7DA', color: '#721C24' } }
const thStyle = { padding: '0.625rem 1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', background: '#FAFAFA', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }
const tdStyle = { padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', verticalAlign: 'middle', fontSize: '0.875rem' }

function Badge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.draft
  return <span style={{ display: 'inline-block', padding: '0.1875rem 0.5rem', borderRadius: 4, fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', background: s.bg, color: s.color }}>{status}</span>
}

function CreateTripModal({ vehicles, drivers, onSave, onClose }) {
  const [form, setForm] = useState({ source: '', destination: '', vehicle_id: '', driver_id: '', cargo_weight: '', distance: '', revenue: '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const submit = async e => {
    e.preventDefault(); setSaving(true); setErr('')
    try {
      await client.post('/trips/', { source: form.source, destination: form.destination, vehicle_id: +form.vehicle_id, driver_id: +form.driver_id, cargo_weight: +form.cargo_weight, distance: +form.distance, revenue: form.revenue ? +form.revenue : 0 })
      onSave()
    } catch (ex) { setErr(ex.response?.data?.detail || 'Failed to create trip') }
    finally { setSaving(false) }
  }
  const avVehicles = vehicles.filter(v => v.status === 'available')
  const avDrivers = drivers.filter(d => d.status === 'available')
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div className="card" style={{ width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', borderRadius: 8 }}>
        <div style={{ borderBottom: '1px solid var(--color-border)', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>Schedule New Trip</h3>
        </div>
        {err && <div className="alert-banner alert-danger" style={{ margin: '0 1.25rem 1rem' }}>{err}</div>}
        <form onSubmit={submit} style={{ padding: '0 1.25rem 1.25rem' }}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><label className="form-label">Source</label><input className="form-input" value={form.source} onChange={set('source')} required placeholder="e.g. Mumbai" /></div>
              <div><label className="form-label">Destination</label><input className="form-input" value={form.destination} onChange={set('destination')} required placeholder="e.g. Pune" /></div>
            </div>
            <div>
              <label className="form-label">Vehicle</label>
              <select className="form-input" value={form.vehicle_id} onChange={set('vehicle_id')} required>
                <option value="">Select available vehicle...</option>
                {avVehicles.map(v => <option key={v.id} value={v.id}>{v.reg_number} — {v.model_name} ({v.type})</option>)}
              </select>
              {avVehicles.length === 0 && <div style={{ fontSize: '0.75rem', color: 'var(--color-warning)', marginTop: 4 }}>No available vehicles</div>}
            </div>
            <div>
              <label className="form-label">Driver</label>
              <select className="form-input" value={form.driver_id} onChange={set('driver_id')} required>
                <option value="">Select available driver...</option>
                {avDrivers.map(d => <option key={d.id} value={d.id}>{d.name} — {d.license_number}</option>)}
              </select>
              {avDrivers.length === 0 && <div style={{ fontSize: '0.75rem', color: 'var(--color-warning)', marginTop: 4 }}>No available drivers</div>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div><label className="form-label">Cargo (t)</label><input className="form-input" type="number" min="0.01" step="0.01" value={form.cargo_weight} onChange={set('cargo_weight')} required /></div>
              <div><label className="form-label">Distance (km)</label><input className="form-input" type="number" min="1" value={form.distance} onChange={set('distance')} required /></div>
              <div><label className="form-label">Revenue (₹)</label><input className="form-input" type="number" min="0" value={form.revenue} onChange={set('revenue')} /></div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Schedule Trip'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CompleteModal({ trip, onSave, onClose }) {
  const [odometer, setOdometer] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const handle = async () => {
    if (!odometer) { setErr('Odometer reading is required'); return }
    setSaving(true); setErr('')
    try { await client.post(`/trips/${trip.id}/complete`, null, { params: { final_odometer: +odometer } }); onSave() }
    catch (ex) { setErr(ex.response?.data?.detail || 'Failed') }
    finally { setSaving(false) }
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div className="card" style={{ width: '100%', maxWidth: 380, borderRadius: 8 }}>
        <div style={{ borderBottom: '1px solid var(--color-border)', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>Complete Trip #{trip.id}</h3>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>{trip.source} → {trip.destination}</p>
        </div>
        {err && <div className="alert-banner alert-danger" style={{ margin: '0 1.25rem 1rem' }}>{err}</div>}
        <div style={{ padding: '0 1.25rem 1.25rem' }}>
          <label className="form-label">Final Odometer Reading (km)</label>
          <input className="form-input" type="number" min="0" value={odometer} onChange={e => setOdometer(e.target.value)} placeholder="Current odometer" style={{ marginBottom: '1.25rem' }} />
          <div className="alert-banner alert-success" style={{ marginBottom: '1rem', fontSize: '0.8125rem' }}>
            Completing this trip will restore the vehicle and driver to Available status.
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handle} disabled={saving} style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)' }}>{saving ? '...' : 'Mark Complete'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TripsPage({ userRole }) {
  const canCreate = ['fleet_manager', 'dispatcher'].includes(userRole)
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
      const [tR, vR, dR] = await Promise.all([client.get('/trips/'), client.get('/vehicles/'), client.get('/drivers/')])
      setTrips(tR.data); setVehicles(vR.data); setDrivers(dR.data)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const doAction = async (trip, action) => {
    setActing(trip.id + action)
    try {
      if (action === 'dispatch') await client.post(`/trips/${trip.id}/dispatch`)
      if (action === 'cancel') { if (!window.confirm('Cancel this trip?')) return; await client.post(`/trips/${trip.id}/cancel`) }
      await load()
    } catch (ex) { alert(ex.response?.data?.detail || `Failed to ${action}`) }
    finally { setActing(null) }
  }

  const filtered = filterStatus ? trips.filter(t => t.status === filterStatus) : trips
  const getVehicle = id => vehicles.find(v => v.id === id)
  const getDriver = id => drivers.find(d => d.id === id)
  const counts = trips.reduce((a, t) => { a[t.status] = (a[t.status] || 0) + 1; return a }, { draft: 0, dispatched: 0, completed: 0, cancelled: 0 })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.25rem' }}>Trip Management</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>Schedule, dispatch and complete trips</p>
        </div>
        {canCreate && <button id="trip-create-btn" className="btn btn-primary" onClick={() => setCreateModal(true)}>Schedule Trip</button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px,1fr))', gap: '1rem' }}>
        {[['Total', trips.length, '#444'], ['Draft', counts.draft, '#555'], ['Dispatched', counts.dispatched, 'var(--odoo-teal)'], ['Completed', counts.completed, 'var(--color-success)'], ['Cancelled', counts.cancelled, 'var(--color-danger)']].map(([l, v, c]) => (
          <div key={l} className="kpi-card" style={{ '--accent-color': c, cursor: 'pointer' }} onClick={() => setFilterStatus(filterStatus === l.toLowerCase() ? '' : l.toLowerCase())}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 4 }}>{l}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: c, lineHeight: 1 }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
        {['', 'draft', 'dispatched', 'completed', 'cancelled'].map(s => (
          <button key={s || 'all'} onClick={() => setFilterStatus(s)}
            className="btn btn-secondary btn-sm"
            style={{ borderColor: filterStatus === s ? 'var(--color-accent)' : undefined, color: filterStatus === s ? 'var(--color-accent)' : undefined }}>
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="loading-spinner" /></div>
        : filtered.length === 0 ? <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}><p>No trips found. {canCreate && 'Schedule one to get started.'}</p></div>
        : <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['#', 'Route', 'Vehicle', 'Driver', 'Cargo', 'Distance', 'Revenue', 'Status', 'Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map(t => {
                  const veh = getVehicle(t.vehicle_id), drv = getDriver(t.driver_id)
                  return (
                    <tr key={t.id} style={{ transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ ...tdStyle, color: 'var(--color-text-muted)', fontWeight: 600 }}>#{t.id}</td>
                      <td style={tdStyle}><span style={{ fontWeight: 600 }}>{t.source}</span><span style={{ color: 'var(--color-text-muted)', margin: '0 0.25rem' }}>→</span><span style={{ fontWeight: 600 }}>{t.destination}</span></td>
                      <td style={{ ...tdStyle, color: 'var(--odoo-purple)', fontWeight: 600 }}>{veh?.reg_number || `#${t.vehicle_id}`}</td>
                      <td style={tdStyle}>{drv?.name || `#${t.driver_id}`}</td>
                      <td style={{ ...tdStyle, color: 'var(--color-text-muted)' }}>{t.cargo_weight} t</td>
                      <td style={{ ...tdStyle, color: 'var(--color-text-muted)' }}>{t.distance || t.planned_distance} km</td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--color-success)' }}>{t.revenue ? `₹${Number(t.revenue).toLocaleString('en-IN')}` : '—'}</td>
                      <td style={tdStyle}><Badge status={t.status} /></td>
                      <td style={tdStyle}>
                        {canCreate && t.status === 'draft' && <button className="btn btn-secondary btn-sm" onClick={() => doAction(t, 'dispatch')} disabled={acting === t.id + 'dispatch'} style={{ color: 'var(--odoo-teal)', borderColor: 'var(--odoo-teal)' }}>{acting === t.id + 'dispatch' ? '...' : 'Dispatch'}</button>}
                        {canCreate && t.status === 'dispatched' && <div style={{ display: 'flex', gap: '0.375rem' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => setCompleteModal(t)} style={{ color: 'var(--color-success)', borderColor: 'var(--color-success)' }}>Complete</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => doAction(t, 'cancel')} disabled={acting === t.id + 'cancel'} style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>{acting === t.id + 'cancel' ? '...' : 'Cancel'}</button>
                        </div>}
                        {(t.status === 'completed' || t.status === 'cancelled') && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>}
      </div>

      {createModal && <CreateTripModal vehicles={vehicles} drivers={drivers} onSave={() => { setCreateModal(false); load() }} onClose={() => setCreateModal(false)} />}
      {completeModal && <CompleteModal trip={completeModal} onSave={() => { setCompleteModal(null); load() }} onClose={() => setCompleteModal(null)} />}
    </div>
  )
}
