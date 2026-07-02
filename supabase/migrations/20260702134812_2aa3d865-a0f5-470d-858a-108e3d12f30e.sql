-- Tighten public read on availability_slots:
-- 1) Only expose non-booked rows to the public.
-- 2) Hide appointment_id from anon entirely (defense in depth).

DROP POLICY IF EXISTS "Public read free slots" ON public.availability_slots;

CREATE POLICY "Public read free slots"
ON public.availability_slots
FOR SELECT
USING (is_booked = false);

-- Column-level: revoke appointment_id from anon; keep it for authenticated
-- (admins access via requireSupabaseAuth) and service_role.
REVOKE SELECT ON public.availability_slots FROM anon;
GRANT SELECT
  (id, date, "time", is_booked, created_at, updated_at)
  ON public.availability_slots TO anon;
