import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { supabase } from '../supabase.js/client'

const MOCK_TICKETS = {
  'EVT-10324': { name: 'Alex Johnson', event: 'Your Best Recovery Yet', status: 'registered' },
  'EVT-76492': { name: 'Sam Williams', event: 'Gymshark Battle Stations', status: 'registered' },
  'EVT-00001': { name: 'Jamie Lee', event: 'Gymshark Battle Stations', status: 'attended' },
}

export default function CheckIn() {
  const [scanResult, setScanResult] = useState(null)
  const [ticketInfo, setTicketInfo] = useState(null)
  const [status, setStatus] = useState(null) // 'success' | 'already' | 'notfound'
  const [scanning, setScanning] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [recentCheckIns, setRecentCheckIns] = useState([])
  const scannerRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!scanning) return

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1.0, showTorchButtonIfSupported: true },
      false
    )

    scanner.render(
      (decoded) => {
        setScanResult(decoded)
        setScanning(false)
        scanner.clear().catch(() => {})
        lookupTicket(decoded)
      },
      () => {} // ignore frame errors
    )

    scannerRef.current = scanner

    return () => {
      scanner.clear().catch(() => {})
    }
  }, [scanning])

  async function lookupTicket(code) {
    try {
      const { data, error } = await supabase
        .from('rsvps')
        .select('id, status, event:events(title), guest:profiles(email)')
        .eq('id', code)
        .single()

      if (error || !data) throw new Error('not found')

      setTicketInfo({
        name: data.guest?.email ?? 'Unknown',
        event: data.event?.title ?? 'Unknown Event',
        status: data.status,
        id: data.id,
      })

      if (data.status === 'attended') {
        setStatus('already')
      } else {
        setStatus('found')
      }
    } catch {
      // Fall back to mock data
      const mock = MOCK_TICKETS[code]
      if (mock) {
        setTicketInfo({ ...mock, id: null })
        setStatus(mock.status === 'attended' ? 'already' : 'found')
      } else {
        setTicketInfo(null)
        setStatus('notfound')
      }
    }
  }

  async function confirmCheckIn() {
    setConfirming(true)
    try {
      if (ticketInfo?.id) {
        await supabase.from('rsvps').update({ status: 'attended' }).eq('id', ticketInfo.id)
      }
      setStatus('success')
      setRecentCheckIns(prev => [
        { code: scanResult, name: ticketInfo?.name, event: ticketInfo?.event, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 9),
      ])
    } catch {
      setStatus('success') // optimistic — still record locally
      setRecentCheckIns(prev => [
        { code: scanResult, name: ticketInfo?.name, event: ticketInfo?.event, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 9),
      ])
    }
    setConfirming(false)
  }

  function resetScanner() {
    setScanResult(null)
    setTicketInfo(null)
    setStatus(null)
    setScanning(true)
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', fontFamily: "'Courier New', monospace" }}>
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Header */}
      <header>
        <nav aria-label="Check-in navigation" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 40px' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', letterSpacing: '0.05em' }}
            aria-label="Back to dashboard"
          >
            ← BACK TO DASHBOARD
          </button>
          <button style={navBtn} onClick={() => navigate('/')} aria-label="Go home">HOME</button>
        </nav>
        <hr style={{ borderColor: '#222' }} />
      </header>

      <main id="main-content" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', letterSpacing: '0.08em', marginBottom: '8px' }}>
          CHECK IN GUESTS
        </h1>
        <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '36px', letterSpacing: '0.04em' }}>
          SCAN A GUEST'S QR CODE TO VERIFY AND CHECK THEM IN.
        </p>

        {/* Live region for screen readers */}
        <div aria-live="polite" aria-atomic="true" className="sr-only" style={{ position: 'absolute', left: '-9999px' }}>
          {status === 'success' && `${ticketInfo?.name} successfully checked in.`}
          {status === 'already' && `${ticketInfo?.name} has already been checked in.`}
          {status === 'notfound' && 'Ticket not found.'}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'start' }}>
          {/* Left: Scanner or result */}
          <div>
            {scanning ? (
              <div>
                <div id="qr-reader" style={{ border: '2px solid #333', borderRadius: '4px', overflow: 'hidden' }} />
                <p style={{ color: '#666', fontSize: '12px', marginTop: '12px', textAlign: 'center' }}>
                  Point camera at guest QR code
                </p>
              </div>
            ) : (
              <div style={resultBox(status)}>
                {status === 'found' && (
                  <>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }} aria-hidden="true">✓</div>
                    <p style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '4px' }}>TICKET FOUND</p>
                    <p style={{ fontSize: '0.85rem', color: '#ccc', marginBottom: '4px' }}>{ticketInfo?.name}</p>
                    <p style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '20px' }}>{ticketInfo?.event}</p>
                    <p style={{ fontSize: '11px', color: '#888', marginBottom: '20px', letterSpacing: '0.08em' }}>CODE: {scanResult}</p>
                    <button
                      onClick={confirmCheckIn}
                      disabled={confirming}
                      style={confirmBtn}
                      aria-label={`Confirm check-in for ${ticketInfo?.name}`}
                    >
                      {confirming ? 'CHECKING IN...' : 'CONFIRM CHECK-IN'}
                    </button>
                  </>
                )}

                {status === 'success' && (
                  <>
                    <div style={{ fontSize: '32px', marginBottom: '12px', color: '#00cc66' }} aria-hidden="true">✓</div>
                    <p style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '4px', color: '#00cc66' }}>CHECKED IN!</p>
                    <p style={{ fontSize: '0.85rem', color: '#ccc', marginBottom: '4px' }}>{ticketInfo?.name}</p>
                    <p style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '24px' }}>{ticketInfo?.event}</p>
                  </>
                )}

                {status === 'already' && (
                  <>
                    <div style={{ fontSize: '32px', marginBottom: '12px', color: '#ffaa00' }} aria-hidden="true">⚠</div>
                    <p style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '4px', color: '#ffaa00' }}>ALREADY CHECKED IN</p>
                    <p style={{ fontSize: '0.85rem', color: '#ccc', marginBottom: '4px' }}>{ticketInfo?.name}</p>
                    <p style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '24px' }}>{ticketInfo?.event}</p>
                  </>
                )}

                {status === 'notfound' && (
                  <>
                    <div style={{ fontSize: '32px', marginBottom: '12px', color: '#ff4444' }} aria-hidden="true">✗</div>
                    <p style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '4px', color: '#ff4444' }}>TICKET NOT FOUND</p>
                    <p style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '24px' }}>Code: {scanResult}</p>
                  </>
                )}

                <button onClick={resetScanner} style={resetBtn} aria-label="Scan next guest">
                  SCAN NEXT GUEST
                </button>
              </div>
            )}
          </div>

          {/* Right: Recent check-ins */}
          <div>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 'bold', letterSpacing: '0.08em', marginBottom: '16px', color: '#aaa' }}>
              RECENT CHECK-INS
            </h2>
            {recentCheckIns.length === 0 ? (
              <p style={{ color: '#444', fontSize: '0.8rem' }}>No check-ins yet this session.</p>
            ) : (
              <ol style={{ listStyle: 'none' }} aria-label="Recent check-ins list">
                {recentCheckIns.map((entry, i) => (
                  <li key={i} style={recentItem}>
                    <div>
                      <p style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{entry.name}</p>
                      <p style={{ color: '#888', fontSize: '0.75rem' }}>{entry.event}</p>
                    </div>
                    <span style={{ color: '#555', fontSize: '11px', whiteSpace: 'nowrap' }}>{entry.time}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

const navBtn = {
  background: '#007bff', color: '#fff', border: 'none',
  padding: '10px 20px', fontWeight: 'bold', fontSize: '13px',
  letterSpacing: '0.05em', fontFamily: 'inherit', cursor: 'pointer',
}

const resultBox = (status) => ({
  background: '#111',
  border: `1px solid ${status === 'success' ? '#00cc66' : status === 'already' ? '#ffaa00' : status === 'notfound' ? '#ff4444' : '#333'}`,
  padding: '28px',
  textAlign: 'center',
  minHeight: '280px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
})

const confirmBtn = {
  background: '#00cc66', color: '#000', border: 'none',
  padding: '12px 24px', fontWeight: 'bold', fontSize: '13px',
  letterSpacing: '0.06em', fontFamily: 'inherit', cursor: 'pointer',
  width: '100%',
}

const resetBtn = {
  background: 'transparent', color: '#aaa',
  border: '1px solid #444', padding: '10px 24px',
  fontFamily: 'inherit', fontSize: '13px', cursor: 'pointer',
  letterSpacing: '0.06em', width: '100%',
}

const recentItem = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 0',
  borderBottom: '1px solid #1a1a1a',
  gap: '12px',
}
