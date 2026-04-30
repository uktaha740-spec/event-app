import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Footer from '../components/Footer'

const DEFAULT_IMAGES = {
  Music:                      'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80',
  Business:                   'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1200&q=80',
  Hobbies:                    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80',
  'Food & Drink':             'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
  'Performing & Visual Arts': 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1200&q=80',
  default:                    'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
}

const STATUS_META = {
  live:            { label: '● LIVE NOW',       color: '#00cc66' },
  almost_full:     { label: 'ALMOST FULL',       color: '#88dd00' },
  sales_end_soon:  { label: 'SALES END SOON',    color: '#ffaa00' },
  sold_out:        { label: 'SOLD OUT',           color: '#ff4444' },
}

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [event,     setEvent]     = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [rsvpState, setRsvpState] = useState('idle') // idle | loading | done | full | error
  const [imgFailed, setImgFailed] = useState(false)

  useEffect(() => {
    fetchEvent()
    checkAuth()
  }, [id])

  async function checkAuth() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
    } catch { setIsLoggedIn(false) }
  }

  async function fetchEvent() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('events').select('*').eq('id', id).single()

      if (!error && data) {
        const { data: rsvpRows } = await supabase
          .from('rsvps').select('id').eq('event_id', id).neq('status', 'cancelled')

        setEvent({
          ...data,
          tickets_sold: rsvpRows?.length ?? 0,
          capacity:     parseInt(data.max_capacity) || 0,
          date: data.event_date
            ? new Date(data.event_date + 'T00:00:00').toLocaleDateString('en-GB', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })
            : 'TBD',
        })
      } else {
        setEvent(null)
      }
    } catch {
      setEvent(null)
    }
    setLoading(false)
  }

  async function handleRSVP() {
    if (!isLoggedIn) { navigate('/login'); return }

    const isFull = event.capacity > 0 && (event.tickets_sold ?? 0) >= event.capacity
    if (isFull) { setRsvpState('full'); return }

    setRsvpState('loading')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/login'); return }

      const key      = `tickets_${user.id}`
      const existing = JSON.parse(localStorage.getItem(key) || '[]')

      if (existing.find(t => t.event_id === event.id)) {
        setRsvpState('done')
        navigate('/tickets')
        return
      }

      const ticketCode = 'EVT-' + Math.random().toString(36).substr(2, 6).toUpperCase()
      const newTicket  = {
        id: ticketCode, ticket_code: ticketCode, event_id: event.id,
        status: 'Attending',
        event: {
          title: event.title, date: event.date, time: event.time || '',
          venue: event.venue || 'London', price: event.price || 0,
          image_url: event.image_url || null,
        },
      }
      localStorage.setItem(key, JSON.stringify([newTicket, ...existing]))
      setRsvpState('done')
      setTimeout(() => navigate('/tickets'), 800)
    } catch {
      setRsvpState('error')
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={centreWrap}>
        <p style={{ color: '#333', letterSpacing: '0.12em', fontSize: '0.85rem' }}>LOADING EVENT...</p>
      </div>
    )
  }

  // ── Not found ────────────────────────────────────────────────────────────────
  if (!event) {
    return (
      <div style={{ ...centreWrap, gap: '20px' }}>
        <p style={{ fontSize: '4rem', opacity: 0.15 }}>◈</p>
        <p style={{ letterSpacing: '0.12em', color: '#555' }}>EVENT NOT FOUND</p>
        <button onClick={() => navigate('/')} style={solidBtn}>← BACK TO EVENTS</button>
      </div>
    )
  }

  const isFull  = event.capacity > 0 && (event.tickets_sold ?? 0) >= event.capacity
  const fillPct = event.capacity > 0
    ? Math.min(100, ((event.tickets_sold ?? 0) / event.capacity) * 100) : 0
  const isPaid   = event.price > 0
  const imgSrc   = (!imgFailed && event.image_url)
    ? event.image_url
    : DEFAULT_IMAGES[event.category] || DEFAULT_IMAGES.default
  const statusMeta = STATUS_META[event.status] || null

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', fontFamily: "'Courier New', monospace" }}>
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* ── NAV ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(14px)', borderBottom: '1px solid #181818' }}>
        <nav aria-label="Event detail navigation" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 48px' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: '0.18em', padding: 0 }}>
            EVENT<span style={{ color: '#4361ee' }}>●</span>HUB
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => navigate(-1)} style={outlineBtn}>← BACK</button>
            {isLoggedIn
              ? <button onClick={() => navigate('/tickets')} style={outlineBtn}>MY TICKETS</button>
              : <button onClick={() => navigate('/login')} style={solidBtn}>LOG IN</button>
            }
          </div>
        </nav>
      </header>

      <main id="main-content">
        {/* ── HERO IMAGE ── */}
        <div style={{ position: 'relative', height: '440px', overflow: 'hidden', background: '#080808' }}>
          <img
            src={imgSrc} alt={event.title}
            onError={() => setImgFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
          />
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0.1) 100%)' }} />

          {statusMeta && (
            <span style={{ position: 'absolute', top: '28px', left: '48px', background: 'rgba(0,0,0,0.82)', color: statusMeta.color, border: `1px solid ${statusMeta.color}`, padding: '5px 16px', fontSize: '10px', letterSpacing: '0.14em', fontWeight: 'bold', backdropFilter: 'blur(6px)' }}>
              {statusMeta.label}
            </span>
          )}
        </div>

        {/* ── TWO-COLUMN CONTENT ── */}
        <div style={{ maxWidth: '1160px', margin: '-72px auto 0', padding: '0 48px 100px', position: 'relative', zIndex: 1 }}>
          <div className="event-detail-grid">

            {/* LEFT: info */}
            <div>
              {event.category && (
                <span style={{ display: 'inline-block', background: 'rgba(67,97,238,0.15)', color: '#7ca4ff', border: '1px solid rgba(67,97,238,0.3)', padding: '4px 14px', fontSize: '10px', letterSpacing: '0.18em', marginBottom: '20px' }}>
                  {(event.category || '').toUpperCase()}
                </span>
              )}

              <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 'bold', letterSpacing: '0.02em', lineHeight: 1.08, marginBottom: '28px' }}>
                {event.title}
              </h1>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
                <p style={{ color: '#888', fontSize: '0.9rem' }}>📅 {event.date}{event.time ? ` · ${event.time}` : ''}</p>
                <p style={{ color: '#888', fontSize: '0.9rem' }}>📍 {event.venue || 'Venue TBD'}</p>
                <p style={{ color: isPaid ? '#fff' : '#00cc66', fontSize: '1.05rem', fontWeight: 'bold', marginTop: '4px' }}>
                  {isPaid ? `£${event.price} per ticket` : '🎟 Free Entry'}
                </p>
              </div>

              {/* Capacity bar */}
              {event.capacity > 0 && (
                <div style={{ marginBottom: '36px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#444', marginBottom: '8px', letterSpacing: '0.08em' }}>
                    <span>AVAILABILITY</span>
                    <span style={{ color: fillPct >= 90 ? '#ff4444' : '#555' }}>
                      {event.tickets_sold ?? 0} / {event.capacity} BOOKED
                    </span>
                  </div>
                  <div style={{ height: '4px', background: '#1a1a1a', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${fillPct}%`, background: fillPct >= 90 ? '#ff4444' : '#4361ee', transition: 'width 0.5s ease' }} />
                  </div>
                  {!isFull && (
                    <p style={{ color: '#555', fontSize: '11px', marginTop: '6px' }}>
                      {event.capacity - (event.tickets_sold ?? 0)} spots remaining
                    </p>
                  )}
                </div>
              )}

              {/* Description */}
              {event.description && (
                <div style={{ borderTop: '1px solid #111', paddingTop: '32px' }}>
                  <h2 style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#333', marginBottom: '16px' }}>ABOUT THIS EVENT</h2>
                  <p style={{ color: '#aaa', fontSize: '0.92rem', lineHeight: 1.9 }}>{event.description}</p>
                </div>
              )}

              {/* Venue map note */}
              {event.venue && (
                <div style={{ marginTop: '36px', borderTop: '1px solid #111', paddingTop: '28px' }}>
                  <h2 style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#333', marginBottom: '12px' }}>LOCATION</h2>
                  <p style={{ color: '#777', fontSize: '0.88rem' }}>📍 {event.venue}</p>
                </div>
              )}
            </div>

            {/* RIGHT: sticky ticket box */}
            <div>
              <div style={{ background: '#0c0c0c', border: '1px solid #1e1e1e', padding: '32px', position: 'sticky', top: '80px' }}>
                <p style={{ fontSize: '10px', letterSpacing: '0.18em', color: '#333', marginBottom: '10px' }}>YOUR TICKET</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '4px', color: isPaid ? '#fff' : '#00cc66' }}>
                  {isPaid ? `£${event.price}` : 'Free'}
                </p>
                <p style={{ color: '#444', fontSize: '11px', marginBottom: '28px', letterSpacing: '0.04em' }}>
                  {isFull ? 'No tickets remaining' : `${event.capacity - (event.tickets_sold ?? 0)} of ${event.capacity} spots left`}
                </p>

                <button
                  onClick={handleRSVP}
                  disabled={rsvpState === 'loading' || rsvpState === 'done' || isFull}
                  style={{
                    width: '100%', padding: '16px', fontFamily: 'inherit',
                    fontWeight: 'bold', fontSize: '13px', letterSpacing: '0.1em',
                    border: 'none', marginBottom: '12px',
                    cursor: (isFull || rsvpState === 'done') ? 'default' : 'pointer',
                    background: isFull          ? '#1a0000'
                              : rsvpState === 'done'   ? '#003300'
                              : '#4361ee',
                    color:  isFull          ? '#ff4444'
                          : rsvpState === 'done'   ? '#00cc66'
                          : '#fff',
                  }}
                >
                  {isFull             ? 'EVENT FULL'
                  : rsvpState === 'loading' ? 'BOOKING...'
                  : rsvpState === 'done'    ? '✓ BOOKED — VIEW TICKETS'
                  : rsvpState === 'error'   ? 'TRY AGAIN'
                  : !isLoggedIn             ? 'SIGN IN TO BOOK →'
                  : isPaid                  ? `GET TICKET — £${event.price} →`
                  :                           'GET FREE TICKET →'}
                </button>

                {!isLoggedIn && (
                  <p style={{ color: '#333', fontSize: '11px', textAlign: 'center', letterSpacing: '0.04em', marginBottom: '20px' }}>
                    🔒 Free account required to book
                  </p>
                )}

                <div style={{ borderTop: '1px solid #111', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ color: '#444', fontSize: '12px' }}>📅 {event.date}</p>
                  {event.time && <p style={{ color: '#444', fontSize: '12px' }}>🕐 Starts at {event.time}</p>}
                  <p style={{ color: '#444', fontSize: '12px' }}>📍 {event.venue || 'TBD'}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

const centreWrap = {
  background: '#000', minHeight: '100vh', color: '#fff',
  fontFamily: "'Courier New', monospace",
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
}

const solidBtn = {
  background: '#4361ee', color: '#fff', border: 'none',
  padding: '10px 22px', fontWeight: 'bold', fontSize: '11px',
  letterSpacing: '0.08em', fontFamily: 'inherit', cursor: 'pointer',
}

const outlineBtn = {
  background: 'transparent', color: '#bbb', border: '1px solid #2a2a2a',
  padding: '10px 20px', fontWeight: 'bold', fontSize: '11px',
  letterSpacing: '0.08em', fontFamily: 'inherit', cursor: 'pointer',
}
