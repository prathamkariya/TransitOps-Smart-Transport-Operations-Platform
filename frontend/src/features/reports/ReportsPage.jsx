import { useState, useEffect, useCallback } from 'react'
import client from '../../api/client'

// ── helpers ────────────────────────────────────────────────────────────────
const fmtCurrency = (n) =>
  n == null ? '—' : `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
const fmtNum = (n, d = 2) => (n == null ? '—' : Number(n).toFixed(d))
const pct = (n) => `${fmtNum(n, 1)}%`

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, color }) {
  return (
    <div className="card" style={{ padding: '1rem 1.25rem' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '1.375rem', fontWeight: 800, color: color || 'var(--color-text)' }}>{value}</div>
    </div>
  )
}

// ── Simple bar ─────────────────────────────────────────────────────────────
function Bar({ value, max, color }) {
  const width = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div style={{ height: 8, background: 'var(--color-border)', borderRadius: 999, overflow: 'hidden', width: 120 }}>
      <div style={{ height: '100%', width: `${width}%`, background: color || 'var(--color-accent)', borderRadius: 999, transition: 'width 0.6s ease' }} />
    </div>
  )
}

// ─────────────────── Report: Fuel Efficiency ──────────────────────────────
function FuelEfficiencyReport({ vehicles }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ vehicle_id: '', date_from: '', date_to: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.vehicle_id) params.vehicle_id = filters.vehicle_id
      if (filters.date_from) params.date_from = new Date(filters.date_from).toISOString().split('T')[0]
      if (filters.date_to) params.date_to = new Date(filters.date_to).toISOString().split('T')[0]
      const res = await client.get('/reports/fuel-efficiency', { params })
      setRows(res.data)
    } catch { setRows([]) } finally { setLoading(false) }
  }, [filters])

  useEffect(() => { load() }, [load])

  const maxEff = Math.max(...rows.map((r) => r.fuel_efficiency_km_per_liter || 0), 1)

  return (
    <>
      <FiltersBar filters={filters} setFilters={setFilters} vehicles={vehicles} />
      {loading ? <Spinner /> : rows.length === 0 ? <Empty label="No fuel data found for this period." /> : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.03)' }}>
                  {['Vehicle', 'Type', 'Distance (km)', 'Fuel Used (L)', 'Efficiency (km/L)', 'Fuel Cost'].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.vehicle_id} style={rowStyle(i)}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = rowBg(i)}
                  >
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{r.reg_number}</span>
                      <br /><span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{r.model}</span>
                    </td>
                    <td style={tdStyle}><TypeChip type={r.type} /></td>
                    <td style={tdStyle}>{fmtNum(r.total_distance_km)}</td>
                    <td style={tdStyle}>{fmtNum(r.total_fuel_liters)} L</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--color-success)', minWidth: 48 }}>{fmtNum(r.fuel_efficiency_km_per_liter)}</span>
                        <Bar value={r.fuel_efficiency_km_per_liter} max={maxEff} color="var(--color-success)" />
                      </div>
                    </td>
                    <td style={tdStyle}>{fmtCurrency(r.total_fuel_cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

// ─────────────────── Report: Operational Cost ─────────────────────────────
function OperationalCostReport({ vehicles }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ vehicle_id: '', date_from: '', date_to: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.vehicle_id) params.vehicle_id = filters.vehicle_id
      if (filters.date_from) params.date_from = new Date(filters.date_from).toISOString().split('T')[0]
      if (filters.date_to) params.date_to = new Date(filters.date_to).toISOString().split('T')[0]
      const res = await client.get('/reports/operational-cost', { params })
      setRows(res.data)
    } catch { setRows([]) } finally { setLoading(false) }
  }, [filters])

  useEffect(() => { load() }, [load])

  const maxTotal = Math.max(...rows.map((r) => r.total_operational_cost || 0), 1)
  const totals = rows.reduce((a, r) => ({
    fuel: a.fuel + (r.total_fuel_cost || 0),
    maint: a.maint + (r.total_maintenance_cost || 0),
    exp: a.exp + (r.total_expense_cost || 0),
    total: a.total + (r.total_operational_cost || 0),
  }), { fuel: 0, maint: 0, exp: 0, total: 0 })

  return (
    <>
      <FiltersBar filters={filters} setFilters={setFilters} vehicles={vehicles} />
      {!loading && rows.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
          <StatCard label="Grand Total" value={fmtCurrency(totals.total)} color="var(--color-danger)" />
          <StatCard label="Fuel Costs" value={fmtCurrency(totals.fuel)} color="#f97316" />
          <StatCard label="Maintenance" value={fmtCurrency(totals.maint)} color="#8b5cf6" />
          <StatCard label="Other Expenses" value={fmtCurrency(totals.exp)} color="var(--color-warning)" />
        </div>
      )}
      {loading ? <Spinner /> : rows.length === 0 ? <Empty label="No cost data found." /> : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.03)' }}>
                  {['Vehicle', 'Status', 'Fuel Cost', 'Maintenance', 'Other Expenses', 'Total Cost', ''].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.vehicle_id} style={rowStyle(i)}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = rowBg(i)}
                  >
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{r.reg_number}</span>
                      <br /><span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{r.model}</span>
                    </td>
                    <td style={tdStyle}><TypeChip type={r.status} /></td>
                    <td style={tdStyle}>{fmtCurrency(r.total_fuel_cost)}</td>
                    <td style={tdStyle}>{fmtCurrency(r.total_maintenance_cost)}</td>
                    <td style={tdStyle}>{fmtCurrency(r.total_expense_cost)}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--color-danger)', minWidth: 80 }}>{fmtCurrency(r.total_operational_cost)}</span>
                        <Bar value={r.total_operational_cost} max={maxTotal} color="var(--color-danger)" />
                      </div>
                    </td>
                    <td style={tdStyle} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

// ─────────────────── Report: Vehicle ROI ──────────────────────────────────
function VehicleROIReport({ vehicles }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [vFilter, setVFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (vFilter) params.vehicle_id = vFilter
      const res = await client.get('/reports/vehicle-roi', { params })
      setRows(res.data)
    } catch { setRows([]) } finally { setLoading(false) }
  }, [vFilter])

  useEffect(() => { load() }, [load])

  const maxRoi = Math.max(...rows.map((r) => Math.abs(r.roi_percentage || 0)), 1)

  return (
    <>
      <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label className="form-label">Vehicle</label>
          <select className="form-input" value={vFilter} onChange={(e) => setVFilter(e.target.value)}>
            <option value="">All vehicles</option>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.reg_number} — {v.model}</option>)}
          </select>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => setVFilter('')}>Clear</button>
      </div>
      {loading ? <Spinner /> : rows.length === 0 ? <Empty label="No ROI data found." /> : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.03)' }}>
                  {['Vehicle', 'Acquisition Cost', 'Revenue', 'Op. Cost', 'Net Profit', 'ROI %'].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const roi = r.roi_percentage || 0
                  const roiColor = roi >= 0 ? 'var(--color-success)' : 'var(--color-danger)'
                  return (
                    <tr key={r.vehicle_id} style={rowStyle(i)}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = rowBg(i)}
                    >
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{r.reg_number}</span>
                        <br /><span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{r.model}</span>
                      </td>
                      <td style={tdStyle}>{fmtCurrency(r.acquisition_cost)}</td>
                      <td style={tdStyle}>{fmtCurrency(r.total_revenue)}</td>
                      <td style={tdStyle}>{fmtCurrency(r.total_operational_cost)}</td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 700, color: r.net_profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {fmtCurrency(r.net_profit)}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 800, color: roiColor, minWidth: 56 }}>{pct(roi)}</span>
                          <Bar value={Math.abs(roi)} max={maxRoi} color={roiColor} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

// ─────────────────── Report: Fleet Utilization ────────────────────────────
function FleetUtilizationReport({ vehicles }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [vFilter, setVFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (vFilter) params.vehicle_id = vFilter
      const res = await client.get('/reports/fleet-utilization', { params })
      setRows(res.data)
    } catch { setRows([]) } finally { setLoading(false) }
  }, [vFilter])

  useEffect(() => { load() }, [load])

  const maxTrips = Math.max(...rows.map((r) => r.total_trips || 0), 1)
  const totals = rows.reduce((a, r) => ({
    total: a.total + (r.total_trips || 0),
    completed: a.completed + (r.completed_trips || 0),
    active: a.active + (r.active_trips || 0),
  }), { total: 0, completed: 0, active: 0 })

  return (
    <>
      <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label className="form-label">Vehicle</label>
          <select className="form-input" value={vFilter} onChange={(e) => setVFilter(e.target.value)}>
            <option value="">All vehicles</option>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.reg_number} — {v.model}</option>)}
          </select>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => setVFilter('')}>Clear</button>
      </div>
      {!loading && rows.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
          <StatCard label="Total Trips" value={totals.total} color="var(--color-accent)" />
          <StatCard label="Completed" value={totals.completed} color="var(--color-success)" />
          <StatCard label="Active" value={totals.active} color="var(--color-warning)" />
          <StatCard label="Completion Rate" value={totals.total ? pct((totals.completed / totals.total) * 100) : '—'} color="#8b5cf6" />
        </div>
      )}
      {loading ? <Spinner /> : rows.length === 0 ? <Empty label="No utilization data found." /> : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.03)' }}>
                  {['Vehicle', 'Type', 'Status', 'Total Trips', 'Completed', 'Active', 'Completion %'].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const compPct = r.total_trips > 0 ? (r.completed_trips / r.total_trips) * 100 : 0
                  return (
                    <tr key={r.vehicle_id} style={rowStyle(i)}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = rowBg(i)}
                    >
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{r.reg_number}</span>
                        <br /><span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{r.model}</span>
                      </td>
                      <td style={tdStyle}><TypeChip type={r.type} /></td>
                      <td style={tdStyle}><TypeChip type={r.current_status} /></td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ minWidth: 28, fontWeight: 700 }}>{r.total_trips}</span>
                          <Bar value={r.total_trips} max={maxTrips} color="var(--color-accent)" />
                        </div>
                      </td>
                      <td style={tdStyle}><span style={{ color: 'var(--color-success)', fontWeight: 700 }}>{r.completed_trips}</span></td>
                      <td style={tdStyle}><span style={{ color: 'var(--color-warning)', fontWeight: 700 }}>{r.active_trips}</span></td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, color: '#8b5cf6', minWidth: 40 }}>{pct(compPct)}</span>
                          <Bar value={compPct} max={100} color="#8b5cf6" />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

// ── Shared sub-components ──────────────────────────────────────────────────
const CHIP_PALETTE = {
  available: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
  on_trip: { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
  in_maintenance: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  retired: { bg: 'rgba(100,116,139,0.12)', color: '#64748b' },
  bus: { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
  truck: { bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6' },
  van: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  car: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
}
function TypeChip({ type }) {
  const s = CHIP_PALETTE[type] || { bg: 'rgba(100,116,139,0.12)', color: '#64748b' }
  return (
    <span style={{
      display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: 999,
      fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
      background: s.bg, color: s.color,
    }}>{type?.replace('_', ' ')}</span>
  )
}

function FiltersBar({ filters, setFilters, vehicles }) {
  return (
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
      <button className="btn btn-secondary btn-sm"
        onClick={() => setFilters({ vehicle_id: '', date_from: '', date_to: '' })}>Clear</button>
    </div>
  )
}

function Spinner() {
  return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="loading-spinner" /></div>
}

function Empty({ label }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📊</div>
      <p>{label}</p>
    </div>
  )
}

const thStyle = { padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }
const tdStyle = { padding: '0.75rem 1rem', verticalAlign: 'middle' }
const rowBg = (i) => i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)'
const rowStyle = (i) => ({ borderBottom: '1px solid var(--color-border)', background: rowBg(i), transition: 'background 0.15s', cursor: 'default' })

// ── CSV Download helper ────────────────────────────────────────────────────
const CSV_REPORT_TYPES = [
  { value: 'fuel_efficiency', label: 'Fuel Efficiency' },
  { value: 'operational_cost', label: 'Operational Cost' },
  { value: 'vehicle_roi', label: 'Vehicle ROI' },
  { value: 'fleet_utilization', label: 'Fleet Utilization' },
]

// ── Tab definitions ────────────────────────────────────────────────────────
const TABS = [
  { id: 'fuel_efficiency', label: '⛽ Fuel Efficiency' },
  { id: 'operational_cost', label: '💸 Operational Cost' },
  { id: 'vehicle_roi', label: '📈 Vehicle ROI' },
  { id: 'fleet_utilization', label: '🚛 Fleet Utilization' },
]

// ── Main Page ──────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [tab, setTab] = useState('fuel_efficiency')
  const [vehicles, setVehicles] = useState([])
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    client.get('/vehicles/').then((r) => setVehicles(r.data)).catch(() => {})
  }, [])

  const downloadCsv = async (reportType) => {
    setDownloading(true)
    try {
      const token = localStorage.getItem('transitops-token')
      const res = await fetch(`/api/v1/reports/export/csv?report_type=${reportType}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${reportType}_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch { alert('CSV export failed. Please try again.') }
    finally { setDownloading(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.375rem' }}>📊 Reports & Analytics</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Fleet performance insights with CSV export
          </p>
        </div>
        {/* CSV Export dropdown */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {CSV_REPORT_TYPES.map((r) => (
            <button key={r.value}
              id={`export-csv-${r.value}`}
              className="btn btn-secondary btn-sm"
              disabled={downloading}
              onClick={() => downloadCsv(r.value)}
              title={`Download ${r.label} CSV`}
            >
              ⬇️ {r.label} CSV
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '0.25rem', flexWrap: 'wrap',
        background: 'var(--color-surface)', borderRadius: '0.75rem',
        border: '1px solid var(--color-border)', padding: '0.375rem',
      }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`report-tab-${t.id}`}
            onClick={() => setTab(t.id)}
            style={{
              flex: '1 1 auto',
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: tab === t.id ? 'var(--color-accent)' : 'transparent',
              color: tab === t.id ? 'white' : 'var(--color-text-muted)',
              boxShadow: tab === t.id ? '0 2px 8px rgba(59,130,246,0.35)' : 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {tab === 'fuel_efficiency'   && <FuelEfficiencyReport vehicles={vehicles} />}
        {tab === 'operational_cost'  && <OperationalCostReport vehicles={vehicles} />}
        {tab === 'vehicle_roi'       && <VehicleROIReport vehicles={vehicles} />}
        {tab === 'fleet_utilization' && <FleetUtilizationReport vehicles={vehicles} />}
      </div>
    </div>
  )
}
