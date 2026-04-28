import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase.js/client'

export default function LoginPage() {
  const [mode, setMode] = useState('signup')
  const [role, setRole] = useState('participant')
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', phone: '' })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const navigate = useNavigate()

  async function handleForgotPassword() {
    if (!form.email.trim()) { setError('Enter your email above first, then click Forgot Password.'); return }
    setLoading(true)
    setError(null)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: window.location.origin + '/login',
    })
    setLoading(false)
    if (resetError) { setError(resetError.message); return }
    setResetSent(true)
    setSuccess(`Password reset email sent to ${form.email} — check your inbox.`)
  }

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (mode === 'signup') {
      if (!form.name.trim()) { setError('Please enter your full name.'); return }
      if (!form.email.trim()) { setError('Please enter your email.'); return }
      if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
      if (form.password !== form.confirm) { setError('Passwords do not match.'); return }

      setLoading(true)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.name, role, phone: form.phone } },
      })

      if (signUpError) { setError(signUpError.message); setLoading(false); return }

      if (data.user) {
        await supabase.from('profiles').upsert({ id: data.user.id, email: form.email, role })
      }

      // If email confirmation is required, show message instead of redirecting
      if (data.session) {
        navigate(role === 'host' ? '/dashboard' : '/tickets')
      } else {
        setSuccess('Account created! Check your email to confirm, then log in.')
        setMode('login')
      }

    } else {
      if (!form.email.trim() || !form.password) { setError('Please enter your email and password.'); return }

      setLoading(true)
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })

      if (signInError) { setError(signInError.message); setLoading(false); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      const userRole = profile?.role ?? data.user.user_metadata?.role ?? 'participant'
      navigate(userRole === 'host' ? '/dashboard' : '/tickets')
    }

    setLoading(false)
  }

  return (
    <div style={{
      background: '#000', minHeight: '100vh', color: '#fff',
      fontFamily: "'Courier New', monospace", display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', position: 'relative', overflow: 'hidden',
    }}>

      {/* Background orbs */}
      <div style={{ position: 'fixed', width: '800px', height: '800px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(67,97,238,0.07) 0%, transparent 65%)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(114,9,183,0.06) 0%, transparent 65%)', top: '10%', right: '10%', pointerEvents: 'none' }} />

      {/* Logo */}
      <div style={{ marginBottom: '36px', textAlign: 'center' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontWeight: 'bold', fontSize: '1.3rem', letterSpacing: '0.14em' }}>
          EVENT<span style={{ color: '#4361ee' }}>●</span>HUB
        </button>
        <p style={{ color: '#444', fontSize: '0.78rem', marginTop: '8px', letterSpacing: '0.06em' }}>
          {mode === 'signup' ? 'Create your free account' : 'Sign in to your account'}
        </p>
      </div>

      {/* Card */}
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '540px', background: '#080808', border: '1px solid #1a1a1a', padding: '48px 52px' }}>

        {/* Sign Up / Log In toggle */}
        <div style={{ display: 'flex', border: '1px solid #1a1a1a', marginBottom: '40px' }}>
          {[['signup', 'SIGN UP'], ['login', 'LOG IN']].map(([m, label]) => (
            <button key={m} type="button" onClick={() => { setMode(m); setError(null); setSuccess(null) }} aria-pressed={mode === m}
              style={{ flex: 1, padding: '13px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', fontSize: '13px', letterSpacing: '0.1em', background: mode === m ? '#4361ee' : 'transparent', color: mode === m ? '#fff' : '#444', transition: 'background 0.15s, color 0.15s' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Guest / Host toggle */}
        {mode === 'signup' && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
            {[['participant', 'GUEST — I want to attend events'], ['host', 'HOST — I want to create events']].map(([val, label]) => (
              <button key={val} type="button" onClick={() => setRole(val)} aria-pressed={role === val}
                style={{ flex: 1, padding: '13px 10px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', fontSize: '11px', letterSpacing: '0.06em', lineHeight: 1.4, transition: 'all 0.15s', background: role === val ? 'rgba(67,97,238,0.1)' : 'transparent', color: role === val ? '#4361ee' : '#444', border: role === val ? '1px solid #4361ee' : '1px solid #222' }}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Error / Success messages */}
        {error && (
          <div style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid #ff4444', color: '#ff4444', padding: '12px 16px', fontSize: '12px', marginBottom: '20px', letterSpacing: '0.04em' }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: 'rgba(0,204,102,0.1)', border: '1px solid #00cc66', color: '#00cc66', padding: '12px 16px', fontSize: '12px', marginBottom: '20px', letterSpacing: '0.04em' }}>
            {success}
          </div>
        )}

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {mode === 'signup' && (
            <Field label="FULL NAME" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Alex Johnson" autoComplete="name" />
          )}
          <Field label="EMAIL ADDRESS" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" autoComplete="email" />
          <Field label="PASSWORD" name="password" type="password" value={form.password} onChange={handleChange}
            placeholder={mode === 'signup' ? 'Min. 8 characters' : 'Your password'}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
          {mode === 'signup' && (
            <Field label="CONFIRM PASSWORD" name="confirm" type="password" value={form.confirm} onChange={handleChange} placeholder="Repeat password" autoComplete="new-password" />
          )}
          {mode === 'signup' && (
            <Field label="PHONE NUMBER" sublabel="OPTIONAL" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+44 7700 900000" autoComplete="tel" />
          )}
        </div>

        {mode === 'login' && (
          <div style={{ textAlign: 'right', marginTop: '12px' }}>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={resetSent}
              style={{ background: 'none', border: 'none', color: resetSent ? '#444' : '#4361ee', fontSize: '12px', letterSpacing: '0.06em', cursor: resetSent ? 'default' : 'pointer', fontFamily: 'inherit', padding: 0 }}
            >
              {resetSent ? 'RESET EMAIL SENT' : 'FORGOT PASSWORD?'}
            </button>
          </div>
        )}

        <button type="submit" disabled={loading} style={{ width: '100%', background: loading ? '#2a2a2a' : '#4361ee', color: loading ? '#666' : '#fff', border: 'none', padding: '16px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '14px', letterSpacing: '0.12em', fontFamily: 'inherit', marginTop: '32px', transition: 'background 0.15s' }}>
          {loading ? 'PLEASE WAIT...' : mode === 'signup' ? 'CREATE ACCOUNT' : 'SIGN IN →'}
        </button>

        <p style={{ marginTop: '24px', fontSize: '12px', color: '#444', textAlign: 'center', letterSpacing: '0.04em' }}>
          {mode === 'signup' ? 'ALREADY HAVE AN ACCOUNT? ' : 'NEW TO EVENTHUB? '}
          <button type="button" onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(null); setSuccess(null) }}
            style={{ background: 'none', border: 'none', color: '#4361ee', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.04em', padding: 0 }}>
            {mode === 'signup' ? 'LOG IN' : 'CREATE ACCOUNT'}
          </button>
        </p>
      </form>

      <p style={{ marginTop: '24px', fontSize: '11px', color: '#2a2a2a', textAlign: 'center', lineHeight: 1.7 }}>
        By continuing you agree to our{' '}
        <a href="#" style={{ color: '#333' }}>Terms of Service</a>{' '}
        and{' '}
        <a href="#" style={{ color: '#333' }}>Privacy Policy</a>.
      </p>
    </div>
  )
}

function Field({ label, sublabel, name, type = 'text', value, onChange, placeholder, autoComplete }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', color: '#555', letterSpacing: '0.12em', marginBottom: '8px', fontWeight: 'bold' }}>
        {label}{sublabel && <span style={{ color: '#2a2a2a', marginLeft: '6px' }}>({sublabel})</span>}
      </label>
      <input
        name={name} type={type} value={value} onChange={onChange}
        placeholder={placeholder} autoComplete={autoComplete}
        style={{ width: '100%', background: '#0e0e0e', border: '1px solid #1e1e1e', color: '#fff', padding: '15px 16px', fontSize: '14px', fontFamily: "'Courier New', monospace", outline: 'none', boxSizing: 'border-box' }}
        onFocus={e => e.target.style.borderColor = '#4361ee'}
        onBlur={e => e.target.style.borderColor = '#1e1e1e'}
      />
    </div>
  )
}
