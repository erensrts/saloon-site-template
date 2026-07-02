-- Atomic booking: lock the free slot, insert the appointment, mark slot booked.
CREATE OR REPLACE FUNCTION public.book_appointment(
  _slot_id uuid,
  _name text,
  _phone text,
  _service text,
  _email text DEFAULT NULL,
  _note text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _appt_id uuid;
  _slot_date date;
  _slot_time time;
BEGIN
  -- Lock the row so concurrent bookings serialize.
  SELECT date, time INTO _slot_date, _slot_time
  FROM public.availability_slots
  WHERE id = _slot_id AND is_booked = false
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'slot_unavailable' USING ERRCODE = 'P0001';
  END IF;

  IF _slot_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'slot_past' USING ERRCODE = 'P0001';
  END IF;

  -- Input shape mirrors the INSERT policy on appointments.
  IF length(btrim(_name)) < 2 OR length(btrim(_name)) > 100 THEN
    RAISE EXCEPTION 'invalid_name' USING ERRCODE = 'P0001';
  END IF;
  IF length(btrim(_phone)) < 7 OR length(btrim(_phone)) > 25 THEN
    RAISE EXCEPTION 'invalid_phone' USING ERRCODE = 'P0001';
  END IF;
  IF length(btrim(_service)) < 1 OR length(btrim(_service)) > 100 THEN
    RAISE EXCEPTION 'invalid_service' USING ERRCODE = 'P0001';
  END IF;
  IF _email IS NOT NULL AND length(_email) > 255 THEN
    RAISE EXCEPTION 'invalid_email' USING ERRCODE = 'P0001';
  END IF;
  IF _note IS NOT NULL AND length(_note) > 500 THEN
    RAISE EXCEPTION 'invalid_note' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.appointments (name, phone, email, service, date, time, note)
  VALUES (
    btrim(_name),
    btrim(_phone),
    NULLIF(btrim(COALESCE(_email, '')), ''),
    btrim(_service),
    _slot_date,
    _slot_time,
    NULLIF(btrim(COALESCE(_note, '')), '')
  )
  RETURNING id INTO _appt_id;

  UPDATE public.availability_slots
  SET is_booked = true,
      appointment_id = _appt_id,
      updated_at = now()
  WHERE id = _slot_id;

  RETURN _appt_id;
END;
$$;

-- Only anon/authenticated may call it; service_role always can.
REVOKE ALL ON FUNCTION public.book_appointment(uuid, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.book_appointment(uuid, text, text, text, text, text)
  TO anon, authenticated;
