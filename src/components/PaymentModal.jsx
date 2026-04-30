import { useState } from 'react'

// ── Card type detection ───────────────────────────────────────────────────────
function detectCard(number) {
  const n = number.replace(/\s/g, '')
  if (/^4/.test(n))                           return 'visa'
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'mastercard'
  if (/^3[47]/.test(n))                       return 'amex'
  if (/^6/.test(n))                           return 'discover'
  return null
}

// ── Formatters ────────────────────────────────────────────────────────────────
function formatCard(v) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}
function formatExpiry(v) {
  const d = v.replace(/\D/g, '').slice(0, 4)
  return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d
}

// ── Card brand logos (styled text) ───────────────────────────────────────────
function CardBadge({ type }) {
  const brands = {
    visa:       { label: 'VISA',     bg: '#1a1f71', color: '#fff',    italic: true  },
    mastercard: { label: 'MC',       bg: '#eb001b', color: '#fff',    italic: false },
    amex:       { label: 'AMEX',     bg: '#2557d6', color: '#fff',    italic: false },
    discover:   { label: 'DISCOVER', bg: '#ff6600', color: '#fff',    italic: false },
  }
  const b = brands[type]
  if (!b) return null
  return (
    <span style={{ background: b.bg, color: b.color, padding: '3px 9px', fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.06em', fontStyle: b.italic ? 'italic' : 'normal', borderRadius: '3px' }}>
      {b.label}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PaymentModal({ event, onSuccess, onClose }) {
  const [step, setStep]   = useState('form') // 'form' | 'processing' | 'success'
  const [form, setForm]   = useState({ name: '', number: '', expiry: '', cvv: '' })
  const [errors, setErrors] = useState({})

  const cardType = detectCard(form.number)

  function validate() {
    const e = {}
    if (!form.name.trim())                           e.name   = 'Cardholder name required'
    if (form.number.replace(/\s/g, '').length < 16)  e.number = 'Enter a valid 16-digit card number'
    if (form.expiry.length < 5)                      e.expiry = 'Enter expiry as MM/YY'
    if (form.cvv.length < 3)                         e.cvv    = 'Enter 3-digit CVV'
    return e
  }

  async function handlePay(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setStep('processing')
    await new Promise(r => setTimeout(r, 2000))
    setStep('success')
    await new Promise(r => setTimeout(r, 1600))
    onSuccess()
  }

  // ── Overlay click closes modal ────────────────────────────────────────────
  function handleOverlayClick(e) {
    if (e.target === e.currentTarget && step === 'form') onClose()
  }

  return (
    <div
      onClick={handleOverlayClick}
      role="dialog" aria-modal="true" aria-label="Payment"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}
    >
      <div style={{ background: '#0a0a0a', border: '1px solid #222', width: '100%', maxWidth: '480px', fontFamily: "'Courier New', monospace", color: '#fff', position: 'relative', overflow: 'hidden' }}>

        {/* ── Header ── */}
        <div style={{ background: '#111', borderBottom: '1px solid #1a1a1a', padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '10px', letterSpacing: '0.18em', color: '#444', marginBottom: '4px' }}>SECURE PAYMENT</p>
            <p style={{ fontWeight: 'bold', fontSize: '0.9rem', letterSpacing: '0.06em' }}>{event.title}</p>
          </div>
          {step === 'form' && (
            <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '18px', fontFamily: 'inherit', lineHeight: 1 }}>✕</button>
          )}
        </div>

        {/* ── Amount ── */}
        <div style={{ padding: '20px 28px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#080808' }}>
          <span style={{ color: '#666', fontSize: '12px', letterSpacing: '0.08em' }}>TOTAL DUE</span>
          <span style={{ fontWeight: 'bold', fontSize: '1.6rem', color: '#fff' }}>£{event.price}</span>
        </div>

        {/* ── FORM ── */}
        {step === 'form' && (
          <form onSubmit={handlePay} style={{ padding: '28px' }} noValidate>

            {/* Accepted cards */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', alignItems: 'center' }}>
              <span style={{ color: '#444', fontSize: '10px', letterSpacing: '0.1em', marginRight: '4px' }}>ACCEPTS</span>
              {['visa', 'mastercard', 'amex', 'discover'].map(t => <CardBadge key={t} type={t} />)}
            </div>

            {/* Card number */}
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>CARD NUMBER</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text" inputMode="numeric" placeholder="1234 5678 9012 3456"
                  value={form.number}
                  onChange={e => { setForm(p => ({ ...p, number: formatCard(e.target.value) })); setErrors(p => ({ ...p, number: null })) }}
                  style={{ ...inputStyle, paddingRight: '80px', borderColor: errors.number ? '#ff4444' : '#1e1e1e' }}
                />
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '6px' }}>
                  {cardType ? <CardBadge type={cardType} /> : (
                    <>
                      <CardBadge type="visa" />
                      <CardBadge type="mastercard" />
                    </>
                  )}
                </div>
              </div>
              {errors.number && <p style={errStyle}>{errors.number}</p>}
            </div>

            {/* Expiry + CVV */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
              <div>
                <label style={labelStyle}>EXPIRY DATE</label>
                <input
                  type="text" inputMode="numeric" placeholder="MM/YY"
                  value={form.expiry}
                  onChange={e => { setForm(p => ({ ...p, expiry: formatExpiry(e.target.value) })); setErrors(p => ({ ...p, expiry: null })) }}
                  style={{ ...inputStyle, borderColor: errors.expiry ? '#ff4444' : '#1e1e1e' }}
                />
                {errors.expiry && <p style={errStyle}>{errors.expiry}</p>}
              </div>
              <div>
                <label style={labelStyle}>CVV</label>
                <input
                  type="text" inputMode="numeric" placeholder="123" maxLength={4}
                  value={form.cvv}
                  onChange={e => { setForm(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })); setErrors(p => ({ ...p, cvv: null })) }}
                  style={{ ...inputStyle, borderColor: errors.cvv ? '#ff4444' : '#1e1e1e' }}
                />
                {errors.cvv && <p style={errStyle}>{errors.cvv}</p>}
              </div>
            </div>

            {/* Name */}
            <div style={{ marginBottom: '28px' }}>
              <label style={labelStyle}>CARDHOLDER NAME</label>
              <input
                type="text" placeholder="Name as on card"
                value={form.name}
                onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: null })) }}
                style={{ ...inputStyle, borderColor: errors.name ? '#ff4444' : '#1e1e1e' }}
              />
              {errors.name && <p style={errStyle}>{errors.name}</p>}
            </div>

            {/* Pay button */}
            <button type="submit" style={{ width: '100%', background: '#4361ee', color: '#fff', border: 'none', padding: '16px', fontWeight: 'bold', fontSize: '14px', letterSpacing: '0.1em', fontFamily: 'inherit', cursor: 'pointer' }}>
              PAY £{event.price} →
            </button>

            <p style={{ textAlign: 'center', color: '#333', fontSize: '10px', marginTop: '14px', letterSpacing: '0.06em' }}>
              🔒 Demo payment — no real charge will be made
            </p>
          </form>
        )}

        {/* ── PROCESSING ── */}
        {step === 'processing' && (
          <div style={{ padding: '56px 28px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', border: '3px solid #1a1a1a', borderTop: '3px solid #4361ee', borderRadius: '50%', margin: '0 auto 24px', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ fontWeight: 'bold', letterSpacing: '0.1em', marginBottom: '6px' }}>PROCESSING PAYMENT</p>
            <p style={{ color: '#444', fontSize: '12px', letterSpacing: '0.06em' }}>Please wait...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {step === 'success' && (
          <div style={{ padding: '56px 28px', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#003300', border: '2px solid #00cc66', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '24px' }}>
              ✓
            </div>
            <p style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#00cc66', letterSpacing: '0.1em', marginBottom: '8px' }}>PAYMENT ACCEPTED</p>
            <p style={{ color: '#555', fontSize: '12px', letterSpacing: '0.06em', marginBottom: '4px' }}>£{event.price} charged to your card</p>
            <p style={{ color: '#333', fontSize: '11px', letterSpacing: '0.04em' }}>Generating your ticket...</p>
          </div>
        )}

        {/* Lock icon footer */}
        {step === 'form' && (
          <div style={{ background: '#050505', borderTop: '1px solid #111', padding: '12px 28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#333', fontSize: '14px' }}>🔒</span>
            <span style={{ color: '#333', fontSize: '10px', letterSpacing: '0.06em' }}>256-BIT SSL ENCRYPTION · DEMO ENVIRONMENT</span>
          </div>
        )}
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: '10px', color: '#555',
  letterSpacing: '0.14em', marginBottom: '7px', fontWeight: 'bold',
}

const inputStyle = {
  width: '100%', background: '#0e0e0e', border: '1px solid #1e1e1e',
  color: '#fff', padding: '13px 14px', fontSize: '14px',
  fontFamily: "'Courier New', monospace", outline: 'none', boxSizing: 'border-box',
}

const errStyle = {
  color: '#ff4444', fontSize: '10px', marginTop: '5px', letterSpacing: '0.04em',
}
