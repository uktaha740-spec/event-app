import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const [mode, setMode] = useState('signup')
  const [role, setRole] = useState('participant')
  const navigate = useNavigate()

  return (
    <div style={{
      background: '#000',
      minHeight: '100vh',
      color: '#fff',
      fontFamily: "'Courier New', monospace",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background orbs */}
      <div style={{
        position: 'fixed', width: '800px', height: '800px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(67,97,238,0.07) 0%, transparent 65%)',
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(114,9,183,0.06) 0%, transparent 65%)',
        top: '10%', right: '10%', pointerEvents: 'none',
      }} />

      {/* Logo */}
      <div style={{ marginBottom: '36px', textAlign: 'center' }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontWeight: 'bold', fontSize: '1.3rem', letterSpacing: '0.14em' }}
          aria-label="Go to homepage"
        >
          EVENT<span style={{ color: '#4361ee' }}>●</span>HUB
        </button>
        <p style={{ color: '#444', fontSize: '0.78rem', marginTop: '8px', letterSpacing: '0.06em' }}>
          {mode === 'signup' ? 'Create your free account' : 'Sign in to your account'}
        </p>
      </div>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: '540px',
        background: '#080808',
        border: '1px solid #1a1a1a',
        padding: '48px 52px',
      }}>

        {/* Sign Up / Log In toggle */}
        <div style={{ display: 'flex', border: '1px solid #1a1a1a', marginBottom: '40px' }}>
          {[['signup', 'SIGN UP'], ['login', 'LOG IN']].map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              style={{
                flex: 1, padding: '13px', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontWeight: 'bold', fontSize: '13px',
                letterSpacing: '0.1em',
                background: mode === m ? '#4361ee' : 'transparent',
                color: mode === m ? '#fff' : '#444',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Guest / Host toggle — sign up only */}
        {mode === 'signup' && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
            {[['participant', 'GUEST — I want to attend events'], ['host', 'HOST — I want to create events']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setRole(val)}
                aria-pressed={role === val}
                style={{
                  flex: 1, padding: '13px 10px', cursor: 'pointer',
                  fontFamily: 'inherit', fontWeight: 'bold', fontSize: '11px',
                  letterSpacing: '0.06em', lineHeight: 1.4,
                  transition: 'all 0.15s',
                  background: role === val ? 'rgba(67,97,238,0.1)' : 'transparent',
                  color: role === val ? '#4361ee' : '#444',
                  border: role === val ? '1px solid #4361ee' : '1px solid #222',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {mode === 'signup' && (
            <Field label="FULL NAME" placeholder="e.g. Alex Johnson" autoComplete="name" />
          )}
          <Field label="EMAIL ADDRESS" type="email" placeholder="you@example.com" autoComplete="email" />
          <Field
            label="PASSWORD"
            type="password"
            placeholder={mode === 'signup' ? 'Min. 8 characters' : 'Your password'}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
          {mode === 'signup' && (
            <Field label="CONFIRM PASSWORD" type="password" placeholder="Repeat password" autoComplete="new-password" />
          )}
          {mode === 'signup' && (
            <Field label="PHONE NUMBER" sublabel="OPTIONAL" type="tel" placeholder="+44 7700 900000" autoComplete="tel" />
          )}
        </div>

        {mode === 'login' && (
          <div style={{ textAlign: 'right', marginTop: '12px' }}>
            <a href="#" style={{ color: '#4361ee', fontSize: '12px', letterSpacing: '0.06em' }}>FORGOT PASSWORD?</a>
          </div>
        )}

        {/* Submit */}
        <button style={{
          width: '100%', background: '#4361ee', color: '#fff', border: 'none',
          padding: '16px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px',
          letterSpacing: '0.12em', fontFamily: 'inherit', marginTop: '32px',
        }}>
          {mode === 'signup' ? 'CREATE ACCOUNT' : 'SIGN IN →'}
        </button>

        {/* Switch mode */}
        <p style={{ marginTop: '24px', fontSize: '12px', color: '#444', textAlign: 'center', letterSpacing: '0.04em' }}>
          {mode === 'signup' ? 'ALREADY HAVE AN ACCOUNT? ' : 'NEW TO EVENTHUB? '}
          <button
            onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
            style={{ background: 'none', border: 'none', color: '#4361ee', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.04em', padding: 0 }}
          >
            {mode === 'signup' ? 'LOG IN' : 'CREATE ACCOUNT'}
          </button>
        </p>
      </div>

      {/* Terms */}
      <p style={{ marginTop: '24px', fontSize: '11px', color: '#2a2a2a', textAlign: 'center', lineHeight: 1.7 }}>
        By continuing you agree to our{' '}
        <a href="#" style={{ color: '#333' }}>Terms of Service</a>{' '}
        and{' '}
        <a href="#" style={{ color: '#333' }}>Privacy Policy</a>.
      </p>
    </div>
  )
}

function Field({ label, sublabel, type = 'text', placeholder, autoComplete }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', color: '#555', letterSpacing: '0.12em', marginBottom: '8px', fontWeight: 'bold' }}>
        {label}{sublabel && <span style={{ color: '#2a2a2a', marginLeft: '6px' }}>({sublabel})</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={{
          width: '100%', background: '#0e0e0e', border: '1px solid #1e1e1e',
          color: '#fff', padding: '15px 16px', fontSize: '14px',
          fontFamily: "'Courier New', monospace", outline: 'none',
          boxSizing: 'border-box',
        }}
        onFocus={e => e.target.style.borderColor = '#4361ee'}
        onBlur={e => e.target.style.borderColor = '#1e1e1e'}
      />
    </div>
  )
}
