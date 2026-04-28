const FOOTER_COLS = [
  {
    heading: 'Use EventHub',
    links: ['Create Events', 'Pricing', 'Event Marketing Platform', 'Mobile Ticket App', 'Check-In App', 'App Marketplace', 'Event Registration Software', 'FAQs', 'Sitemap'],
  },
  {
    heading: 'Plan Events',
    links: ['Sell Tickets Online', 'Ticketing Software', 'Sell Concert Tickets Online', 'Event Payment System', 'Event Management Software', 'Virtual Events Platform', 'QR Codes for Event Check-In', 'Post Your Event Online'],
  },
  {
    heading: 'Find Events',
    links: ['Bristol Music Events', 'Southampton Business Events', 'Oxford Fashion Events', 'Birmingham Events', 'Cambridge Music Events', 'Edinburgh Events', 'Belfast Events', 'London Events', 'Nottingham Events'],
  },
  {
    heading: 'Connect With Us',
    links: ['Contact Support', 'Contact Sales', 'X (Twitter)', 'Facebook', 'LinkedIn', 'Instagram', 'TikTok'],
  },
]

export default function Footer() {
  return (
    <footer style={footerWrap} role="contentinfo">
      <div style={footerGrid}>
        {FOOTER_COLS.map(col => (
          <div key={col.heading}>
            <h4 style={colHeading}>{col.heading}</h4>
            <ul style={{ listStyle: 'none' }}>
              {col.links.map(link => (
                <li key={link}>
                  <a href="#" style={linkStyle}>{link}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <hr style={{ borderColor: '#333', margin: '24px 0 16px' }} />
      <nav aria-label="Footer legal links" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px', marginBottom: '12px' }}>
        {['How It Works', 'Pricing', 'Contact Support', 'About', 'Privacy', 'Terms', 'Accessibility', 'Cookies'].map(item => (
          <a key={item} href="#" style={legalLink}>{item}</a>
        ))}
      </nav>
      <p style={{ textAlign: 'center', color: '#555', fontSize: '12px' }}>© 2025 EventHub</p>
    </footer>
  )
}

const footerWrap = {
  background: '#0a0a0a',
  borderTop: '1px solid #222',
  padding: '40px 40px 24px',
  marginTop: '80px',
}

const footerGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '32px',
  maxWidth: '1200px',
  margin: '0 auto',
}

const colHeading = {
  fontSize: '11px',
  fontWeight: 'bold',
  letterSpacing: '0.08em',
  color: '#fff',
  marginBottom: '12px',
  textTransform: 'uppercase',
}

const linkStyle = {
  display: 'block',
  color: '#666',
  fontSize: '12px',
  lineHeight: '2',
  transition: 'color 0.15s',
}

const legalLink = {
  color: '#555',
  fontSize: '11px',
}
