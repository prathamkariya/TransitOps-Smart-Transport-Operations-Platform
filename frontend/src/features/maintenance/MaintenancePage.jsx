import { useState, useEffect, useCallback } from 'react'
import client from '../../api/client'

const MAINT_TYPES = ['Scheduled Service', 'Repair', 'Inspection', 'Tyre Change', 'Oil Change', 'Brake Service', 'Other']

const thStyle = { padding: '0.625rem 1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', background: '#FAFAFA', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }
const tdStyle = { padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', verticalAlign: 'middle', fontSize: '0.875rem' }

function StatusBadge({ closed }) {
  return closed
    ? <span style={{ display: 'inline-block', padding: '0.1875rem 0.5rem', borderRadius: 4, fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', background: '#D4EDDA', color: '#155724' }}>Closed</span>
    : <span style={{ display: 'inline-block', padding: '0.1875rem 0.5rem', borderRadius: 4, fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', background: '#FFF3CD', color: '#856404' }}>Open</span>
}

function fmtDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function OpenModal({ vehicles, onSave, onClose }) {
  const [form, setForm] = useState({ vehicle_id: '', type: 'Scheduled Service', cost: '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const eligible = vehicles.filter(v => v.status !== 'on_trip' && v.status !== 'retired')
  const submit = async e => {
    e.preventDefault(); setSaving(true); setErr('')
    try {
      await client.post('/maintenance/', { vehicle_id: +form.vehicle_id, type: form.type, cost: form.cost ? +form.cost : 0 })
      onSave()
    } catch (ex) { setErr(ex.response?.data?.detail || 'Failed') }
    finally { setSaving(false) }
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div className="card" style={{ width: '100%', maxWidth: 460, borderRadius: 8 }}>
        <div style={{ borderBottom: '1px solid var(--color-border)', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>Open Maintenance Log</h3>
        </div>
        {err && <div className="alert-banner alert-danger" style={{ margin: '0 1.25rem 1rem' }}>{err}</div>}
        <form onSubmit={submit} style={{ padding: '0 1.25rem 1.25rem', display: 'grid', gap: '1rem' }}>
          <div>
            <label className="form-label">Vehicle</label>
            <select className="form-input" value={form.vehicle_id} onChange={set('vehicle_id')} required>
              <option value="">Select vehicle...</option>
              {eligible.map(v => <option key={v.id} value={v.id}>{v.reg_number} — {v.model_name} ({v.status})</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Maintenance Type</label>
            <select className="form-input" value={form.type} onChange={set('type')}>
              {MAINT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Estimated Cost (₹)</label>
            <input className="form-input" type="number" min="0" value={form.cost} onChange={set('cost')} placeholder="0" />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Opening...' : 'Open Log'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CloseModal({ log, onSave, onClose }) {
  const [cost, setCost] = useState(log.cost || '')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const handle = async () => {
    setSaving(true)
    try { await client.patch(`/maintenance/${log.id}/close`, { final_cost: +cost, notes }); onSave() }
    catch (ex) { alert(ex.response?.data?.detail || 'Failed') }
    finally { setSaving(false) }
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div className="card" style={{ width: '100%', maxWidth: 400, borderRadius: 8 }}>
        <div style={{ borderBottom: '1px solid var(--color-border)', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>Close Maintenance Log #{log.id}</h3>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>{log.type}</p>
        </div>
        <div style={{ padding: '0 1.25rem 1.25rem', display: 'grid', gap: '1rem' }}>
          <div>
            <label className="form-label">Final Cost (₹)</label>
            <input className="form-input" type="number" min="0" value={cost} onChange={e => setCost(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Notes (optional)</label>
            <textarea className="form-input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Work performed, parts replaced..." style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handle} disabled={saving} style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)' }}>{saving ? '...' : 'Close Log'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MaintenancePage({ userRole }) {
  const canEdit = ['fleet_manager', 'safety_officer'].includes(userRole)
  const [logs, setLogs] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  const [closeModal, setCloseModal] = useState(null)
  const [filterOpen, setFilterOpen] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [lR, vR] = await Promise.all([client.get('/maintenance/'), client.get('/vehicles/')])
      setLogs(lR.data); setVehicles(vR.data)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const getVehicle = id => vehicles.find(v => v.id === id)
  const filtered = filterOpen !== '' ? logs.filter(l => (filterOpen === 'open') === !l.closed_at) : logs
  const openCount = logs.filter(l => !l.closed_at).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.25rem' }}>Maintenance Logs</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>Track vehicle servicing and repair records</p>
        </div>
        {canEdit && <button id="maint-open-btn" className="btn btn-primary" onClick={() => setOpenModal(true)}>Open Log</button>}
      </div>

      {openCount > 0 && <div className="alert-banner alert-warning">{openCount} maintenance log{openCount > 1 ? 's' : ''} currently open — vehicles in shop</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: '1rem' }}>
        {[['Total Records', logs.length, 'var(--odoo-purple)'], ['Open', openCount, 'var(--color-warning)'], ['Closed', logs.length - openCount, 'var(--color-success)'], ['Total Cost', `₹${logs.reduce((a, l) => a + (l.cost || 0), 0).toLocaleString('en-IN')}`, 'var(--color-danger)']].map(([l, v, c]) => (
          <div key={l} className="kpi-card" style={{ '--accent-color': c }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 4 }}>{l}</div>
            <div style={{ fontSize: '1.375rem', fontWeight: 800, color: c, lineHeight: 1 }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.375rem' }}>
        {[['all', 'All'], ['open', 'Open'], ['closed', 'Closed']].map(([val, label]) => (
          <button key={val} onClick={() => setFilterOpen(val === 'all' ? '' : val)}
            className="btn btn-secondary btn-sm"
            style={{ borderColor: filterOpen === (val === 'all' ? '' : val) ? 'var(--color-accent)' : undefined, color: filterOpen === (val === 'all' ? '' : val) ? 'var(--color-accent)' : undefined }}>
            {label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="loading-spinner" /></div>
        : filtered.length === 0 ? <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}><p>No maintenance records found. {canEdit && 'Open a log to get started.'}</p></div>
        : <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['#', 'Vehicle', 'Type', 'Cost (₹)', 'Opened', 'Closed', 'Status', canEdit ? 'Actions' : ''].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map(l => {
                  const veh = getVehicle(l.vehicle_id)
                  return (
                    <tr key={l.id} style={{ transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ ...tdStyle, color: 'var(--color-text-muted)', fontWeight: 600 }}>#{l.id}</td>
                      <td style={tdStyle}><span style={{ fontWeight: 700, color: 'var(--odoo-purple)' }}>{veh?.reg_number || `#${l.vehicle_id}`}</span><br /><span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{veh?.model_name}</span></td>
                      <td style={tdStyle}>{l.type}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{l.cost != null ? `₹${Number(l.cost).toLocaleString('en-IN')}` : '—'}</td>
                      <td style={{ ...tdStyle, color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>{fmtDate(l.opened_at)}</td>
                      <td style={{ ...tdStyle, color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>{fmtDate(l.closed_at)}</td>
                      <td style={tdStyle}><StatusBadge closed={!!l.closed_at} /></td>
                      {canEdit && <td style={tdStyle}>{!l.closed_at && <button className="btn btn-secondary btn-sm" onClick={() => setCloseModal(l)} style={{ color: 'var(--color-success)', borderColor: 'var(--color-success)' }}>Close</button>}</td>}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>}
      </div>

      {openModal && <OpenModal vehicles={vehicles} onSave={() => { setOpenModal(false); load() }} onClose={() => setOpenModal(false)} />}
      {closeModal && <CloseModal log={closeModal} onSave={() => { setCloseModal(null); load() }} onClose={() => setCloseModal(null)} />}
    </div>
  )
}
