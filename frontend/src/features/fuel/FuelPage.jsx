import { useState, useEffect, useCallback } from 'react'
import client from '../../api/client'

// ── small helpers ──────────────────────────────────────────────────────────
const fmtCurrency = (n) =>
  n == null ? '—' : `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
const fmtNum = (n, d = 2) => (n == null ? '—' : Number(n).toFixed(d))

// ── inline icon ────────────────────────────────────────────────────────────
const SvgIcon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

// ── Modal ──────────────────────────────────────────────────────────────────
function FuelModal({ log, vehicles, onSave, onClose }) {
  const isEdit = Boolean(log?.id)
  const [form, setForm] = useState({
    vehicle_id: log?.vehicle_id ?? '',
    liters: log?.liters ?? '',
    cost_per_liter: log?.cost_per_liter ?? '',
    odometer_reading: log?.odometer_reading ?? '',
    date: log?.date ?? new Date().toISOString().slice(0, 10),
    notes: log?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const preview = form.liters && form.cost_per_liter
    ? `₹${(Number(form.liters) * Number(form.cost_per_liter)).toFixed(2)}`
    : '—'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErr('')
    try {
      const payload = {
        vehicle_id: Number(form.vehicle_id),
        liters: Number(form.liters),
        cost_per_liter: Number(form.cost_per_liter),
        odometer_reading: form.odometer_reading ? Number(form.odometer_reading) : null,
        date: form.date,
        notes: form.notes || null,
      }
      if (isEdit) {
        await client.patch(`/fuel/${log.id}`, payload)
      } else {
        await client.post('/fuel/', payload)
      }
      onSave()
    } catch (ex) {
      setErr(ex.response?.data?.detail || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'var(--color-surface)', borderRadius: '1rem',
        border: '1px solid var(--color-border)', padding: '2rem',
        width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-lg)',
      }}>
        <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.125rem', fontWeight: 700 }}>
          {isEdit ? 'Edit Fuel Log' : 'Add Fuel Log'}
        </h2>
        {err && (
          <div style={{
            background: 'rgba(239,68,68,0.12)', border: '1px solid #ef4444',
            borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem',
            color: '#ef4444', fontSize: '0.875rem',
          }}>⚠️ {err}</div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label className="form-label">Vehicle *</label>
              <select className="form-input" value={form.vehicle_id} onChange={set('vehicle_id')} required>
                <option value="">Select vehicle…</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.reg_number} — {v.model}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Liters *</label>
                <input className="form-input" type="number" min="0.01" step="0.01"
                  value={form.liters} onChange={set('liters')} required placeholder="e.g. 45.5" />
              </div>
              <div>
                <label className="form-label">Cost / Liter (₹) *</label>
                <input className="form-input" type="number" min="0.01" step="0.01"
                  value={form.cost_per_liter} onChange={set('cost_per_liter')} required placeholder="e.g. 102.5" />
              </div>
            </div>
            <div style={{
              background: 'rgba(59,130,246,0.08)', borderRadius: '0.5rem',
              padding: '0.625rem 0.875rem', fontSize: '0.875rem', color: 'var(--color-accent)',
              fontWeight: 600,
            }}>
              Computed Total Cost: {preview}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Odometer (km)</label>
                <input className="form-input" type="number" min="0" step="1"
                  value={form.odometer_reading} onChange={set('odometer_reading')} placeholder="Optional" />
              </div>
              <div>
                <label className="form-label">Date *</label>
                <input className="form-input" type="date" value={form.date} onChange={set('date')} required />
              </div>
            </div>
            <div>
              <label className="form-label">Notes</label>
              <textarea className="form-input" rows={2} value={form.notes}
                onChange={set('notes')} placeholder="Optional notes…"
                style={{ resize: 'vertical', minHeight: 60 }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Update' : 'Add Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function FuelPage() {
  const [logs, setLogs] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | {} | {log}
  const [deleting, setDeleting] = useState(null)
  const [filters, setFilters] = useState({ vehicle_id: '', date_from: '', date_to: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.vehicle_id) params.vehicle_id = filters.vehicle_id
      if (filters.date_from) params.date_from = filters.date_from
      if (filters.date_to) params.date_to = filters.date_to
      const [logsRes, vRes] = await Promise.all([
        client.get('/fuel/', { params }),
        client.get('/vehicles/'),
      ])
      setLogs(logsRes.data)
      setVehicles(vRes.data)
    } catch {
      // leave as is
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this fuel log?')) return
    setDeleting(id)
    try { await client.delete(`/fuel/${id}`) } finally { setDeleting(null) }
    load()
  }

  // summary stats
  const totalLiters = logs.reduce((s, l) => s + (l.liters || 0), 0)
  const totalCost = logs.reduce((s, l) => s + (l.total_cost || 0), 0)
  const avgEff = logs.length ? totalLiters / logs.length : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.375rem' }}>⛽ Fuel Logs</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Track fuel fill-ups and costs across the fleet
          </p>
        </div>
        <button id="fuel-add-btn" className="btn btn-primary" onClick={() => setModal({})}>
          + Add Fuel Log
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Total Records', value: logs.length, color: 'var(--color-accent)' },
          { label: 'Total Liters', value: `${fmtNum(totalLiters)} L`, color: '#8b5cf6' },
          { label: 'Total Cost', value: fmtCurrency(totalCost), color: 'var(--color-danger)' },
          { label: 'Avg Liters/Log', value: `${fmtNum(avgEff)} L`, color: 'var(--color-warning)' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 180px' }}>
          <label className="form-label">Vehicle</label>
          <select className="form-input" value={filters.vehicle_id}
            onChange={(e) => setFilters((f) => ({ ...f, vehicle_id: e.target.value }))}>
            <option value="">All vehicles</option>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.reg_number} — {v.model}</option>)}
          </select>
        </div>
        <div style={{ flex: '1 1 140px' }}>
          <label className="form-label">From</label>
          <input className="form-input" type="date" value={filters.date_from}
            onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))} />
        </div>
        <div style={{ flex: '1 1 140px' }}>
          <label className="form-label">To</label>
          <input className="form-input" type="date" value={filters.date_to}
            onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))} />
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ vehicle_id: '', date_from: '', date_to: '' })}>
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="loading-spinner" />
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⛽</div>
            <p>No fuel logs yet. Add one to get started.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.03)' }}>
                  {['Date', 'Vehicle', 'Liters', 'Cost/L', 'Total Cost', 'Odometer', 'Notes', ''].map((h) => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((l, i) => {
                  const veh = vehicles.find((v) => v.id === l.vehicle_id)
                  return (
                    <tr key={l.id} style={{ borderBottom: '1px solid var(--color-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)'}
                    >
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>{l.date}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                        {veh ? <><span style={{ fontSize: '0.75rem', color: 'var(--color-accent)' }}>{veh.reg_number}</span><br /><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{veh.model}</span></> : `#${l.vehicle_id}`}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>{fmtNum(l.liters)} L</td>
                      <td style={{ padding: '0.75rem 1rem' }}>₹{fmtNum(l.cost_per_liter)}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--color-danger)' }}>{fmtCurrency(l.total_cost)}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{l.odometer_reading ? `${l.odometer_reading.toLocaleString()} km` : '—'}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.notes || '—'}</td>
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => setModal(l)} title="Edit">✏️</button>
                          <button className="btn btn-sm" onClick={() => handleDelete(l.id)} disabled={deleting === l.id}
                            style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }} title="Delete">
                            {deleting === l.id ? '…' : '🗑️'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal !== null && (
        <FuelModal
          log={modal?.id ? modal : null}
          vehicles={vehicles}
          onSave={() => { setModal(null); load() }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
