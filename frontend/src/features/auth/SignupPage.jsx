import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const SELF_REGISTER_ROLES = [
  { value: 'dispatcher', label: 'Dispatcher', desc: 'Manage trip scheduling and dispatch operations', access: 'Dashboard, Trips' },
  { value: 'financial_analyst', label: 'Financial Analyst', desc: 'Track fuel costs, expenses, and financial analytics', access: 'Fuel & Expenses, Analytics' },
]

function PasswordStrength({ password }) {
  const score = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(password)).length
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['', '#DC3545', '#D97706', '#017E84', '#28A745']
  if (!password) return null
  return (
    <div style={{ marginTop: '0.375rem' }}>
      <div style={{ display: 'flex', gap: 3 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= score ? colors[score] : '#E0E0E0', transition: 'background 0.3s' }} />
        ))}
      </div>
      <div style={{ fontSize: '0.6875rem', color: colors[score], marginTop: 3 }}>{labels[score]}</div>
    </div>
  )
}

export default function SignupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [selectedRole, setSelectedRole] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name || null, email: form.email, password: form.password, role: selectedRole }),
      })
      const data = await res.json()
      if (!res.ok) {
        let msg = 'Registration failed'
        if (typeof data.detail === 'string') msg = data.detail
        else if (Array.isArray(data.detail) && data.detail.length > 0) {
          const raw = data.detail[0]?.msg || 'Validation error'
          msg = raw.replace(/^value is not a valid email address:\s*/i, '').replace(/^Value error,\s*/i, '').replace(/^String should match pattern.*/, 'Invalid format')
        }
        throw new Error(msg)
      }
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (ex) { setError(ex.message) }
    finally { setLoading(false) }
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#F0EDF2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ maxWidth: 420, width: '100%', textAlign: 'center', padding: '2.5rem', borderRadius: 8 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#D4EDDA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: '#155724' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
          </div>
          <h2 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.5rem' }}>Account created</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Redirecting you to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0EDF2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: step === 1 ? 560 : 440 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--odoo-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z"/></svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--odoo-purple)' }}>TransitOps</span>
          </div>
          <h1 style={{ fontWeight: 700, fontSize: '1.375rem', marginBottom: '0.375rem' }}>Create an Account</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            {step === 1 ? 'Choose your role to get started' : `Registering as ${SELF_REGISTER_ROLES.find(r => r.value === selectedRole)?.label}`}
          </p>
        </div>

        <div className="card" style={{ borderRadius: 8, padding: '1.75rem' }}>
          {step === 1 ? (
            <>
              <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {SELF_REGISTER_ROLES.map(role => (
                  <label key={role.value} style={{
                    display: 'flex', gap: '1rem', padding: '1rem 1.25rem', borderRadius: 6,
                    border: `1.5px solid ${selectedRole === role.value ? 'var(--odoo-purple)' : 'var(--color-border)'}`,
                    cursor: 'pointer', transition: 'border-color 0.12s',
                    background: selectedRole === role.value ? 'rgba(113,75,103,0.04)' : 'transparent',
                  }}>
                    <input type="radio" name="role" value={role.value} checked={selectedRole === role.value} onChange={() => setSelectedRole(role.value)} style={{ marginTop: 2, accentColor: 'var(--odoo-purple)' }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-text)' }}>{role.label}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{role.desc}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--odoo-purple)', marginTop: 4, fontWeight: 500 }}>Access: {role.access}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="alert-banner alert-info" style={{ marginBottom: '1.25rem', fontSize: '0.8125rem' }}>
                Fleet Manager and Safety Officer accounts must be created by a Fleet Manager.
              </div>

              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.625rem' }}
                disabled={!selectedRole} onClick={() => setStep(2)}>
                Continue
              </button>
            </>
          ) : (
            <>
              {error && <div className="alert-banner alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}
              <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label className="form-label">Full Name</label>
                  <input id="signup-name" className="form-input" type="text" placeholder="Ramesh Kumar" value={form.name} onChange={set('name')} required />
                </div>
                <div>
                  <label className="form-label">Email Address</label>
                  <input id="signup-email" className="form-input" type="email" placeholder="you@company.com" value={form.email} onChange={set('email')} required />
                </div>
                <div>
                  <label className="form-label">Password</label>
                  <input id="signup-password" className="form-input" type="password" placeholder="Minimum 6 characters" value={form.password} onChange={set('password')} required minLength={6} />
                  <PasswordStrength password={form.password} />
                </div>
                <div>
                  <label className="form-label">Confirm Password</label>
                  <input id="signup-confirm" className="form-input" type="password" placeholder="Repeat password" value={form.confirm} onChange={set('confirm')} required />
                </div>
                <div style={{ display: 'flex', gap: '0.625rem', marginTop: '0.25rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => { setStep(1); setError('') }} style={{ flex: 1 }}>Back</button>
                  <button id="signup-submit" type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2, justifyContent: 'center' }}>
                    {loading ? 'Creating account...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8125rem', marginTop: '1.25rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--odoo-purple)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
