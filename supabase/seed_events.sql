-- ============================================================
-- EventHub — Real London Events Seed
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → New Query
--   Paste everything below → click Run
-- ============================================================

-- STEP 1: Add missing columns to events table (safe to run multiple times)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS venue       TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS time        TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS category    TEXT DEFAULT 'Other';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS price       NUMERIC DEFAULT 0;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS status      TEXT DEFAULT 'upcoming';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS image_url   TEXT;

-- STEP 2: Insert 9 real London events
-- (uses the first registered user as host — sign up in the app first!)
INSERT INTO public.events
  (title, event_date, max_capacity, venue, time, category, description, price, status, image_url, host_id)
VALUES

  -- 🟢 FREE | LIVE NOW
  (
    'Gymshark Battle Stations',
    '2026-06-06',
    '100',
    'Exhibition Centre White City, Wood Lane, London W12 7RH',
    '09:00',
    'Hobbies',
    'Go head-to-head across 8 hybrid race stations in the ultimate fitness challenge. Team up or compete solo across weighted carries, rope climbs, sprint tracks and more. Gymshark coaches on hand all day. Open to all fitness levels — no experience needed.',
    0,
    'live',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80',
    (SELECT id FROM auth.users LIMIT 1)
  ),

  -- 💰 £15 | UPCOMING
  (
    'Your Best Recovery Yet',
    '2026-06-14',
    '50',
    'Kachette, 5 Ravey Street, Shoreditch, London EC2A 4QW',
    '09:00',
    'Hobbies',
    'A guided wellness morning covering active recovery, mobility, nutrition and cold-exposure therapy. Partnered with lululemon and Runna. Includes a healthy breakfast, smoothies, goody bag and a live Q&A with sports physiotherapists.',
    15,
    'upcoming',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
    (SELECT id FROM auth.users LIMIT 1)
  ),

  -- 🟢 FREE | ALMOST FULL
  (
    'Big Zero Show 2026',
    '2026-06-19',
    '200',
    'Chicago Booth School of Business, 1 Plough Yard, London EC2A 3LP',
    '09:30',
    'Business',
    'The premier business showcase connecting innovators, investors and entrepreneurs from across Europe. 80+ speakers, live startup pitches, a venture capital roundtable and a full expo floor. Networking drinks evening included. Register free before spaces run out.',
    0,
    'almost_full',
    'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=800&q=80',
    (SELECT id FROM auth.users LIMIT 1)
  ),

  -- 💰 £45 | SALES END SOON
  (
    'London Music Festival 2026',
    '2026-06-27',
    '5000',
    'The O2 Arena, Peninsula Square, Greenwich, London SE10 0DX',
    '18:00',
    'Music',
    'London''s biggest summer music festival returns to The O2. 50+ artists across 6 stages: Main Stage, Electronic Dome, Acoustic Garden, Hip-Hop Yard, Jazz Lounge and the Rising Stars Tent. Gates open 5 PM. Last entry 10 PM.',
    45,
    'sales_end_soon',
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80',
    (SELECT id FROM auth.users LIMIT 1)
  ),

  -- 💰 £99 | UPCOMING
  (
    'Tech Startup Summit 2026',
    '2026-07-01',
    '300',
    'ExCeL London, Royal Victoria Dock, 1 Western Gateway, London E16 1XL',
    '10:00',
    'Business',
    'Connect with 300+ founders, VCs and tech leaders shaping tomorrow. Full-day programme: keynotes, fireside chats, deep-dive workshops and a startup demo zone. Networking dinner and after-party included in ticket price. Early-bird perks available.',
    99,
    'upcoming',
    'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
    (SELECT id FROM auth.users LIMIT 1)
  ),

  -- 💰 £10 | UPCOMING
  (
    'Street Food & Craft Beer Festival',
    '2026-07-05',
    '400',
    'Southbank Centre, Belvedere Road, Waterloo, London SE1 8XX',
    '12:00',
    'Food & Drink',
    '40 street food traders, 100+ independent craft beers and live music across two riverside stages on the Thames. Celebrating the best independent food culture the UK has to offer. Dog-friendly, family-welcome, no booking per trader needed — just show your wristband.',
    10,
    'upcoming',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    (SELECT id FROM auth.users LIMIT 1)
  ),

  -- 💰 £35 | UPCOMING
  (
    'West End Showcase 2026',
    '2026-07-09',
    '800',
    'Royal Albert Hall, Kensington Gore, South Kensington, London SW7 2AP',
    '19:30',
    'Performing & Visual Arts',
    'One exclusive night of West End''s greatest performances — from Les Misérables and Hamilton to The Lion King and Mamma Mia. Featuring lead cast members from 12 current West End productions, with a full live orchestra. Dress code: smart casual.',
    35,
    'upcoming',
    'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=800&q=80',
    (SELECT id FROM auth.users LIMIT 1)
  ),

  -- 💰 £25 | ALMOST FULL
  (
    'Guitar Masterclass with Ed Sheeran',
    '2026-07-19',
    '300',
    'O2 Academy Brixton, 211 Stockwell Road, Brixton, London SW9 9SL',
    '14:00',
    'Music',
    'An intimate 3-hour masterclass with Ed Sheeran covering songwriting, loop-pedal technique, performing live and building a career in music. Limited to 300 seats for a truly personal experience. Includes a 30-minute live Q&A and a signed copy of his new songbook.',
    25,
    'almost_full',
    'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?auto=format&fit=crop&w=800&q=80',
    (SELECT id FROM auth.users LIMIT 1)
  ),

  -- 💰 £8 | UPCOMING
  (
    'London Hobby & Craft Expo',
    '2026-07-25',
    '600',
    'Alexandra Palace, Alexandra Palace Way, Wood Green, London N22 7AY',
    '10:00',
    'Hobbies',
    'Explore 300+ stalls covering painting, miniatures, knitting, woodwork, ceramics, scale modelling and more. Includes hands-on workshops every hour, live demonstrations, friendly competitions and a dedicated kids'' crafting corner. Free on-site parking. Café and food stalls on site.',
    8,
    'upcoming',
    'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
    (SELECT id FROM auth.users LIMIT 1)
  );

-- STEP 3: Confirm everything was inserted correctly
SELECT
  title,
  event_date,
  time,
  venue,
  category,
  price,
  max_capacity,
  status
FROM public.events
ORDER BY event_date;
