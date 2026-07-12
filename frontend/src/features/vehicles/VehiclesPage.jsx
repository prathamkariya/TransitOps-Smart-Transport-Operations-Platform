import { useState, useEffect, useCallback } from 'react'
import client from '../../api/client'

const STATUS_COLORS = {
  available: { bg: '#D4EDDA', color: '#155724' },
  on_trip:   { bg: '#D1ECF1', color: '#0C5460' },
  in_shop:   { bg: '#FFF3CD', color: '#856404' },
  retired:   { bg: '#F0F0F0', color: '#555555' },
}
const VEHICLE_TYPES    = ['truck', 'van', 'sedan', 'bus', 'motorcycle', 'other']
const VEHICLE_STATUSES = ['available', 'on_trip', 'in_shop', 'retired']

const thStyle = { padding: '0.625rem 1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', background: '#FAFAFA', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }
const tdStyle = { padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', verticalAlign: 'middle', fontSize: '0.875rem' }

function Badge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.retired
  return <span style={{ display: 'inline-block', padding: '0.1875rem 0.5rem', borderRadius: 4, fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', background: s.bg, color: s.color }}>{status?.replace('_', ' ')}</span>
}

function Modal({ vehicle, onSave, onClose }) {
  const isEdit = Boolean(vehicle?.id)
  const [form, setForm] = useState({
    reg_number: vehicle?.reg_number ?? '', model_name: vehicle?.model_name ?? '',
    type: vehicle?.type ?? 'truck', max_load_capacity: vehicle?.max_load_capacity ?? '',
    acquisition_cost: vehicle?.acquisition_cost ?? '', region: vehicle?.region ?? '',
    odometer: vehicle?.odometer ?? 0,
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault(); setSaving(true); setErr('')
    try {
      const p = { ...form, max_load_capacity: +form.max_load_capacity, acquisition_cost: +form.acquisition_cost, odometer: +form.odometer }
      isEdit ? await client.put(`/vehicles/${vehicle.id}`, p) : await client.post('/vehicles/', p)
      onSave()
    } catch (ex) { setErr(ex.response?.data?.detail || 'Save failed') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div className="card" style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', borderRadius: 8 }}>
        <div style={{ borderBottom: '1px solid var(--color-border)', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>{isEdit ? 'Edit Vehicle' : 'Add Vehicle'}</h3>
        </div>
        {err && <div className="alert-banner alert-danger" style={{ margin: '0 1.25rem 1rem' }}>{err}</div>}
        <form onSubmit={submit} style={{ padding: '0 1.25rem 1.25rem' }}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><label className="form-label">Registration No.</label><input className="form-input" value={form.reg_number} onChange={set('reg_number')} required disabled={isEdit} placeholder="MH12AB1234" /></div>
              <div><label className="form-label">Model Name</label><input className="form-input" value={form.model_name} onChange={set('model_name')} required placeholder="Tata Ace" /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><label className="form-label">Type</label><select className="form-input" value={form.type} onChange={set('type')}>{VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><label className="form-label">Region</label><input className="form-input" value={form.region} onChange={set('region')} required placeholder="Mumbai North" /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><label className="form-label">Load Capacity (t)</label><input className="form-input" type="number" min="0.1" step="0.1" value={form.max_load_capacity} onChange={set('max_load_capacity')} required /></div>
              <div><label className="form-label">Acquisition Cost (₹)</label><input className="form-input" type="number" min="1" value={form.acquisition_cost} onChange={set('acquisition_cost')} required /></div>
            </div>
            {isEdit && <div><label className="form-label">Odometer (km)</label><input className="form-input" type="number" min="0" value={form.odometer} onChange={set('odometer')} /></div>}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : isEdit ? 'Update' : 'Add Vehicle'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function StatusModal({ vehicle, onSave, onClose }) {
  const [status, setStatus] = useState(vehicle.status)
  const [saving, setSaving] = useState(false)
  const save = async () => { setSaving(true); try { await client.patch(`/vehicles/${vehicle.id}/status`, { status }); onSave() } catch {} finally { setSaving(false) } }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div className="card" style={{ width: '100%', maxWidth: 340, borderRadius: 8 }}>
        <div style={{ borderBottom: '1px solid var(--color-border)', padding: '1rem 1.25rem', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>Change Status — {vehicle.reg_number}</h3>
        </div>
        <div style={{ padding: '0 1.25rem', display: 'grid', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {VEHICLE_STATUSES.map(s => (
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

export default function VehiclesPage({ userRole }) {
  const canEdit = userRole === 'fleet_manager'
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
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
      const r = await client.get('/vehicles/', { params })
      setVehicles(r.data)
    } catch {} finally { setLoading(false) }
  }, [filters])

  useEffect(() => { load() }, [load])

  const stats = { total: vehicles.length, available: vehicles.filter(v => v.status === 'available').length, on_trip: vehicles.filter(v => v.status === 'on_trip').length, in_shop: vehicles.filter(v => v.status === 'in_shop').length }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.25rem' }}>Fleet Vehicles</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>Manage and track your entire vehicle fleet</p>
        </div>
        {canEdit && <button id="vehicle-add-btn" className="btn btn-primary" onClick={() => setModal('add')}>Add Vehicle</button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: '1rem' }}>
        {[['Total Fleet', stats.total, 'var(--odoo-purple)'], ['Available', stats.available, 'var(--color-success)'], ['On Trip', stats.on_trip, 'var(--odoo-teal)'], ['In Shop', stats.in_shop, 'var(--color-warning)']].map(([l, v, c]) => (
          <div key={l} className="kpi-card" style={{ '--accent-color': c }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 4 }}>{l}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: c, lineHeight: 1 }}>{v}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '0.875rem 1rem', display: 'flex', gap: '0.625rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '2 1 180px' }}><label className="form-label">Search</label><input className="form-input" placeholder="Reg number or model..." value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} /></div>
        <div style={{ flex: '1 1 110px' }}><label className="form-label">Status</label><select className="form-input" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}><option value="">All</option>{VEHICLE_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select></div>
        <div style={{ flex: '1 1 110px' }}><label className="form-label">Type</label><select className="form-input" value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}><option value="">All</option>{VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
        <div style={{ flex: '1 1 110px' }}><label className="form-label">Region</label><input className="form-input" placeholder="Region..." value={filters.region} onChange={e => setFilters(f => ({ ...f, region: e.target.value }))} /></div>
        <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ search: '', status: '', type: '', region: '' })}>Clear</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="loading-spinner" /></div>
        : vehicles.length === 0 ? <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}><p>No vehicles found. {canEdit && 'Add one to get started.'}</p></div>
        : <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Reg No.', 'Model', 'Type', 'Region', 'Capacity', 'Odometer', 'Status', canEdit ? 'Actions' : ''].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
              <tbody>
                {vehicles.map(v => (
                  <tr key={v.id} style={{ transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={tdStyle}><span style={{ fontWeight: 700, color: 'var(--odoo-purple)' }}>{v.reg_number}</span></td>
                    <td style={tdStyle}>{v.model_name}</td>
                    <td style={tdStyle} className="text-muted">{v.type}</td>
                    <td style={tdStyle} className="text-muted">{v.region}</td>
                    <td style={tdStyle}>{v.max_load_capacity} t</td>
                    <td style={tdStyle} className="text-muted">{v.odometer?.toLocaleString()} km</td>
                    <td style={tdStyle}><Badge status={v.status} /></td>
                    {canEdit && <td style={tdStyle}><div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setModal(v)}>Edit</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setStatusModal(v)}>Status</button>
                    </div></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
      </div>

      {modal !== null && <Modal vehicle={modal === 'add' ? null : modal} onSave={() => { setModal(null); load() }} onClose={() => setModal(null)} />}
      {statusModal && <StatusModal vehicle={statusModal} onSave={() => { setStatusModal(null); load() }} onClose={() => setStatusModal(null)} />}
    </div>
  )
}
