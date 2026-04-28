import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../supabase.js/client'
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

function TicketCard({ ticket }) {
  const { event, ticket_code, status } = ticket
  const isPaid = event.price > 0
  const isAttended = status === 'attended'

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
            {event.title.toUpperCase()}
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

          {/* Apple Wallet button (cosmetic) */}
          <button style={walletBtn} aria-label="Add ticket to Apple Wallet">
            <span aria-hidden="true" style={{ fontSize: '20px' }}>⬛</span>
            <span style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.2 }}>
              <small style={{ fontSize: '10px', opacity: 0.8 }}>Add to</small>
              <strong style={{ fontSize: '15px' }}>Apple Wallet</strong>
            </span>
          </button>

          {/* Download */}
          <p style={{ fontSize: '0.85rem', letterSpacing: '0.08em' }}>
            DOWNLOAD TICKET{' '}
            <button
              onClick={() => window.print()}
              style={{ background: 'none', border: 'none', color: '#00cc66', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.08em' }}
              aria-label={`Download ticket ${ticket_code}`}
            >
              HERE
            </button>
          </p>
        </div>
      </div>
    </article>
  )
}

export default function MyTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchTickets()
  }, [])

  async function fetchTickets() {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data, error } = await supabase
          .from('rsvps')
          .select('id, status, event:events(id, title, event_date, max_capacity)')
          .eq('guest_id', session.user.id)
          .neq('status', 'declined')
          .order('created_at', { ascending: false })
        if (!error && data && data.length > 0) {
          const normalized = data.map(r => ({
            id: r.id,
            ticket_code: r.id,          // RSVP UUID is the QR value
            status: r.status,
            event: {
              title: r.event?.title ?? 'Unknown Event',
              date: r.event?.event_date
                ? new Date(r.event.event_date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
                : 'TBD',
              time: r.event?.time ?? '',
              venue: r.event?.venue ?? 'TBD',
              price: r.event?.price ?? 0,
              image_url: r.event?.image_url ?? null,
            },
          }))
          setTickets(normalized)
          setLoading(false)
          return
        }
      }
    } catch {
      // fall through to mock data
    }
    setTickets(MOCK_TICKETS)
    setLoading(false)
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', fontFamily: "'Courier New', monospace" }}>
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Navbar */}
      <header>
        <nav aria-label="Main navigation" style={navStyle}>
          <button style={navBtn} onClick={() => navigate('/')} aria-label="Discover events">
            DISCOVER EVENTS
          </button>
          <button style={navBtn} onClick={() => navigate('/')} aria-label="Go to home page">
            HOME
          </button>
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
            <p style={{ fontSize: '1.1rem', marginBottom: '16px' }}>You have no tickets yet.</p>
            <button style={navBtn} onClick={() => navigate('/')}>DISCOVER EVENTS</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }} role="list">
            {tickets.map(ticket => (
              <div key={ticket.id} role="listitem">
                <TicketCard ticket={ticket} />
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
  background: '#007bff',
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

const walletBtn = {
  background: '#000',
  color: '#fff',
  border: '1px solid #555',
  padding: '10px 20px',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  width: '100%',
  justifyContent: 'center',
}
