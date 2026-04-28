/**
 * Integration with Member 3's email / QR notification system.
 *
 * After a guest RSVPs, call notifyTicketCreated() to trigger the confirmation
 * email and QR code that Member 3 sends via /api/send-ticket.js.
 *
 * Setup (add to your .env file):
 *   VITE_SEND_TICKET_URL=https://your-supabase-project.supabase.co/functions/v1/send-ticket
 *   VITE_API_KEY=your_api_key_from_member3
 */
export async function notifyTicketCreated({ rsvpId, guestEmail, eventTitle, eventDate }) {
  try {
    const url = import.meta.env.VITE_SEND_TICKET_URL || '/api/send-ticket'

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(import.meta.env.VITE_API_KEY && {
          Authorization: `Bearer ${import.meta.env.VITE_API_KEY}`,
        }),
      },
      body: JSON.stringify({
        rsvpId,        // UUID — this IS the QR code value (matches what CheckIn.jsx scans)
        guestEmail,    // where the ticket email is sent
        eventTitle,
        eventDate,
        qrValue: rsvpId, // QR encodes the RSVP UUID so CheckIn.jsx can look it up
      }),
    })

    if (!res.ok) {
      const msg = await res.text()
      console.warn('[sendTicket] Email service responded with error:', msg)
    }
  } catch (err) {
    // Non-fatal — the RSVP is already saved in Supabase.
    // Email delivery failure should not break the booking flow.
    console.warn('[sendTicket] Could not reach email service:', err.message)
  }
}
