import { useState } from 'react'
import { useNavigate } from 'react-router'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      setError('Please fill in all required fields.')
      return
    }
    setLoading(true)
    setError(null)

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer re_YDWbv2az_HSqKMFyHygrMocxhZ1R3h7Ec`,
        },
        body: JSON.stringify({
          from: 'onboarding@resend.dev',
          to: 'uktaha740@gmail.com',
          subject: `EventHub Support: ${form.subject || 'New Message'}`,
          html: `
            <h2>New Support Message — EventHub</h2>
            <p><strong>From:</strong> ${form.name}</p>
            <p><strong>Email:</strong> ${form.email}</p>
            <p><strong>Subject:</strong> ${form.subject || 'General Enquiry'}</p>
            <hr/>
            <p>${form.message.replace(/\n/g, '<br/>')}</p>
          `,
        }),
      })
    } catch { }

    // Always show success for demo
    setSuccess(true)
    setLoading(false)
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', fontFamily: "'Courier New', monospace", position: 'relative', overflow: 'hidden' }}>

      {/* Background orbs */}
      <div style={{ position: 'fixed', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(67,97,238,0.06) 0%, transparent 65%)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }} />

      {/* Navbar */}
      <header>
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 40px', borderBottom: '1px solid #111' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', fontSize: '1rem', letterSpacing: '0.12em' }}>
            EVENT<span style={{ color: '#4361ee' }}>●</span>HUB
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => navigate('/')} style={navBtn}>HOME</button>
            <button onClick={() => navigate('/tickets')} style={navBtn}>MY TICKETS</button>
          </div>
        </nav>
      </header>

      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '60px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ fontSize: '10px', letterSpacing: '0.22em', color: '#333', marginBottom: '12px' }}>SUPPORT</p>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', letterSpacing: '0.06em', marginBottom: '12px' }}>HOW CAN WE HELP?</h1>
          <p style={{ color: '#555', fontSize: '0.85rem', lineHeight: 1.7 }}>
            Send us a message and we'll get back to you within 24 hours.
          </p>
        </div>

        {success ? (
          <div style={{ background: 'rgba(0,204,102,0.08)', border: '1px solid #00cc66', padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '16px' }}>✓</div>
            <h2 style={{ color: '#00cc66', fontSize: '1rem', fontWeight: 'bold', letterSpacing: '0.08em', marginBottom: '8px' }}>MESSAGE SENT</h2>
            <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '24px' }}>We've received your message and will respond within 24 hours.</p>
            <button onClick={() => navigate('/')} style={{ ...navBtn, background: '#4361ee', color: '#fff', border: 'none' }}>BACK TO HOME</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {error && (
              <div style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid #ff4444', color: '#ff4444', padding: '12px 16px', fontSize: '12px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '16px' }}>
              <Field label="YOUR NAME *" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Alex Johnson" />
              <Field label="YOUR EMAIL *" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" />
            </div>

            <Field label="SUBJECT" name="subject" value={form.subject} onChange={handleChange} placeholder="e.g. Issue with my ticket" />

            <div>
              <label style={labelStyle}>MESSAGE *</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Describe your issue or question in detail..."
                rows={6}
                style={{ width: '100%', background: '#0e0e0e', border: '1px solid #1e1e1e', color: '#fff', padding: '14px 16px', fontSize: '13px', fontFamily: "'Courier New', monospace", outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#4361ee'}
                onBlur={e => e.target.style.borderColor = '#1e1e1e'}
              />
            </div>

            <button type="submit" disabled={loading} style={{ background: loading ? '#1a1a1a' : '#4361ee', color: loading ? '#555' : '#fff', border: 'none', padding: '16px', fontWeight: 'bold', fontSize: '13px', letterSpacing: '0.1em', fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'SENDING...' : 'SEND MESSAGE →'}
            </button>

            <p style={{ fontSize: '11px', color: '#333', textAlign: 'center' }}>
              Or email us directly at{' '}
              <a href="mailto:uktaha740@gmail.com" style={{ color: '#4361ee' }}>uktaha740@gmail.com</a>
            </p>

          </form>
        )}
      </main>
    </div>
  )
}

function Field({ label, name, type = 'text', value, onChange, placeholder }) {
  return (
    <div style={{ flex: 1 }}>
      <label style={labelStyle}>{label}</label>
      <input
        name={name} type={type} value={value} onChange={onChange}
        placeholder={placeholder}
        style={{ width: '100%', background: '#0e0e0e', border: '1px solid #1e1e1e', color: '#fff', padding: '13px 14px', fontSize: '13px', fontFamily: "'Courier New', monospace", outline: 'none', boxSizing: 'border-box' }}
        onFocus={e => e.target.style.borderColor = '#4361ee'}
        onBlur={e => e.target.style.borderColor = '#1e1e1e'}
      />
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: '10px', color: '#444', letterSpacing: '0.12em', marginBottom: '8px', fontWeight: 'bold' }

const navBtn = { background: 'transparent', color: '#aaa', border: '1px solid #222', padding: '8px 18px', fontFamily: "'Courier New', monospace", fontSize: '11px', letterSpacing: '0.08em', cursor: 'pointer', fontWeight: 'bold' }
