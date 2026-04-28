import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase.js/client'
import Footer from '../components/Footer'

// ── CONSTANTS ────────────────────────────────────────────────────────────────

const CATEGORIES = ['All', 'Music', 'Business', 'Hobbies', 'Food & Drink', 'Performing & Visual Arts']

const CAT_META = {
  All:                        { icon: '◈', accent: '#4361ee' },
  Music:                      { icon: '♫', accent: '#9b5de5' },
  Business:                   { icon: '◉', accent: '#4361ee' },
  Hobbies:                    { icon: '⚡', accent: '#f15bb5' },
  'Food & Drink':             { icon: '◆', accent: '#00d4aa' },
  'Performing & Visual Arts': { icon: '✦', accent: '#fee440' },
}

const CAT_GRADIENT = {
  Music:                      'linear-gradient(135deg, #0d001f 0%, #2d0650 100%)',
  Business:                   'linear-gradient(135deg, #000d28 0%, #0a2255 100%)',
  Hobbies:                    'linear-gradient(135deg, #1f0005 0%, #55001a 100%)',
  'Food & Drink':             'linear-gradient(135deg, #001f0a 0%, #0a5535 100%)',
  'Performing & Visual Arts': 'linear-gradient(135deg, #1a001f 0%, #500060 100%)',
  default:                    'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
}

// All dates set to June–July 2026 so the app always shows future events
const MOCK_EVENTS = [
  {
    id: 1, title: 'Gymshark Battle Stations', date: 'Sat 6 Jun 2026', time: '09:00',
    venue: 'Exhibition White City', price: 0, category: 'Hobbies', status: 'live',
    capacity: 100, tickets_sold: 72,
    description: 'Go head-to-head across 8 hybrid race stations in the ultimate fitness challenge.',
    image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 2, title: 'Your Best Recovery Yet', date: 'Sat 14 Jun 2026', time: '09:00',
    venue: 'Kachette', price: 15, category: 'Food & Drink', status: 'upcoming',
    capacity: 50, tickets_sold: 20,
    description: 'A wellness event focused on recovery techniques, nutrition, and healthy living.',
    image_url: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 3, title: 'Big Zero Show 2026', date: 'Thu 19 Jun 2026', time: '09:30',
    venue: 'Chicago Booth School of Business', price: 0, category: 'Business', status: 'almost_full',
    capacity: 200, tickets_sold: 190,
    description: 'The premier business showcase connecting innovators and investors from across Europe.',
    image_url: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 4, title: 'London Music Festival 2026', date: 'Fri 27 Jun 2026', time: '18:00',
    venue: 'O2 Arena, London', price: 45, category: 'Music', status: 'sales_end_soon',
    capacity: 5000, tickets_sold: 4800,
    description: "London's biggest music festival with 50+ artists across 6 outdoor stages.",
    image_url: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 5, title: 'Tech Startup Summit 2026', date: 'Mon 1 Jul 2026', time: '10:00',
    venue: 'ExCeL London', price: 99, category: 'Business', status: 'upcoming',
    capacity: 300, tickets_sold: 150,
    description: 'Connect with 300+ founders, investors, and tech leaders shaping tomorrow.',
    image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 6, title: 'Street Food & Craft Beer Festival', date: 'Sat 5 Jul 2026', time: '12:00',
    venue: 'Southbank Centre', price: 10, category: 'Food & Drink', status: 'upcoming',
    capacity: 400, tickets_sold: 100,
    description: '40 vendors, 100+ craft beers, and the best street food London has to offer.',
    image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 7, title: 'West End Showcase 2026', date: 'Wed 9 Jul 2026', time: '19:30',
    venue: 'Royal Albert Hall', price: 35, category: 'Performing & Visual Arts', status: 'upcoming',
    capacity: 800, tickets_sold: 500,
    description: 'An exclusive evening of West End performances at the iconic Royal Albert Hall.',
    image_url: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 8, title: 'Guitar Masterclass — Ed Sheeran', date: 'Sun 19 Jul 2026', time: '14:00',
    venue: 'Brixton Academy', price: 25, category: 'Music', status: 'almost_full',
    capacity: 300, tickets_sold: 285,
    description: "Learn songwriting and guitar techniques from one of the world's greatest artists.",
    image_url: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 9, title: 'London Hobby & Craft Expo', date: 'Sat 25 Jul 2026', time: '10:00',
    venue: 'Alexandra Palace', price: 8, category: 'Hobbies', status: 'upcoming',
    capacity: 600, tickets_sold: 200,
    description: 'Explore hundreds of hobby stalls, hands-on workshops, and live demonstrations.',
    image_url: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=800&q=80',
  },
]

const GUEST_STEPS = [
  { title: 'Create a free Participant account', desc: 'Quick sign-up — no credit card required.' },
  { title: 'Browse & discover events',          desc: 'Filter by category, date, or keyword.' },
  { title: 'Register or purchase a ticket',     desc: 'Secure checkout in under 30 seconds.' },
  { title: 'Receive your personal QR code',     desc: 'Saved instantly in My Tickets and emailed to you.' },
  { title: 'Scan in at the door & enjoy',       desc: 'Show your QR code — checked in instantly.' },
]

const HOST_STEPS = [
  { title: 'Register a free Host account',       desc: 'Select "Host" when signing up.' },
  { title: 'Build your event',                   desc: 'Set title, date, venue, price, and capacity.' },
  { title: 'Publish & share',                    desc: 'Your event goes live on the platform instantly.' },
  { title: 'Monitor your Dashboard',             desc: 'Track RSVPs, revenue & availability in real time.' },
  { title: 'Check in guests with the QR scanner', desc: 'Scan attendee codes at the door from any device.' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Browse Events',   desc: 'Discover thousands of events by category, location, or keyword. New events added daily.' },
  { step: '02', title: 'Book Your Ticket', desc: 'Select your ticket type and secure your spot in seconds. Instant confirmation sent to you.' },
  { step: '03', title: 'Show Up & Enjoy', desc: 'Flash your unique QR code at the door. Get checked in instantly and enjoy your event.' },
]

const STATS = [
  { value: '1,200+', label: 'Live Events' },
  { value: '48K+',   label: 'Tickets Sold' },
  { value: '320+',   label: 'Event Hosts' },
  { value: '15+',    label: 'Cities' },
]

const POPULAR_SEARCHES = ['Music Festivals', 'Tech Talks', 'Food Markets', 'Art Shows']

// ── HELPERS ──────────────────────────────────────────────────────────────────

function getStatusBadge(event) {
  const pct = event.tickets_sold / event.capacity
  if (event.status === 'live')
    return { label: '● LIVE',         bg: '#003018', color: '#00cc66', border: '#00cc66' }
  if (event.status === 'almost_full' || pct >= 0.9)
    return { label: 'ALMOST FULL',    bg: '#1c2e00', color: '#88dd00', border: '#88dd00' }
  if (event.status === 'sales_end_soon')
    return { label: 'SALES END SOON', bg: '#2e1a00', color: '#ffaa00', border: '#ffaa00' }
  if (event.status === 'sold_out' || event.tickets_sold >= event.capacity)
    return { label: 'SOLD OUT',       bg: '#2e0000', color: '#ff4444', border: '#ff4444' }
  return null
}

function formatPrice(event) {
  if (!event.price || event.price === 0) return 'Free'
  return event.price_display || `£${event.price}`
}

// ── EVENT CARD ───────────────────────────────────────────────────────────────

function EventCard({ event, onAction }) {
  const [imgFailed, setImgFailed] = useState(false)
  const badge  = getStatusBadge(event)
  const bg     = CAT_GRADIENT[event.category] || CAT_GRADIENT.default
  const meta   = CAT_META[event.category]     || CAT_META.All
  const isPaid = event.price > 0
  const showImg = event.image_url && !imgFailed

  return (
    <article
      className="event-card"
      onClick={onAction}
      style={{ background: '#0c0c0c', border: '1px solid #1a1a1a', cursor: 'pointer', overflow: 'hidden' }}
      aria-label={`${event.title}, ${event.date} at ${event.venue}`}
    >
      {/* ── Image / gradient placeholder ── */}
      <div style={{ position: 'relative', height: '210px', overflow: 'hidden' }}>
        {showImg ? (
          <img
            src={event.image_url}
            alt={event.title}
            onError={() => setImgFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{ height: '100%', background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            aria-hidden="true"
          >
            <span style={{ fontSize: '3.5rem', opacity: 0.12 }}>{meta.icon}</span>
            <span style={{ fontSize: '9px', letterSpacing: '0.25em', opacity: 0.25, textTransform: 'uppercase' }}>{event.category}</span>
          </div>
        )}

        {/* Bottom image fade into card body */}
        <div aria-hidden="true" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', background: 'linear-gradient(to top, #0c0c0c, transparent)' }} />

        {/* Category pill — top left */}
        <span style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(0,0,0,0.78)', color: meta.accent, border: `1px solid ${meta.accent}44`, padding: '3px 10px', fontSize: '9px', letterSpacing: '0.14em', backdropFilter: 'blur(6px)' }}>
          {event.category.toUpperCase()}
        </span>

        {/* Status badge — top right */}
        {badge && (
          <span style={{ position: 'absolute', top: '12px', right: '12px', background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, padding: '3px 10px', fontSize: '9px', letterSpacing: '0.1em', fontWeight: 'bold' }}>
            {badge.label}
          </span>
        )}
      </div>

      {/* ── Card body ── */}
      <div style={{ padding: '18px' }}>
        <h3 style={{ fontSize: '0.92rem', fontWeight: 'bold', marginBottom: '8px', lineHeight: 1.35, letterSpacing: '0.02em' }}>
          {event.title}
        </h3>

        {event.description && (
          <p style={{ color: '#444', fontSize: '0.73rem', marginBottom: '12px', lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {event.description}
          </p>
        )}

        <p style={{ color: '#777', fontSize: '0.78rem', marginBottom: '3px' }}>📅 {event.date}, {event.time}</p>
        <p style={{ color: '#777', fontSize: '0.78rem', marginBottom: '14px' }}>📍 {event.venue}</p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: isPaid ? '#fff' : '#00cc66' }}>
            {formatPrice(event)}
          </span>
          <span style={{ border: `1px solid ${meta.accent}`, color: meta.accent, padding: '5px 14px', fontSize: '10px', letterSpacing: '0.1em', fontWeight: 'bold' }}>
            VIEW →
          </span>
        </div>
      </div>
    </article>
  )
}

// ── ACCESS GUIDE JOURNEY COLUMN ───────────────────────────────────────────────

function JourneyColumn({ role, headline, tagline, steps, accent, ctaLabel, ctaAction, bg }) {
  return (
    <div style={{ background: bg, padding: '44px 48px' }}>
      {/* Role badge */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: `${accent}12`, border: `1px solid ${accent}30`, padding: '5px 14px', marginBottom: '20px', fontSize: '10px', letterSpacing: '0.18em', color: accent }}>
        {role}
      </div>
      <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', letterSpacing: '0.08em', marginBottom: '8px' }}>
        {headline.toUpperCase()}
      </h3>
      <p style={{ color: '#555', fontSize: '0.78rem', marginBottom: '32px', lineHeight: 1.65 }}>{tagline}</p>

      {/* Step timeline */}
      <ol style={{ listStyle: 'none', position: 'relative' }}>
        {steps.map((step, i) => (
          <li key={i} style={{ display: 'flex', gap: '16px', paddingBottom: i < steps.length - 1 ? '24px' : '0', position: 'relative' }}>
            {/* Vertical connector line */}
            {i < steps.length - 1 && (
              <div aria-hidden="true" style={{ position: 'absolute', left: '18px', top: '38px', width: '1px', height: 'calc(100% - 10px)', background: '#1a1a1a' }} />
            )}
            {/* Step number */}
            <div style={{ width: '36px', height: '36px', border: `1px solid ${accent}33`, background: `${accent}0e`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
              <span style={{ fontSize: '10px', fontWeight: 'bold', color: accent, letterSpacing: '0.05em' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
            </div>
            {/* Step text */}
            <div style={{ paddingTop: '8px' }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#ccc', marginBottom: '3px', letterSpacing: '0.02em' }}>
                {step.title}
              </p>
              <p style={{ fontSize: '0.72rem', color: '#555', lineHeight: 1.55 }}>{step.desc}</p>
            </div>
          </li>
        ))}
      </ol>

      {/* CTA button */}
      <button
        onClick={ctaAction}
        style={{ background: accent, color: '#fff', border: 'none', padding: '13px 24px', fontWeight: 'bold', fontSize: '11px', letterSpacing: '0.1em', width: '100%', marginTop: '32px', fontFamily: 'inherit' }}
        aria-label={ctaLabel}
      >
        {ctaLabel}
      </button>

      {/* Account lock note */}
      <p style={{ color: '#333', fontSize: '10px', marginTop: '12px', textAlign: 'center', letterSpacing: '0.05em' }}>
        🔒 {role === 'GUEST' ? 'Ticket access requires a Participant account' : 'Dashboard access requires a Host account'}
      </p>
    </div>
  )
}

// ── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function Homepage() {
  const [events,         setEvents]         = useState([])
  const [activeCategory, setActiveCategory] = useState('All')
  const [search,         setSearch]         = useState('')
  const [loading,        setLoading]        = useState(true)
  const [isLoggedIn,     setIsLoggedIn]     = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchEvents()
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
    } catch {
      setIsLoggedIn(false)
    }
  }

  async function fetchEvents() {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false })
      setEvents(!error && data?.length ? data : MOCK_EVENTS)
    } catch {
      setEvents(MOCK_EVENTS)
    }
    setLoading(false)
  }

  const filtered = events.filter(e =>
    (activeCategory === 'All' || e.category === activeCategory) &&
    (!search || e.title.toLowerCase().includes(search.toLowerCase()) || e.venue?.toLowerCase().includes(search.toLowerCase()))
  )

  const featured = events.find(e => e.status === 'live') || events[0]

  function scrollToEvents() {
    document.getElementById('events-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  // Redirect guests to login if not authenticated; hosts go to dashboard
  function handleTicketAction() {
    navigate(isLoggedIn ? '/tickets' : '/login')
  }

  function handleHostAction() {
    navigate(isLoggedIn ? '/dashboard' : '/login')
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', fontFamily: "'Courier New', monospace" }}>
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* ── STICKY NAVBAR ─────────────────────────────── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(14px)', borderBottom: '1px solid #181818' }}>
        <nav aria-label="Main navigation" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 48px' }}>
          <a href="/" aria-label="EventHub home" style={{ fontWeight: 'bold', fontSize: '1.15rem', letterSpacing: '0.18em' }}>
            EVENT<span style={{ color: '#4361ee' }}>●</span>HUB
          </a>
          <div style={{ display: 'flex', gap: '10px' }}>
            {isLoggedIn ? (
              <>
                <button style={solidBtn} onClick={() => navigate('/dashboard')}>DASHBOARD</button>
                <button style={solidBtn} onClick={() => navigate('/tickets')}>MY TICKETS</button>
              </>
            ) : (
              <>
                <a href="/login"><button style={outlineBtn}>LOG IN</button></a>
                <button style={solidBtn} onClick={() => navigate('/login')}>CREATE ACCOUNT</button>
              </>
            )}
          </div>
        </nav>
      </header>

      <main id="main-content">

        {/* ── HERO ──────────────────────────────────────── */}
        <section className="hero-bg" aria-labelledby="hero-heading" style={{ padding: '90px 48px 80px', position: 'relative', overflow: 'hidden' }}>
          <div aria-hidden="true" style={{ position: 'absolute', top: '-100px', right: '-80px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(67,97,238,0.13) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: '680px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(67,97,238,0.12)', border: '1px solid rgba(67,97,238,0.35)', padding: '6px 16px', marginBottom: '28px', fontSize: '10px', letterSpacing: '0.18em', color: '#7ca4ff' }}>
              <span aria-hidden="true">✦</span> LONDON'S PREMIER EVENT PLATFORM
            </div>

            <h1 id="hero-heading" style={{ fontSize: 'clamp(2.8rem, 6vw, 5rem)', fontWeight: 'bold', lineHeight: 1.0, letterSpacing: '0.02em', marginBottom: '22px' }}>
              FIND THE<br />
              <span style={{ color: '#4361ee' }}>BEST EVENTS</span><br />
              IN LONDON
            </h1>

            <p style={{ color: '#666', fontSize: '0.95rem', lineHeight: 1.75, marginBottom: '36px', maxWidth: '460px' }}>
              Thousands of music, business, food and arts events — all in one place. Get your tickets in seconds.
            </p>

            {/* Search */}
            <div role="search" style={{ display: 'flex', background: '#0e0e0e', border: '1px solid #2a2a2a', maxWidth: '540px', marginBottom: '18px' }}>
              <label htmlFor="event-search" style={{ position: 'absolute', left: '-9999px' }}>Search events</label>
              <input
                id="event-search"
                type="search"
                placeholder="Search events, artists, venues..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && scrollToEvents()}
                style={{ flex: 1, background: 'transparent', border: 'none', padding: '15px 20px', color: '#fff', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}
              />
              <button onClick={scrollToEvents} aria-label="Search" style={{ background: '#4361ee', border: 'none', padding: '11px 26px', color: '#fff', fontWeight: 'bold', fontSize: '12px', letterSpacing: '0.1em', margin: '5px', flexShrink: 0 }}>
                SEARCH →
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ color: '#444', fontSize: '10px', letterSpacing: '0.12em' }}>POPULAR:</span>
              {POPULAR_SEARCHES.map(tag => (
                <button key={tag} onClick={() => { setSearch(tag.split(' ')[0]); scrollToEvents() }} style={{ background: 'none', border: '1px solid #252525', color: '#666', padding: '4px 12px', fontSize: '11px', letterSpacing: '0.05em' }}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── STATS BAR ─────────────────────────────────── */}
        <section aria-label="Platform statistics" style={{ borderTop: '1px solid #111', borderBottom: '1px solid #111', background: '#070707' }}>
          <div className="stats-grid" style={{ maxWidth: '860px', margin: '0 auto' }}>
            {STATS.map((s, i) => (
              <div key={s.label} style={{ padding: '26px 20px', textAlign: 'center', borderRight: i < STATS.length - 1 ? '1px solid #111' : 'none' }}>
                <p style={{ fontSize: '1.9rem', fontWeight: 'bold', color: '#fff', marginBottom: '4px', letterSpacing: '0.04em' }}>{s.value}</p>
                <p style={{ fontSize: '10px', letterSpacing: '0.14em', color: '#444' }}>{s.label.toUpperCase()}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── ACCESS GUIDE ──────────────────────────────── */}
        <section aria-labelledby="access-heading" style={{ borderBottom: '1px solid #111' }}>
          <div style={{ padding: '44px 48px 32px', background: '#050505' }}>
            <p style={{ fontSize: '10px', letterSpacing: '0.22em', color: '#333', marginBottom: '8px' }}>ACCESS</p>
            <h2 id="access-heading" style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.7rem)', fontWeight: 'bold', letterSpacing: '0.06em', marginBottom: '8px' }}>
              HOW TO ACCESS YOUR EXPERIENCE
            </h2>
            <p style={{ color: '#444', fontSize: '0.8rem', lineHeight: 1.7, maxWidth: '560px' }}>
              Create a free account to unlock your full experience. Without an account you can browse, but cannot purchase tickets or manage events — your data stays private and secure behind your login.
            </p>
          </div>

          <div className="access-grid">
            <JourneyColumn
              role="GUEST"
              headline="For Event-Goers"
              tagline="Sign up as a Participant to browse, buy tickets, and collect your QR codes."
              steps={GUEST_STEPS}
              accent="#4361ee"
              ctaLabel="CREATE PARTICIPANT ACCOUNT →"
              ctaAction={() => navigate('/login')}
              bg="#000"
            />
            <JourneyColumn
              role="HOST"
              headline="For Organisers"
              tagline="Sign up as a Host to create events, track RSVPs, and check in guests."
              steps={HOST_STEPS}
              accent="#7209b7"
              ctaLabel="CREATE HOST ACCOUNT →"
              ctaAction={() => navigate('/login')}
              bg="#030307"
            />
          </div>
        </section>

        {/* ── CATEGORY FILTER ───────────────────────────── */}
        <section aria-label="Filter events by category" style={{ padding: '44px 48px 28px' }}>
          <p style={{ fontSize: '10px', letterSpacing: '0.22em', color: '#333', marginBottom: '16px' }}>BROWSE BY CATEGORY</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => {
              const meta = CAT_META[cat] || CAT_META.All
              const active = activeCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  aria-pressed={active}
                  style={{ background: active ? meta.accent : 'transparent', color: active ? '#fff' : '#666', border: `1px solid ${active ? meta.accent : '#222'}`, padding: '9px 22px', fontSize: '11px', letterSpacing: '0.1em', fontWeight: active ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '7px', transition: 'all 0.15s' }}
                >
                  <span aria-hidden="true">{meta.icon}</span>
                  {cat.toUpperCase()}
                </button>
              )
            })}
          </div>
        </section>

        {/* ── FEATURED EVENT ────────────────────────────── */}
        {featured && (
          <section aria-labelledby="featured-heading" style={{ padding: '0 48px 48px' }}>
            <p style={{ fontSize: '10px', letterSpacing: '0.22em', color: '#333', marginBottom: '16px' }}>FEATURED EVENT</p>

            <div
              onClick={handleTicketAction}
              role="button"
              tabIndex={0}
              aria-label={`Featured event: ${featured.title}. Click to get tickets.`}
              onKeyDown={e => e.key === 'Enter' && handleTicketAction()}
              style={{ position: 'relative', overflow: 'hidden', border: '1px solid #1e1e1e', minHeight: '320px', display: 'flex', alignItems: 'flex-end', cursor: 'pointer' }}
            >
              {/* Background: real image or gradient */}
              {featured.image_url ? (
                <img
                  src={featured.image_url}
                  alt={featured.title}
                  onError={e => { e.target.style.display = 'none' }}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                />
              ) : (
                <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: CAT_GRADIENT[featured.category] || CAT_GRADIENT.default }} />
              )}

              {/* Big faint category icon */}
              <div aria-hidden="true" style={{ position: 'absolute', top: '-10px', right: '40px', fontSize: '14rem', opacity: 0.05, lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>
                {CAT_META[featured.category]?.icon || '◈'}
              </div>

              {/* Dark overlay so text is always readable */}
              <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.92) 30%, rgba(0,0,0,0.35) 70%, rgba(0,0,0,0.2) 100%)' }} />

              {/* Content */}
              <div style={{ position: 'relative', zIndex: 1, padding: '40px 48px', width: '100%' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  {featured.status === 'live'
                    ? <span style={{ background: '#003018', color: '#00cc66', border: '1px solid #00cc66', padding: '4px 12px', fontSize: '10px', letterSpacing: '0.12em', fontWeight: 'bold' }}>● LIVE NOW</span>
                    : <span style={{ background: 'rgba(67,97,238,0.2)', color: '#7ca4ff', border: '1px solid rgba(67,97,238,0.4)', padding: '4px 12px', fontSize: '10px', letterSpacing: '0.12em' }}>FEATURED</span>
                  }
                  <span style={{ background: 'rgba(255,255,255,0.08)', color: '#888', padding: '4px 12px', fontSize: '10px', letterSpacing: '0.1em' }}>
                    {featured.category.toUpperCase()}
                  </span>
                </div>

                <h2 id="featured-heading" style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.8rem)', fontWeight: 'bold', letterSpacing: '0.03em', marginBottom: '12px', maxWidth: '640px', lineHeight: 1.1 }}>
                  {featured.title.toUpperCase()}
                </h2>

                {featured.description && (
                  <p style={{ color: '#aaa', fontSize: '0.82rem', marginBottom: '16px', maxWidth: '460px', lineHeight: 1.65 }}>
                    {featured.description}
                  </p>
                )}

                <p style={{ color: '#777', fontSize: '0.82rem', marginBottom: '24px' }}>
                  📅 {featured.date}, {featured.time}&nbsp;&nbsp;·&nbsp;&nbsp;
                  📍 {featured.venue}&nbsp;&nbsp;·&nbsp;&nbsp;
                  <span style={{ color: featured.price === 0 ? '#00cc66' : '#fff', fontWeight: 'bold' }}>
                    {formatPrice(featured)}
                  </span>
                </p>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    style={{ background: '#4361ee', color: '#fff', border: 'none', padding: '13px 32px', fontWeight: 'bold', fontSize: '12px', letterSpacing: '0.12em', fontFamily: 'inherit' }}
                    aria-label={isLoggedIn ? 'Get tickets' : 'Sign in to get tickets'}
                  >
                    {isLoggedIn ? 'GET TICKETS →' : 'SIGN IN TO GET TICKETS →'}
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '140px', height: '3px', background: '#222', borderRadius: '2px', overflow: 'hidden' }} aria-hidden="true">
                      <div style={{ height: '100%', width: `${Math.min(100, (featured.tickets_sold / featured.capacity) * 100)}%`, background: '#4361ee' }} />
                    </div>
                    <span style={{ color: '#555', fontSize: '11px' }}>{featured.tickets_sold}/{featured.capacity} sold</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── EVENTS GRID ───────────────────────────────── */}
        <section id="events-section" aria-labelledby="events-heading" style={{ padding: '0 48px 72px' }}>
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <p style={{ fontSize: '10px', letterSpacing: '0.22em', color: '#333', marginBottom: '6px' }}>
                {activeCategory === 'All' ? 'ALL EVENTS' : activeCategory.toUpperCase()}
              </p>
              <h2 id="events-heading" style={{ fontSize: '1.6rem', fontWeight: 'bold', letterSpacing: '0.04em' }}>
                {loading ? '...' : `${filtered.length} Event${filtered.length !== 1 ? 's' : ''} Found`}
              </h2>
            </div>
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: '1px solid #222', color: '#666', padding: '8px 16px', fontSize: '11px', letterSpacing: '0.08em' }} aria-label="Clear search">
                CLEAR ✕
              </button>
            )}
          </div>

          {/* Sign-in callout for non-logged-in users */}
          {!isLoggedIn && (
            <div role="note" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#060610', border: '1px solid #1e1e3a', padding: '12px 18px', marginBottom: '24px', fontSize: '12px', color: '#666', flexWrap: 'wrap' }}>
              <span style={{ color: '#4361ee', fontSize: '14px' }}>🔒</span>
              <span>
                Browsing is free —{' '}
                <button
                  onClick={() => navigate('/login')}
                  style={{ background: 'none', border: 'none', color: '#4361ee', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', padding: 0 }}
                >
                  sign in or create a free account
                </button>
                {' '}to purchase tickets and access your bookings.
              </span>
            </div>
          )}

          {loading ? (
            <p role="status" aria-live="polite" style={{ color: '#333', padding: '60px 0', textAlign: 'center', letterSpacing: '0.1em' }}>LOADING EVENTS...</p>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#333' }}>
              <p style={{ fontSize: '3rem', marginBottom: '16px' }}>◈</p>
              <p style={{ fontSize: '0.9rem', letterSpacing: '0.08em', marginBottom: '8px' }}>NO EVENTS FOUND</p>
              <p style={{ fontSize: '0.75rem', color: '#2a2a2a' }}>Try a different category or clear your search</p>
            </div>
          ) : (
            <div className="events-grid" role="list">
              {filtered.map(event => (
                <div key={event.id} role="listitem">
                  <EventCard event={event} onAction={handleTicketAction} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── HOW IT WORKS ──────────────────────────────── */}
        <section aria-labelledby="how-heading" style={{ padding: '80px 48px', background: '#050505', borderTop: '1px solid #111', borderBottom: '1px solid #111' }}>
          <p style={{ fontSize: '10px', letterSpacing: '0.22em', color: '#333', marginBottom: '10px', textAlign: 'center' }}>PROCESS</p>
          <h2 id="how-heading" style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 'bold', letterSpacing: '0.08em', textAlign: 'center', marginBottom: '56px' }}>
            HOW IT WORKS
          </h2>

          <div className="how-grid">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step} style={{ textAlign: 'center', position: 'relative' }}>
                {i < 2 && (
                  <div aria-hidden="true" style={{ position: 'absolute', top: '27px', left: '58%', right: '-42%', height: '1px', background: 'linear-gradient(to right, #1e1e1e, #111)', zIndex: 0 }} />
                )}
                <div style={{ position: 'relative', zIndex: 1, width: '54px', height: '54px', border: '1px solid #222', background: '#0c0c0c', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#4361ee', letterSpacing: '0.05em' }}>{item.step}</span>
                </div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '0.12em', marginBottom: '10px' }}>{item.title.toUpperCase()}</h3>
                <p style={{ color: '#444', fontSize: '0.78rem', lineHeight: 1.75 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOST CTA ──────────────────────────────────── */}
        <section aria-labelledby="host-heading" style={{ padding: '80px 48px', background: 'linear-gradient(135deg, #040410 0%, #08051e 50%, #040410 100%)', borderBottom: '1px solid #111', position: 'relative', overflow: 'hidden' }}>
          <div aria-hidden="true" style={{ position: 'absolute', top: '-80px', right: '-60px', width: '450px', height: '450px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(114,9,183,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div aria-hidden="true" style={{ position: 'absolute', bottom: '-60px', left: '30%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(67,97,238,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ maxWidth: '580px', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(114,9,183,0.1)', border: '1px solid rgba(114,9,183,0.25)', padding: '5px 14px', marginBottom: '22px', fontSize: '10px', letterSpacing: '0.16em', color: '#c060ff' }}>
              <span aria-hidden="true">◉</span> FOR EVENT ORGANISERS
            </div>

            <h2 id="host-heading" style={{ fontSize: 'clamp(1.8rem, 4.5vw, 3.2rem)', fontWeight: 'bold', lineHeight: 1.05, letterSpacing: '0.03em', marginBottom: '18px' }}>
              READY TO HOST<br />YOUR OWN EVENT?
            </h2>

            <p style={{ color: '#555', fontSize: '0.88rem', lineHeight: 1.8, marginBottom: '32px', maxWidth: '420px' }}>
              Create your event in minutes. Manage RSVPs, track ticket sales, check in guests with QR codes, and monitor revenue — all from one dashboard. You must have a Host account to access event data.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '28px' }}>
              <button onClick={handleHostAction} style={{ background: '#7209b7', color: '#fff', border: 'none', padding: '14px 34px', fontWeight: 'bold', fontSize: '12px', letterSpacing: '0.12em', fontFamily: 'inherit' }}>
                {isLoggedIn ? 'OPEN DASHBOARD →' : 'SIGN UP AS HOST →'}
              </button>
              <button onClick={() => navigate('/login')} style={{ background: 'transparent', color: '#666', border: '1px solid #222', padding: '14px 28px', fontSize: '12px', letterSpacing: '0.08em', fontFamily: 'inherit' }}>
                LOG IN
              </button>
            </div>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {['Free to create', 'QR check-in', 'Live analytics', 'Email confirmations'].map(f => (
                <span key={f} style={{ color: '#444', fontSize: '11px', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#00cc66' }}>✓</span> {f.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}

// ── BUTTON STYLES ────────────────────────────────────────────────────────────

const solidBtn = {
  background: '#4361ee', color: '#fff', border: 'none',
  padding: '10px 20px', fontWeight: 'bold', fontSize: '11px', letterSpacing: '0.08em',
}

const outlineBtn = {
  background: 'transparent', color: '#bbb', border: '1px solid #2a2a2a',
  padding: '10px 20px', fontWeight: 'bold', fontSize: '11px', letterSpacing: '0.08em',
}
