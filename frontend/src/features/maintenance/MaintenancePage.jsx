import { useState, useEffect, useCallback } from 'react'
import client from '../../api/client'

const MAINT_TYPES = ['Scheduled Service', 'Repair', 'Inspection', 'Tyre Change', 'Oil Change', 'Brake Service', 'Other']

function StatusBadge({ closed }) {
  return closed
    ? <span style={{ display: 'inline-block', padding: '0.2rem 0.65rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>Closed</span>
    : <span style={{ display: 'inline-block', padding: '0.2rem 0.65rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>🔧 Open</span>
}

function fmtDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── Open Maintenance Modal ─────────────────────────────────────────────────
function OpenModal({ vehicles, onSave, onClose }) {
  const [form, setForm] = useState({ vehicle_id: '', type: 'Scheduled Service', cost: '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const eligibleVehicles = vehicles.filter((v) => v.status !== 'on_trip' && v.status !== 'retired')

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setErr('')
    try {
      await client.post('/maintenance/', {
        vehicle_id: Number(form.vehicle_id),
        type: form.type,
        cost: form.cost ? Number(form.cost) : 0,
      })
      onSave()
    } catch (ex) { setErr(ex.response?.data?.detail || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: '1rem', border: '1px solid var(--color-border)', padding: '2rem', width: '100%', maxWidth: 460, boxShadow: 'var(--shadow-lg)' }}>
        <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.125rem', fontWeight: 700 }}>🔧 Open Maintenance Log</h2>
        {err && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid #ef4444', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem', color: '#ef4444', fontSize: '0.875rem' }}>⚠️ {err}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label className="form-label">Vehicle *</label>
              <select className="form-input" value={form.vehicle_id} onChange={set('vehicle_id')} required>
                <option value="">Select vehicle…</option>
                {eligibleVehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.reg_number} — {v.model_name} ({v.status.replace('_', ' ')})</option>
                ))}
              </select>
              {eligibleVehicles.length === 0 && <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: 4 }}>No eligible vehicles (not on trip or retired)</div>}
            </div>
            <div>
              <label className="form-label">Maintenance Type *</label>
              <select className="form-input" value={form.type} onChange={set('type')}>
                {MAINT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Estimated Cost (₹)</label>
              <input className="form-input" type="number" min="0" step="0.01" value={form.cost} onChange={set('cost')} placeholder="Optional — can be updated on close" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Opening…' : 'Open Log & Set In Shop'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Close Maintenance Modal ────────────────────────────────────────────────
function CloseModal({ log, onSave, onClose }) {
  const [finalCost, setFinalCost] = useState(log.cost ?? '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const handleClose = async () => {
    setSaving(true); setErr('')
    try {
      await client.post(`/maintenance/${log.id}/close`, null, {
        params: finalCost !== '' ? { final_cost: Number(finalCost) } : {},
      })
      onSave()
    } catch (ex) { setErr(ex.response?.data?.detail || 'Failed to close') }
    finally { setSaving(false) }
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: '1rem', border: '1px solid var(--color-border)', padding: '2rem', width: '100%', maxWidth: 380, boxShadow: 'var(--shadow-lg)' }}>
        <h3 style={{ margin: '0 0 0.5rem', fontWeight: 700 }}>✅ Close Maintenance Log #{log.id}</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: '0 0 1.25rem' }}>{log.type} — opened {fmtDate(log.opened_at)}</p>
        {err && <div style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '0.75rem' }}>⚠️ {err}</div>}
        <label className="form-label">Final Cost (₹)</label>
        <input className="form-input" type="number" min="0" step="0.01" value={finalCost} onChange={(e) => setFinalCost(e.target.value)} placeholder="Leave blank to keep existing" style={{ marginBottom: '1.25rem' }} />
        <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '0.5rem', padding: '0.625rem 0.875rem', fontSize: '0.8125rem', color: '#22c55e', marginBottom: '1.25rem' }}>
          ℹ️ Closing this log will restore the vehicle status to <strong>Available</strong>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleClose} disabled={saving} style={{ background: '#22c55e', border: 'none' }}>{saving ? '…' : 'Close Log'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function MaintenancePage({ userRole }) {
  const canEdit = ['fleet_manager', 'safety_officer'].includes(userRole)
  const [logs, setLogs] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  const [closeModal, setCloseModal] = useState(null)
  const [filterOpen, setFilterOpen] = useState('') // '' | 'open' | 'closed'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [mRes, vRes] = await Promise.all([
        client.get('/maintenance/'),
        client.get('/vehicles/'),
      ])
      setLogs(mRes.data)
      setVehicles(vRes.data)
    } catch { } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = logs.filter((l) => {
    if (filterOpen === 'open') return !l.closed_at
    if (filterOpen === 'closed') return Boolean(l.closed_at)
    return true
  })

  const openCount = logs.filter((l) => !l.closed_at).length
  const totalCost = logs.reduce((s, l) => s + (l.cost || 0), 0)

  const getVehicle = (id) => vehicles.find((v) => v.id === id)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.375rem' }}>🔧 Maintenance</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Track vehicle maintenance schedules and repairs</p>
        </div>
        {canEdit && <button id="maintenance-add-btn" className="btn btn-primary" onClick={() => setOpenModal(true)}>+ Open Maintenance Log</button>}
      </div>

      {/* Alert for open logs */}
      {openCount > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '0.75rem', padding: '0.875rem 1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center', color: '#f59e0b', fontWeight: 600 }}>
          🔧 {openCount} vehicle{openCount > 1 ? 's are' : ' is'} currently in maintenance (In Shop)
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: '1rem' }}>
        {[
          { label: 'Total Logs', value: logs.length, color: 'var(--color-accent)' },
          { label: 'Open / In Shop', value: openCount, color: '#f59e0b' },
          { label: 'Closed', value: logs.length - openCount, color: '#22c55e' },
          { label: 'Total Cost', value: `₹${Number(totalCost).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`, color: 'var(--color-danger)' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {[['', 'All'], ['open', '🔧 Open'], ['closed', '✅ Closed']].map(([val, lbl]) => (
          <button key={val} onClick={() => setFilterOpen(val)}
            style={{ padding: '0.375rem 0.875rem', borderRadius: 999, fontSize: '0.8125rem', fontWeight: 600, border: `1.5px solid ${filterOpen === val ? 'var(--color-accent)' : 'var(--color-border)'}`, background: filterOpen === val ? 'rgba(59,130,246,0.1)' : 'transparent', color: filterOpen === val ? 'var(--color-accent)' : 'var(--color-text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="loading-spinner" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔧</div>
            <p>No maintenance logs. {canEdit && 'Open one to start tracking.'}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.03)' }}>
                  {['#', 'Vehicle', 'Type', 'Cost', 'Opened', 'Closed', 'Status', canEdit ? 'Actions' : ''].map((h) => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((l, i) => {
                  const veh = getVehicle(l.vehicle_id)
                  return (
                    <tr key={l.id}
                      style={{ borderBottom: '1px solid var(--color-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)'}
                    >
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>#{l.id}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{veh?.reg_number || `#${l.vehicle_id}`}</span>
                        {veh && <><br /><span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{veh.model_name}</span></>}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{l.type}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--color-danger)' }}>
                        {l.cost ? `₹${Number(l.cost).toLocaleString('en-IN', { minimumFractionDigits: 0 })}` : '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>{fmtDate(l.opened_at)}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>{fmtDate(l.closed_at)}</td>
                      <td style={{ padding: '0.75rem 1rem' }}><StatusBadge closed={Boolean(l.closed_at)} /></td>
                      {canEdit && (
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {!l.closed_at && (
                            <button className="btn btn-sm" onClick={() => setCloseModal(l)}
                              style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>
                              ✅ Close
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {openModal && <OpenModal vehicles={vehicles} onSave={() => { setOpenModal(false); load() }} onClose={() => setOpenModal(false)} />}
      {closeModal && <CloseModal log={closeModal} onSave={() => { setCloseModal(null); load() }} onClose={() => setCloseModal(null)} />}
    </div>
  )
}
