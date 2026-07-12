import { useState, useEffect, useCallback } from 'react'
import client from '../../api/client'

const EXPENSE_TYPES = ['toll', 'repair', 'parking', 'cleaning', 'insurance', 'other']

const fmtCurrency = (n) =>
  n == null ? '—' : `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

const TYPE_COLORS = {
  toll:      { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
  repair:    { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444' },
  parking:   { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  cleaning:  { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e' },
  insurance: { bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6' },
  other:     { bg: 'rgba(100,116,139,0.12)',color: '#64748b' },
}

function Badge({ type }) {
  const s = TYPE_COLORS[type] || TYPE_COLORS.other
  return (
    <span style={{
      display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '999px',
      fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
      background: s.bg, color: s.color, letterSpacing: '0.04em',
    }}>{type}</span>
  )
}

// ── Modal ──────────────────────────────────────────────────────────────────
function ExpenseModal({ expense, vehicles, onSave, onClose }) {
  const isEdit = Boolean(expense?.id)
  const [form, setForm] = useState({
    vehicle_id: expense?.vehicle_id ?? '',
    trip_id: expense?.trip_id ?? '',
    type: expense?.type ?? 'toll',
    amount: expense?.amount ?? '',
    date: expense?.date ?? new Date().toISOString().slice(0, 10),
    description: expense?.description ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErr('')
    try {
      const payload = {
        vehicle_id: Number(form.vehicle_id),
        trip_id: form.trip_id ? Number(form.trip_id) : null,
        type: form.type,
        amount: Number(form.amount),
        date: form.date,
        description: form.description || null,
      }
      if (isEdit) {
        await client.patch(`/expenses/${expense.id}`, payload)
      } else {
        await client.post('/expenses/', payload)
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
          {isEdit ? 'Edit Expense' : 'Add Expense'}
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
                <label className="form-label">Type *</label>
                <select className="form-input" value={form.type} onChange={set('type')} required>
                  {EXPENSE_TYPES.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Amount (₹) *</label>
                <input className="form-input" type="number" min="0.01" step="0.01"
                  value={form.amount} onChange={set('amount')} required placeholder="e.g. 500.00" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Trip ID (optional)</label>
                <input className="form-input" type="number" min="1"
                  value={form.trip_id} onChange={set('trip_id')} placeholder="Link to trip" />
              </div>
              <div>
                <label className="form-label">Date *</label>
                <input className="form-input" type="date" value={form.date} onChange={set('date')} required />
              </div>
            </div>
            <div>
              <label className="form-label">Description</label>
              <textarea className="form-input" rows={2} value={form.description}
                onChange={set('description')} placeholder="Optional description…"
                style={{ resize: 'vertical', minHeight: 60 }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Update' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [filters, setFilters] = useState({ vehicle_id: '', type: '', date_from: '', date_to: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.vehicle_id) params.vehicle_id = filters.vehicle_id
      if (filters.type) params.type = filters.type
      if (filters.date_from) params.date_from = filters.date_from
      if (filters.date_to) params.date_to = filters.date_to
      const [expRes, vRes] = await Promise.all([
        client.get('/expenses/', { params }),
        client.get('/vehicles/'),
      ])
      setExpenses(expRes.data)
      setVehicles(vRes.data)
    } catch {
      // leave
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense record?')) return
    setDeleting(id)
    try { await client.delete(`/expenses/${id}`) } finally { setDeleting(null) }
    load()
  }

  // Per-type summary
  const typeBreakdown = EXPENSE_TYPES.map((t) => ({
    type: t,
    total: expenses.filter((e) => e.type === t).reduce((s, e) => s + (e.amount || 0), 0),
    count: expenses.filter((e) => e.type === t).length,
  })).filter((t) => t.count > 0)

  const grandTotal = expenses.reduce((s, e) => s + (e.amount || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.375rem' }}>💰 Expenses</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Track tolls, repairs, and miscellaneous fleet costs
          </p>
        </div>
        <button id="expense-add-btn" className="btn btn-primary" onClick={() => setModal({})}>
          + Add Expense
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 4 }}>Total Expenses</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-danger)' }}>{fmtCurrency(grandTotal)}</div>
        </div>
        <div className="card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 4 }}>Records</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-accent)' }}>{expenses.length}</div>
        </div>
        {typeBreakdown.slice(0, 4).map((t) => (
          <div key={t.type} className="card" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 4 }}>{t.type}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: TYPE_COLORS[t.type]?.color }}>{fmtCurrency(t.total)}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{t.count} records</div>
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
          <label className="form-label">Type</label>
          <select className="form-input" value={filters.type}
            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>
            <option value="">All types</option>
            {EXPENSE_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
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
        <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ vehicle_id: '', type: '', date_from: '', date_to: '' })}>
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="loading-spinner" />
          </div>
        ) : expenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>💸</div>
            <p>No expense records yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.03)' }}>
                  {['Date', 'Vehicle', 'Type', 'Amount', 'Trip', 'Description', ''].map((h) => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp, i) => {
                  const veh = vehicles.find((v) => v.id === exp.vehicle_id)
                  return (
                    <tr key={exp.id}
                      style={{ borderBottom: '1px solid var(--color-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)'}
                    >
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>{exp.date}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                        {veh ? <><span style={{ fontSize: '0.75rem', color: 'var(--color-accent)' }}>{veh.reg_number}</span><br /><span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{veh.model}</span></> : `#${exp.vehicle_id}`}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}><Badge type={exp.type} /></td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--color-danger)' }}>{fmtCurrency(exp.amount)}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{exp.trip_id ? `#${exp.trip_id}` : '—'}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.description || '—'}</td>
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => setModal(exp)} title="Edit">✏️</button>
                          <button className="btn btn-sm" onClick={() => handleDelete(exp.id)} disabled={deleting === exp.id}
                            style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }} title="Delete">
                            {deleting === exp.id ? '…' : '🗑️'}
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

      {modal !== null && (
        <ExpenseModal
          expense={modal?.id ? modal : null}
          vehicles={vehicles}
          onSave={() => { setModal(null); load() }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
