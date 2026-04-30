// Vercel serverless function — sends ticket confirmation emails via Resend
// Called by the frontend at POST /api/send-email (no CORS issues, API key hidden)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { guestEmail, eventTitle, eventDate, eventTime, eventVenue, ticketCode, qrUrl } = req.body

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer re_L3vMjxGs_H4gjsDgxFSDL71Ttk8v5vzT7',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: 'uktaha740@gmail.com',
        subject: `Ticket for ${eventTitle} — booked by ${guestEmail}`,
        html: `
          <div style="background:#000;color:#fff;font-family:'Courier New',monospace;padding:40px;max-width:600px;margin:0 auto;">
            <h1 style="color:#4361ee;letter-spacing:0.1em;font-size:1.2rem;margin-bottom:4px;">EVENT●HUB</h1>
            <p style="color:#555;font-size:0.8rem;margin-bottom:8px;">Ticket confirmation</p>
            <p style="color:#888;font-size:0.8rem;margin-bottom:32px;">Booked by: ${guestEmail}</p>

            <h2 style="font-size:1.4rem;font-weight:bold;margin-bottom:8px;">${eventTitle}</h2>
            <p style="color:#aaa;font-size:0.9rem;margin-bottom:4px;">📅 ${eventDate}${eventTime ? ' at ' + eventTime : ''}</p>
            <p style="color:#aaa;font-size:0.9rem;margin-bottom:24px;">📍 ${eventVenue || 'London'}</p>

            <div style="background:#111;border:1px solid #222;padding:20px;margin-bottom:24px;text-align:center;">
              <p style="color:#555;font-size:0.75rem;letter-spacing:0.1em;margin-bottom:12px;">QR CODE</p>
              <img src="${qrUrl}" alt="QR Code" width="200" height="200" style="display:block;margin:0 auto 16px;" />
              <p style="color:#4361ee;font-size:1rem;font-weight:bold;letter-spacing:0.12em;">${ticketCode}</p>
              <p style="color:#555;font-size:0.75rem;margin-top:8px;">Show this QR code at the door</p>
            </div>

            <p style="color:#333;font-size:0.75rem;text-align:center;">
              View tickets at <a href="https://event-app-smoky-kappa.vercel.app/tickets" style="color:#4361ee;">EventHub My Tickets</a>
            </p>
          </div>
        `,
      }),
    })

    const data = await response.json()
    return res.status(response.status).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
