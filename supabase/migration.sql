-- ============================================================
-- EventHub Sprint 4 — Database Migration (FIXED)
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → paste this → Run
-- ============================================================

-- ── 1. EVENTS TABLE: add missing columns ─────────────────────
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS venue        TEXT,
  ADD COLUMN IF NOT EXISTS time         TEXT,
  ADD COLUMN IF NOT EXISTS category     TEXT    DEFAULT 'Other',
  ADD COLUMN IF NOT EXISTS description  TEXT,
  ADD COLUMN IF NOT EXISTS price        NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status       TEXT    DEFAULT 'upcoming',
  ADD COLUMN IF NOT EXISTS image_url    TEXT,
  ADD COLUMN IF NOT EXISTS tickets_sold INTEGER DEFAULT 0;

-- ── 2. RSVPS TABLE: add ticket_code column ──────────────────
ALTER TABLE public.rsvps
  ADD COLUMN IF NOT EXISTS ticket_code TEXT;

-- Backfill ticket_code with the RSVP UUID (used as QR scan target)
UPDATE public.rsvps
SET ticket_code = id::TEXT
WHERE ticket_code IS NULL;

-- ── 3. ENABLE REALTIME (safe version — skips if already added)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.rsvps;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 4. ROW LEVEL SECURITY POLICIES ──────────────────────────
ALTER TABLE public.events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvps    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read events"    ON public.events;
CREATE POLICY "Public read events"    ON public.events
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Hosts manage events"   ON public.events;
CREATE POLICY "Hosts manage events"   ON public.events
  FOR ALL TO authenticated
  USING     (host_id = auth.uid())
  WITH CHECK(host_id = auth.uid());

DROP POLICY IF EXISTS "Guest read own RSVPs"  ON public.rsvps;
CREATE POLICY "Guest read own RSVPs"  ON public.rsvps
  FOR SELECT TO authenticated
  USING (guest_id = auth.uid());

DROP POLICY IF EXISTS "Host read event RSVPs" ON public.rsvps;
CREATE POLICY "Host read event RSVPs" ON public.rsvps
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = rsvps.event_id AND e.host_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Guest create RSVP"     ON public.rsvps;
CREATE POLICY "Guest create RSVP"     ON public.rsvps
  FOR INSERT TO authenticated
  WITH CHECK (guest_id = auth.uid());

DROP POLICY IF EXISTS "Host update RSVP"      ON public.rsvps;
CREATE POLICY "Host update RSVP"      ON public.rsvps
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = rsvps.event_id AND e.host_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Own profile"           ON public.profiles;
CREATE POLICY "Own profile"           ON public.profiles
  FOR ALL TO authenticated
  USING     (id = auth.uid())
  WITH CHECK(id = auth.uid());
