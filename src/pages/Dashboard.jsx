import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '../supabaseClient'
import Footer from '../components/Footer'

const STATUS_LABELS = {
  upcoming: 'Upcoming',
  live: 'Live',
  completed: 'Completed',
  sold_out: 'Sold Out',
}

const STATUS_COLORS = {
  upcoming: '#aaa',
  live: '#00cc66',
  completed: '#aaa',
  sold_out: '#ff4444',
}

const MOCK_EVENTS = [
  { id: 1, title: 'Gymshark Battle Stations', status: 'live', price: 15, capacity: 100, tickets_sold: 72, checked_in: 18, date: 'Sat 6 Jun 2026', time: '09:00', venue: 'Exhibition White City', category: 'Hobbies' },
  { id: 2, title: 'Your Best Recovery Yet', status: 'upcoming', price: 15, capacity: 50, tickets_sold: 20, checked_in: 0, date: 'Sat 14 Jun 2026', time: '09:00', venue: 'Kachette', category: 'Food & Drink' },
  { id: 3, title: 'Tech Startup Summit 2026', status: 'upcoming', price: 99, capacity: 300, tickets_sold: 150, checked_in: 0, date: 'Mon 1 Jul 2026', time: '10:00', venue: 'ExCeL London', category: 'Business' },
]

// Maps DB event_date (ISO string) → readable display string
function formatEventDate(dateStr) {
  if (!dateStr) return 'TBD'
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    })
  } catch { return dateStr }
}

// Normalises a Supabase event row → shape the rest of the UI expects
function normalizeEvent(e) {
  const rsvps = e.rsvps || []
  return {
    ...e,
    date:         formatEventDate(e.event_date),
    capacity:     parseInt(e.max_capacity) || 0,
    // Computed from rsvps array (Member 2 manages these statuses)
    tickets_sold: rsvps.filter(r => r.status === 'accepted' || r.status === 'attended').length,
    checked_in:   rsvps.filter(r => r.status === 'attended').length,
    status:       e.status   || 'upcoming',
    price:        e.price    || 0,
    venue:        e.venue    || 'TBD',
  }
}

const EMPTY_FORM = {
  title: '', date: '', time: '', venue: '', category: 'Music', price: '', capacity: '', description: '', image_url: '',
}

export default function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [events, setEvents] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [isHost, setIsHost] = useState(false)
  const [notification, setNotification] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const navigate = useNavigate()

  useEffect(() => {
    fetchHostEvents()
    checkRole()
  }, [])

  useEffect(() => {
    let channel
    try {
      channel = supabase
        .channel('host-rsvp-alerts')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rsvps' }, () => {
          setNotification('New RSVP just received! Refreshing dashboard...')
          fetchHostEvents()
          setTimeout(() => setNotification(null), 6000)
        })
        .subscribe()
    } catch {
      // Realtime unavailable — silently degrade, manual refresh still works
    }
    return () => { if (channel) supabase.removeChannel(channel).catch(() => {}) }
  }, [])

  async function checkRole() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
      const role = profile?.role ?? session.user.user_metadata?.role ?? 'participant'
      setIsHost(role === 'host')
    } catch { }
  }

  async function fetchHostEvents() {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // Actual schema: events(id, title, event_date, max_capacity, host_id)
        // Join rsvps so we can compute tickets_sold and checked_in counts
        const { data, error } = await supabase
          .from('events')
          .select('id, title, event_date, max_capacity, host_id, rsvps(id, status)')
          .eq('host_id', session.user.id)
          .order('event_date', { ascending: true })
        if (!error && data && data.length > 0) {
          setEvents(data.map(normalizeEvent))
          setLoading(false)
          return
        }
      }
    } catch {
      // fall through to mock data
    }
    setEvents(MOCK_EVENTS)
    setLoading(false)
  }

  async function handleCreateEvent(e) {
    e.preventDefault()
    setSaving(true)
    setSaveMsg('')
    try {
      const { data: { session } } = await supabase.auth.getSession()

      // Columns guaranteed in actual Supabase schema right now:
      const corePayload = {
        title:        form.title,
        event_date:   form.date,              // DB column name is event_date
        max_capacity: String(form.capacity),  // DB column is text type
        ...(session ? { host_id: session.user.id } : {}),
      }

      // Extra columns — automatically work once Member 2 adds them to events table:
      const fullPayload = {
        ...corePayload,
        ...(form.time        && { time: form.time }),
        ...(form.venue       && { venue: form.venue }),
        price: form.price !== '' ? Number(form.price) : 0,
        ...(form.category    && { category: form.category }),
        ...(form.description && { description: form.description }),
        ...(form.image_url   && { image_url: form.image_url }),
        status: 'upcoming',
      }

      // Try full payload first; if extra columns don't exist yet, retry with core only
      let result = await supabase.from('events').insert([fullPayload]).select()
      if (result.error) {
        result = await supabase.from('events').insert([corePayload]).select()
      }
      if (result.error) throw result.error

      setSaveMsg('Event created successfully!')
      if (result.data) setEvents(prev => [normalizeEvent(result.data[0]), ...prev])
      setForm(EMPTY_FORM)
      setShowCreateForm(false)
    } catch {
      setSaveMsg('Could not save to database. Saved locally for now.')
      const localEvent = {
        id: Date.now(), title: form.title, date: form.date,
        capacity: Number(form.capacity), tickets_sold: 0, checked_in: 0,
        status: 'upcoming', price: Number(form.price) || 0,
        venue: form.venue, category: form.category,
      }
      setEvents(prev => [localEvent, ...prev])
      setForm(EMPTY_FORM)
      setShowCreateForm(false)
    }
    setSaving(false)
    setTimeout(() => setSaveMsg(''), 4000)
  }

  function toggleExpand(id) {
    setExpandedId(prev => (prev === id ? null : id))
  }

  function startEdit(event) {
    setEditingId(event.id)
    setEditForm({
      title:       event.title       || '',
      date:        event.event_date  || event.date || '',
      time:        event.time        || '',
      venue:       event.venue       || '',
      category:    event.category    || 'Music',
      price:       event.price != null ? String(event.price) : '',
      capacity:    event.capacity    ? String(event.capacity) : '',
      description: event.description || '',
      image_url:   event.image_url   || '',
    })
  }

  async function handleEditSave(eventId) {
    setSaving(true)
    try {
      const payload = {
        title:        editForm.title,
        event_date:   editForm.date,
        max_capacity: String(editForm.capacity),
        time:         editForm.time        || null,
        venue:        editForm.venue       || null,
        price:        editForm.price !== '' ? Number(editForm.price) : 0,
        category:     editForm.category    || null,
        description:  editForm.description || null,
        image_url:    editForm.image_url   || null,
      }
      const { error } = await supabase.from('events').update(payload).eq('id', eventId)
      if (!error) {
        setEvents(prev => prev.map(e => e.id === eventId ? { ...e, ...payload, capacity: parseInt(payload.max_capacity) || 0 } : e))
        setSaveMsg('Event updated!')
      } else {
        setSaveMsg('Update failed — try again.')
      }
    } catch {
      setSaveMsg('Update failed — try again.')
    }
    setEditingId(null)
    setSaving(false)
    setTimeout(() => setSaveMsg(''), 3000)
  }

  async function handleDelete(eventId) {
    if (!window.confirm('Delete this event permanently? This cannot be undone.')) return
    try {
      await supabase.from('events').delete().eq('id', eventId)
    } catch { /* optimistic — remove from UI regardless */ }
    setEvents(prev => prev.filter(e => e.id !== eventId))
    if (expandedId === eventId) setExpandedId(null)
    setSaveMsg('Event deleted.')
    setTimeout(() => setSaveMsg(''), 3000)
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', fontFamily: "'Courier New', monospace", position: 'relative', overflow: 'hidden' }}>
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Decorative shapes (aria-hidden) */}
      <div aria-hidden="true">
        {[{ top: '120px', left: '20px', size: 30 }, { top: '200px', left: '50px', size: 20 }, { top: '280px', left: '30px', size: 25 }, { top: '340px', left: '60px', size: 18 }].map((s, i) => (
          <div key={i} style={{ position: 'absolute', top: s.top, left: s.left, width: s.size, height: s.size, color: '#222', fontSize: s.size, lineHeight: 1, userSelect: 'none' }}>✦</div>
        ))}
        {/* Smiley circle */}
        <div style={{ position: 'absolute', top: '80px', right: '40px', width: '130px', height: '130px', borderRadius: '50%', background: '#FFD700', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '38%', left: '28%', width: '14px', height: '14px', borderRadius: '50%', background: '#000' }} />
          <div style={{ position: 'absolute', top: '38%', right: '28%', width: '14px', height: '14px', borderRadius: '50%', background: '#000' }} />
          <div style={{ position: 'absolute', bottom: '28%', left: '22%', width: '56%', height: '16px', borderBottom: '3px solid #000', borderRadius: '0 0 50px 50px' }} />
        </div>
        {/* Yellow star left */}
        <div style={{ position: 'absolute', top: '300px', left: '15px', color: '#FFD700', fontSize: '28px', userSelect: 'none' }}>✦</div>
      </div>

      {/* Sidebar menu overlay */}
      {menuOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100 }}
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      <nav
        aria-label="Sidebar navigation"
        aria-hidden={!menuOpen}
        style={{
          position: 'fixed', top: 0, left: 0, height: '100vh', width: '240px',
          background: '#fff', color: '#000', zIndex: 200, padding: '30px 0',
          display: 'flex', flexDirection: 'column',
          transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
          boxShadow: menuOpen ? '4px 0 20px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        {[
          { label: 'Home', action: () => navigate('/') },
          ...(isHost ? [{ label: 'Create Event', action: () => { setShowCreateForm(true); setMenuOpen(false) } }] : []),
          { label: 'My Tickets', action: () => navigate('/tickets') },
          ...(isHost ? [{ label: 'Check In Guests', action: () => navigate('/checkin') }] : []),
          { label: 'Help', action: () => navigate('/contact') },
          { label: 'Log Out', action: async () => { await supabase.auth.signOut(); navigate('/login') } },
        ].map(item => (
          <button
            key={item.label}
            onClick={item.action}
            style={sidebarItem}
            tabIndex={menuOpen ? 0 : -1}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Top bar */}
      <header>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 40px' }}>
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            ☰
          </button>
          <nav aria-label="Top navigation" style={{ display: 'flex', gap: '10px' }}>
            <button style={navBtn} onClick={() => navigate('/contact')}>HELP</button>
            <button style={navBtn} onClick={() => navigate('/tickets')}>MY TICKETS</button>
            <button style={navBtn} onClick={() => navigate('/')}>HOME</button>
          </nav>
        </div>
        <hr style={{ borderColor: '#222' }} />
      </header>

      <main id="main-content" style={{ padding: '40px', position: 'relative', zIndex: 1 }}>
        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 'bold', marginBottom: '12px' }}>Dashboard</h1>
          <p style={{ color: '#aaa', letterSpacing: '0.08em', fontSize: '0.85rem' }}>
            MANAGE YOUR EVENTS, TRACK RESERVATIONS,<br />
            AND MONITOR TICKET AVAILABILITY.
          </p>
        </div>

        {/* Live RSVP notification banner */}
        {notification && (
          <div role="alert" aria-live="assertive" style={{ background: '#001a00', border: '1px solid #00cc66', color: '#00cc66', padding: '14px 20px', marginBottom: '20px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '0.04em', animation: 'slideDown 0.3s ease' }}>
            <span aria-hidden="true" className="pulse-dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00cc66', flexShrink: 0, display: 'inline-block' }} />
            {notification}
          </div>
        )}

        {/* Save message */}
        {saveMsg && (
          <div role="status" aria-live="polite" style={{ background: '#003300', border: '1px solid #00cc66', color: '#00cc66', padding: '10px 16px', marginBottom: '20px', fontSize: '0.85rem' }}>
            {saveMsg}
          </div>
        )}

        {/* Create New Event — hosts only */}
        {!isHost && (
          <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '20px', marginBottom: '32px', textAlign: 'center' }}>
            <p style={{ color: '#555', fontSize: '0.85rem', letterSpacing: '0.06em' }}>
              ⚠ Only hosts can create events.{' '}
              <span style={{ color: '#4361ee', cursor: 'pointer' }} onClick={() => navigate('/login')}>
                Sign up as a host
              </span>{' '}
              to unlock this feature.
            </p>
          </div>
        )}
        <section aria-labelledby="create-heading" style={{ marginBottom: '32px', display: isHost ? 'block' : 'none' }}>
          <button
            id="create-heading"
            onClick={() => setShowCreateForm(v => !v)}
            aria-expanded={showCreateForm}
            style={accordionBtn}
          >
            + CREATE NEW EVENT
          </button>

          {showCreateForm && (
            <form onSubmit={handleCreateEvent} style={formStyle} aria-label="Create new event form">
              <div style={formGrid}>
                <label style={labelStyle}>
                  Event Title *
                  <input required style={inputStyle} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. London Music Night" />
                </label>
                <label style={labelStyle}>
                  Date *
                  <input required type="date" style={inputStyle} value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                </label>
                <label style={labelStyle}>
                  Time *
                  <input required type="time" style={inputStyle} value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} />
                </label>
                <label style={labelStyle}>
                  Venue *
                  <input required style={inputStyle} value={form.venue} onChange={e => setForm(p => ({ ...p, venue: e.target.value }))} placeholder="e.g. O2 Arena, London" />
                </label>
                <label style={labelStyle}>
                  Category *
                  <select required style={inputStyle} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                    {['Music', 'Business', 'Hobbies', 'Food & Drink', 'Performing & Visual Arts'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label style={labelStyle}>
                  Ticket Price (£) — leave 0 for free
                  <input type="number" min="0" style={inputStyle} value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="0" />
                </label>
                <label style={labelStyle}>
                  Capacity *
                  <input required type="number" min="1" style={inputStyle} value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} placeholder="e.g. 100" />
                </label>
                <label style={{ ...labelStyle, gridColumn: 'span 2' }}>
                  Event Photo URL — optional (paste an image link)
                  <input style={inputStyle} value={form.image_url} onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))} placeholder="https://images.unsplash.com/..." />
                </label>
                <label style={{ ...labelStyle, gridColumn: 'span 2' }}>
                  Description
                  <textarea style={{ ...inputStyle, height: '80px', resize: 'vertical' }} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional event description..." />
                </label>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="submit" disabled={saving} style={submitBtn}>
                  {saving ? 'SAVING...' : 'CREATE EVENT'}
                </button>
                <button type="button" onClick={() => { setShowCreateForm(false); setForm(EMPTY_FORM) }} style={cancelBtn}>
                  CANCEL
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Current Events */}
        <section aria-labelledby="events-heading">
          <button
            id="events-heading"
            onClick={() => setExpandedId(expandedId ? null : (events[0]?.id ?? null))}
            style={accordionBtn}
          >
            + CURRENT EVENTS
          </button>

          {loading ? (
            <p role="status" aria-live="polite" style={{ color: '#666', padding: '20px 0 0 16px' }}>Loading events...</p>
          ) : events.length === 0 ? (
            <p style={{ color: '#666', padding: '16px 0 0 16px' }}>No events yet. Create your first event above.</p>
          ) : (
            <ul style={{ listStyle: 'none', marginTop: '16px' }}>
              {events.map(event => (
                <li key={event.id} style={{ marginBottom: '8px' }}>
                  <button
                    onClick={() => toggleExpand(event.id)}
                    aria-expanded={expandedId === event.id}
                    style={eventRowBtn}
                  >
                    -{event.title}
                    <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#666' }}>
                      {expandedId === event.id ? '▲' : '▼'}
                    </span>
                  </button>

                  {expandedId === event.id && editingId === event.id ? (
                    <div style={{ ...statsCard, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <p style={{ fontSize: '12px', color: '#aaa', letterSpacing: '0.08em', marginBottom: '4px' }}>EDIT EVENT</p>
                      {[
                        { label: 'Title',       key: 'title',       type: 'text'   },
                        { label: 'Date',        key: 'date',        type: 'date'   },
                        { label: 'Time',        key: 'time',        type: 'time'   },
                        { label: 'Venue',       key: 'venue',       type: 'text'   },
                        { label: 'Price (£)',   key: 'price',       type: 'number' },
                        { label: 'Capacity',    key: 'capacity',    type: 'number' },
                        { label: 'Image URL',   key: 'image_url',   type: 'text'   },
                      ].map(({ label, key, type }) => (
                        <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: '#888', letterSpacing: '0.06em' }}>
                          {label}
                          <input
                            type={type} value={editForm[key]}
                            onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))}
                            style={inputStyle}
                          />
                        </label>
                      ))}
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: '#888', letterSpacing: '0.06em' }}>
                        Description
                        <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} style={{ ...inputStyle, height: '72px', resize: 'vertical' }} />
                      </label>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                        <button onClick={() => handleEditSave(event.id)} disabled={saving} style={submitBtn}>{saving ? 'SAVING...' : 'SAVE CHANGES'}</button>
                        <button onClick={() => setEditingId(null)} style={cancelBtn}>CANCEL</button>
                      </div>
                    </div>
                  ) : expandedId === event.id ? (
                    <EventStats
                      event={event}
                      onCheckinNav={() => navigate('/checkin')}
                      onEdit={() => startEdit(event)}
                      onDelete={() => handleDelete(event.id)}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}

function EventStats({ event, onCheckinNav, onEdit, onDelete }) {
  const revenue = (event.price || 0) * (event.tickets_sold || 0)
  const remaining = (event.capacity || 0) - (event.tickets_sold || 0)

  return (
    <div style={statsCard} role="region" aria-label={`Stats for ${event.title}`}>
      {/* Status row */}
      <div style={{ marginBottom: '18px' }}>
        <span style={{ fontSize: '0.8rem', color: '#aaa', marginRight: '12px' }}>Status:</span>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <span
            key={key}
            style={{
              marginRight: '12px',
              color: event.status === key ? STATUS_COLORS[key] : '#555',
              fontWeight: event.status === key ? 'bold' : 'normal',
              fontSize: '0.85rem',
            }}
            aria-current={event.status === key ? 'true' : undefined}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Ticket info */}
      <div style={{ marginBottom: '14px' }}>
        <p style={statLabel}>Ticket Information:</p>
        <div style={{ paddingLeft: '20px', lineHeight: 2, fontSize: '0.85rem', color: '#ccc' }}>
          <p>Ticket Price: {event.price ? `£${event.price}` : 'Free'}</p>
          <p>Capacity: {event.capacity}</p>
          <p>Tickets Sold: {event.tickets_sold ?? 0}</p>
          <p>Tickets Remaining: {Math.max(0, remaining)}</p>
        </div>
      </div>

      <p style={{ ...statLabel, marginBottom: '14px' }}>
        Total Revenue: £{revenue.toLocaleString()}
      </p>
      <p style={{ ...statLabel, marginBottom: '14px' }}>
        Registered Attendees: {event.tickets_sold ?? 0}
      </p>
      <p style={{ ...statLabel, marginBottom: '20px' }}>
        Checked-in Guests: {event.checked_in ?? 0}
      </p>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={onCheckinNav} style={checkinBtn} aria-label={`Open check-in scanner for ${event.title}`}>
          OPEN CHECK-IN SCANNER →
        </button>
        <button onClick={onEdit} style={{ ...checkinBtn, background: '#1a1a4a', color: '#7ca4ff' }} aria-label={`Edit ${event.title}`}>
          EDIT EVENT ✎
        </button>
        <button onClick={onDelete} style={{ ...checkinBtn, background: '#1a0000', color: '#ff4444' }} aria-label={`Delete ${event.title}`}>
          DELETE ✕
        </button>
      </div>
    </div>
  )
}

const navBtn = {
  background: '#4361ee', color: '#fff', border: 'none',
  padding: '10px 20px', fontWeight: 'bold', fontSize: '13px',
  letterSpacing: '0.05em', fontFamily: 'inherit', cursor: 'pointer',
}

const sidebarItem = {
  background: 'none', border: 'none', borderBottom: '1px solid #ddd',
  padding: '18px 30px', textAlign: 'left', fontSize: '1rem',
  cursor: 'pointer', fontFamily: 'inherit', color: '#000',
  width: '100%',
}

const accordionBtn = {
  background: 'none', border: 'none', color: '#fff',
  fontSize: '1.1rem', fontWeight: 'bold', letterSpacing: '0.08em',
  cursor: 'pointer', fontFamily: 'inherit', padding: '0',
  display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
}

const eventRowBtn = {
  background: 'none', border: 'none', color: '#ccc',
  fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit',
  padding: '8px 0 8px 16px', display: 'flex', alignItems: 'center',
  width: '100%', textAlign: 'left',
}

const statsCard = {
  background: '#2a1050',
  border: '1px solid #4a2080',
  padding: '24px 28px',
  marginTop: '12px',
  marginLeft: '16px',
  maxWidth: '600px',
}

const statLabel = {
  fontSize: '0.85rem',
  color: '#ddd',
  letterSpacing: '0.02em',
}

const formStyle = {
  background: '#111',
  border: '1px solid #333',
  padding: '28px',
  marginTop: '16px',
  maxWidth: '760px',
}

const formGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
}

const labelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  fontSize: '12px',
  color: '#aaa',
  letterSpacing: '0.04em',
}

const inputStyle = {
  background: 'transparent',
  border: '1px solid #444',
  color: '#fff',
  padding: '10px 12px',
  fontSize: '14px',
  fontFamily: 'inherit',
  width: '100%',
}

const submitBtn = {
  background: '#4361ee', color: '#fff', border: 'none',
  padding: '12px 28px', fontWeight: 'bold', fontFamily: 'inherit',
  fontSize: '14px', cursor: 'pointer', letterSpacing: '0.05em',
}

const cancelBtn = {
  background: 'transparent', color: '#aaa',
  border: '1px solid #444', padding: '12px 28px',
  fontFamily: 'inherit', fontSize: '14px', cursor: 'pointer',
}

const checkinBtn = {
  background: '#4361ee', color: '#fff', border: 'none',
  padding: '10px 20px', fontWeight: 'bold', fontSize: '12px',
  letterSpacing: '0.06em', fontFamily: 'inherit', cursor: 'pointer',
}
