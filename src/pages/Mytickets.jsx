import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../supabaseClient'
import Footer from '../components/Footer'

const MOCK_TICKETS = [
  {
    id: 1,
    ticket_code: 'EVT-10324',
    status: 'registered',
    event: {
      title: 'Your Best Recovery Yet',
      date: 'Sat 21 Mar',
      time: '09:00',
      venue: 'Kachette',
      price: 15,
      image_url: null,
    },
  },
  {
    id: 2,
    ticket_code: 'EVT-76492',
    status: 'registered',
    event: {
      title: 'Gymshark Battle Stations',
      date: 'Sat 14 Mar',
      time: '09:00',
      venue: 'Exhibition White City',
      price: 0,
      image_url: null,
    },
  },
]

function TicketCard({ ticket, onCancel }) {
  const navigate = useNavigate()
  const { event, ticket_code, status } = ticket
  const isPaid    = event.price > 0
  const isAttended = status === 'Attended'

  return (
    <article style={cardStyle} aria-label={`Ticket for ${event.title}`}>
      {/* Event image */}
      {event.image_url ? (
        <img
          src={event.image_url}
          alt={event.title}
          style={{ width: '100%', height: '180px', objectFit: 'cover' }}
        />
      ) : (
        <div
          style={{ height: '180px', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-hidden="true"
        >
          <span style={{ fontWeight: 'bold', fontSize: '1rem', opacity: 0.5, textAlign: 'center', padding: '12px' }}>
            {(event.title || '').toUpperCase()}
          </span>
        </div>
      )}

      {/* Event info */}
      <div style={{ padding: '20px' }}>
        <h3 style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '6px' }}>{event.title}</h3>
        <p style={{ color: '#aaa', fontSize: '0.85rem' }}>{event.date}, {event.time}</p>
        <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '8px' }}>{event.venue}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <span style={{ color: isPaid ? '#00cc66' : '#00cc66', fontWeight: 'bold', fontSize: '0.85rem' }}>
            {isPaid ? `£${event.price} • Paid Event` : 'Free Event'}
          </span>
          {isAttended && (
            <span style={{ background: '#003300', color: '#00cc66', border: '1px solid #00cc66', padding: '2px 10px', fontSize: '11px', borderRadius: '2px' }}>
              ATTENDED
            </span>
          )}
        </div>

        {/* Ticket ID */}
        <p style={{ letterSpacing: '0.12em', fontSize: '0.9rem', marginBottom: '24px', color: '#ccc' }}>
          TICKET ID: {ticket_code}
        </p>

        {/* QR Code */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div
            style={{ background: '#fff', padding: '16px', display: 'inline-block' }}
            role="img"
            aria-label={`QR code for ticket ${ticket_code}`}
          >
            <QRCodeSVG
              value={ticket_code}
              size={180}
              bgColor="#ffffff"
              fgColor="#000000"
              level="H"
            />
          </div>

          {/* Actions */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* View Event */}
            <button
              onClick={() => navigate(`/events/${ticket.event_id}`)}
              style={{ width: '100%', background: 'transparent', border: '1px solid #4361ee', color: '#7ca4ff', padding: '11px', fontFamily: 'inherit', fontWeight: 'bold', fontSize: '12px', letterSpacing: '0.08em', cursor: 'pointer' }}
              aria-label={`View details for ${event.title}`}
            >
              VIEW EVENT DETAILS →
            </button>

            {/* Download / Print */}
            <button
              onClick={() => window.print()}
              style={{ width: '100%', background: 'transparent', border: '1px solid #333', color: '#aaa', padding: '11px', fontFamily: 'inherit', fontWeight: 'bold', fontSize: '12px', letterSpacing: '0.08em', cursor: 'pointer' }}
              aria-label={`Print ticket ${ticket_code}`}
            >
              🖨 PRINT / SAVE TICKET
            </button>

            {/* Cancel ticket */}
            {!isAttended && (
              <button
                onClick={() => onCancel(ticket)}
                style={{ width: '100%', background: 'transparent', border: '1px solid #2a0000', color: '#ff4444', padding: '11px', fontFamily: 'inherit', fontWeight: 'bold', fontSize: '12px', letterSpacing: '0.08em', cursor: 'pointer' }}
                aria-label={`Cancel ticket for ${event.title}`}
              >
                CANCEL TICKET ✕
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

export default function MyTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchTickets()
  }, [])

  async function fetchTickets() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setIsLoggedIn(true)

        // Try real Supabase RSVPs first (Member 2's query)
        const { data, error } = await supabase
          .from('rsvps')
          .select(`
            id,
            status,
            event:events (
              title,
              event_date,
              max_capacity
            )
          `)
          .eq('guest_id', user.id)

        if (!error && data && data.length > 0) {
          const formatted = data.map(rsvp => ({
            id: rsvp.id,
            ticket_code: rsvp.id,
            status: rsvp.status,
            event: {
              title: rsvp.event?.title ?? 'Unknown Event',
              date: rsvp.event?.event_date
                ? new Date(rsvp.event.event_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
                : 'TBD',
              time: 'TBD',
              venue: 'Main Venue',
              price: 0,
              image_url: null,
            },
          }))
          setTickets(formatted)
          setLoading(false)
          return
        }

        // Fallback: localStorage tickets (from GET TICKET button)
        const key = `tickets_${user.id}`
        const stored = JSON.parse(localStorage.getItem(key) || '[]')
        setTickets(stored)
        setLoading(false)
        return
      }
    } catch (err) {
      console.error(err)
    }
    // Not logged in — show mock demo tickets
    setTickets(MOCK_TICKETS)
    setLoading(false)
  }

  async function handleCancel(ticket) {
    if (!window.confirm(`Cancel your ticket for "${ticket.event?.title}"? This cannot be undone.`)) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Remove from localStorage
        const key = `tickets_${user.id}`
        const stored = JSON.parse(localStorage.getItem(key) || '[]')
        localStorage.setItem(key, JSON.stringify(stored.filter(t => t.id !== ticket.id)))
        // Also remove from Supabase rsvps if it exists there
        await supabase.from('rsvps').delete().eq('id', ticket.id)
      }
    } catch { /* best effort */ }
    setTickets(prev => prev.filter(t => t.id !== ticket.id))
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', fontFamily: "'Courier New', monospace" }}>
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Navbar */}
      <header>
        <nav aria-label="Main navigation" style={navStyle}>
          <button style={navBtn} onClick={() => navigate('/')}>HOME</button>
          <button style={navBtn} onClick={() => navigate('/dashboard')}>DASHBOARD</button>
          <button style={navBtn} onClick={() => navigate('/contact')}>HELP</button>
        </nav>
        <hr style={{ borderColor: '#222' }} />
      </header>

      <main id="main-content" style={{ padding: '40px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', letterSpacing: '0.08em', marginBottom: '36px' }}>
          MY TICKETS
        </h1>

        {loading ? (
          <p role="status" aria-live="polite" style={{ color: '#666' }}>Loading your tickets...</p>
        ) : tickets.length === 0 ? (
          <div style={{ color: '#666', textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontSize: '3rem', marginBottom: '16px' }}>🎫</p>
            <p style={{ fontSize: '1.1rem', marginBottom: '8px', color: '#fff' }}>
              {isLoggedIn ? "No tickets yet." : 'Sign in to see your tickets.'}
            </p>
            <p style={{ fontSize: '0.85rem', marginBottom: '24px', color: '#555' }}>
              {isLoggedIn ? 'Click "GET TICKET" on any event on the homepage.' : 'Create an account or log in to book events.'}
            </p>
            <button style={{ ...navBtn, background: '#4361ee', color: '#fff', border: 'none' }}
              onClick={() => window.location.href = isLoggedIn ? '/' : '/login'}>
              {isLoggedIn ? 'BROWSE EVENTS →' : 'LOG IN'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }} role="list">
            {tickets.map(ticket => (
              <div key={ticket.id} role="listitem">
                <TicketCard ticket={ticket} onCancel={handleCancel} />
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

const navStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  padding: '18px 40px',
  gap: '10px',
}

const navBtn = {
  background: '#4361ee',
  color: '#fff',
  border: 'none',
  padding: '10px 20px',
  fontWeight: 'bold',
  fontSize: '13px',
  letterSpacing: '0.05em',
  fontFamily: 'inherit',
  cursor: 'pointer',
}

const cardStyle = {
  background: '#111',
  border: '1px solid #222',
  width: '340px',
}

