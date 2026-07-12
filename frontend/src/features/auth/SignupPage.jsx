import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

// ── Role descriptions for the UI ────────────────────────────────────────────
const SELF_REGISTER_ROLES = [
  {
    value: 'dispatcher',
    label: 'Dispatcher',
    icon: '🗺️',
    desc: 'Manage trip scheduling and dispatch operations',
    access: 'Dashboard, Trips',
  },
  {
    value: 'financial_analyst',
    label: 'Financial Analyst',
    icon: '📊',
    desc: 'Track fuel costs, expenses, and financial analytics',
    access: 'Fuel & Expenses, Analytics',
  },
]

function PasswordStrength({ password }) {
  const score = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e']
  if (!password) return null
  return (
    <div style={{ marginTop: '0.375rem' }}>
      <div style={{ display: 'flex', gap: 3 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 99,
            background: i <= score ? colors[score] : 'rgba(255,255,255,0.15)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <div style={{ fontSize: '0.7rem', color: colors[score], marginTop: 3 }}>{labels[score]}</div>
    </div>
  )
}

export default function SignupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1=role pick, 2=form
  const [selectedRole, setSelectedRole] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name || null, email: form.email, password: form.password, role: selectedRole }),
      })
      const data = await res.json()
      if (!res.ok) {
        // Pydantic v2 returns detail as an array of error objects; plain FastAPI 
        // HTTPException returns it as a string — handle both gracefully
        let msg = 'Registration failed'
        if (typeof data.detail === 'string') {
          msg = data.detail
        } else if (Array.isArray(data.detail) && data.detail.length > 0) {
          // Extract the first error message, strip verbose email-validator prefix
          const raw = data.detail[0]?.msg || 'Validation error'
          msg = raw.replace(/^value is not a valid email address:\s*/i, '')
                   .replace(/^Value error,\s*/i, '')
                   .replace(/^String should match pattern.*/, 'Invalid format')
        }
        throw new Error(msg)
      }
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (ex) {
      setError(ex.message)
    } finally {
      setLoading(false)
    }
  }

  const roleInfo = SELF_REGISTER_ROLES.find((r) => r.value === selectedRole)

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      padding: '2rem 1rem',
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'linear-gradient(135deg, #6366f1, #4338ca)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 20px 40px rgba(99,102,241,0.4)',
            fontSize: 28,
          }}>🚌</div>
          <h1 style={{ color: 'white', margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>TransitOps</h1>
          <p style={{ color: '#94a3b8', margin: '0.5rem 0 0', fontSize: '0.875rem' }}>
            Create your account
          </p>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '1.25rem',
          padding: '2rem',
        }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
              <h3 style={{ color: 'white', margin: '0 0 0.5rem' }}>Account Created!</h3>
              <p style={{ color: '#94a3b8', margin: 0 }}>Redirecting to login…</p>
            </div>
          ) : step === 1 ? (
            <>
              <h2 style={{ color: 'white', margin: '0 0 0.375rem', fontSize: '1.125rem', fontWeight: 700 }}>
                Select your role
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.8125rem', margin: '0 0 1.5rem' }}>
                Choose the role that matches your responsibilities.
              </p>
              <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {SELF_REGISTER_ROLES.map((role) => (
                  <button
                    key={role.value}
                    id={`role-${role.value}`}
                    onClick={() => setSelectedRole(role.value)}
                    style={{
                      background: selectedRole === role.value
                        ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                      border: `1.5px solid ${selectedRole === role.value ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '0.75rem',
                      padding: '1rem 1.25rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      gap: '1rem',
                      alignItems: 'flex-start',
                    }}
                  >
                    <span style={{ fontSize: '1.75rem', lineHeight: 1, flexShrink: 0 }}>{role.icon}</span>
                    <div>
                      <div style={{ color: 'white', fontWeight: 700, fontSize: '0.9375rem', marginBottom: 2 }}>{role.label}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.8125rem', marginBottom: 4 }}>{role.desc}</div>
                      <div style={{ fontSize: '0.7rem', color: '#6366f1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Access: {role.access}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {/* Admin notice */}
              <div style={{
                background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                borderRadius: '0.625rem', padding: '0.75rem 1rem', marginBottom: '1.5rem',
                fontSize: '0.8125rem', color: '#fbbf24',
              }}>
                🔒 <strong>Fleet Manager / Safety Officer?</strong> These accounts must be created by your fleet manager. Contact them to get access.
              </div>
              <button
                id="signup-role-next"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', background: 'linear-gradient(135deg,#6366f1,#4338ca)', border: 'none' }}
                disabled={!selectedRole}
                onClick={() => setStep(2)}
              >
                Continue as {roleInfo?.label || '…'} →
              </button>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <button onClick={() => setStep(1)} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: '#94a3b8', padding: '0.375rem 0.75rem', cursor: 'pointer', fontSize: '0.875rem' }}>← Back</button>
                <div>
                  <h2 style={{ color: 'white', margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>
                    {roleInfo?.icon} {roleInfo?.label}
                  </h2>
                  <div style={{ fontSize: '0.7rem', color: '#6366f1', fontWeight: 600, textTransform: 'uppercase' }}>
                    Access: {roleInfo?.access}
                  </div>
                </div>
              </div>
              {error && (
                <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid #ef4444', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem', color: '#ef4444', fontSize: '0.875rem' }}>
                  ⚠️ {error}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6 }}>Full Name</label>
                    <input id="signup-name" type="text" className="form-input" placeholder="Jane Smith"
                      value={form.name} onChange={set('name')}
                      style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6 }}>Email address *</label>
                    <input id="signup-email" type="email" className="form-input" placeholder="you@company.com" required
                      value={form.email} onChange={set('email')}
                      style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6 }}>Password *</label>
                    <input id="signup-password" type="password" className="form-input" placeholder="Min. 6 characters" required
                      value={form.password} onChange={set('password')}
                      style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }} />
                    <PasswordStrength password={form.password} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6 }}>Confirm Password *</label>
                    <input id="signup-confirm" type="password" className="form-input" placeholder="Repeat password" required
                      value={form.confirm} onChange={set('confirm')}
                      style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }} />
                  </div>
                </div>
                <button id="signup-submit" type="submit" className="btn btn-primary" disabled={loading}
                  style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', background: 'linear-gradient(135deg,#6366f1,#4338ca)', border: 'none' }}>
                  {loading ? 'Creating account…' : 'Create Account'}
                </button>
              </form>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8125rem', marginTop: '1.5rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
