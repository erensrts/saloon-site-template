
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, anon, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION private.claim_first_admin(_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE existing_admin_count int;
BEGIN
  SELECT count(*) INTO existing_admin_count FROM public.user_roles WHERE role = 'admin';
  IF existing_admin_count > 0 THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION private.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION private.book_appointment(
  _slot_id uuid, _name text, _phone text, _service text,
  _email text DEFAULT NULL, _note text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _appt_id uuid; _slot_date date; _slot_time time;
BEGIN
  SELECT date, time INTO _slot_date, _slot_time
  FROM public.availability_slots WHERE id = _slot_id AND is_booked = false FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'slot_unavailable' USING ERRCODE = 'P0001'; END IF;
  IF _slot_date < CURRENT_DATE THEN RAISE EXCEPTION 'slot_past' USING ERRCODE = 'P0001'; END IF;
  IF length(btrim(_name)) < 2 OR length(btrim(_name)) > 100 THEN RAISE EXCEPTION 'invalid_name' USING ERRCODE = 'P0001'; END IF;
  IF length(btrim(_phone)) < 7 OR length(btrim(_phone)) > 25 THEN RAISE EXCEPTION 'invalid_phone' USING ERRCODE = 'P0001'; END IF;
  IF length(btrim(_service)) < 1 OR length(btrim(_service)) > 100 THEN RAISE EXCEPTION 'invalid_service' USING ERRCODE = 'P0001'; END IF;
  IF _email IS NOT NULL AND length(_email) > 255 THEN RAISE EXCEPTION 'invalid_email' USING ERRCODE = 'P0001'; END IF;
  IF _note IS NOT NULL AND length(_note) > 500 THEN RAISE EXCEPTION 'invalid_note' USING ERRCODE = 'P0001'; END IF;

  INSERT INTO public.appointments (name, phone, email, service, date, time, note)
  VALUES (btrim(_name), btrim(_phone), NULLIF(btrim(COALESCE(_email, '')), ''),
          btrim(_service), _slot_date, _slot_time,
          NULLIF(btrim(COALESCE(_note, '')), ''))
  RETURNING id INTO _appt_id;

  UPDATE public.availability_slots
  SET is_booked = true, appointment_id = _appt_id, updated_at = now()
  WHERE id = _slot_id;

  RETURN _appt_id;
END;
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.claim_first_admin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.set_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.book_appointment(uuid, text, text, text, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION private.set_updated_at() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION private.claim_first_admin(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION private.book_appointment(uuid, text, text, text, text, text) TO service_role, anon, authenticated;

-- Public SECURITY INVOKER wrapper for anon booking
CREATE OR REPLACE FUNCTION public.book_appointment(
  _slot_id uuid, _name text, _phone text, _service text,
  _email text DEFAULT NULL, _note text DEFAULT NULL
) RETURNS uuid LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$
  SELECT private.book_appointment(_slot_id, _name, _phone, _service, _email, _note);
$$;
REVOKE ALL ON FUNCTION public.book_appointment(uuid, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.book_appointment(uuid, text, text, text, text, text) TO anon, authenticated;

-- Recreate RLS policies to use private.has_role
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins manage services" ON public.services;
CREATE POLICY "Admins manage services" ON public.services
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins manage gallery" ON public.gallery_images;
CREATE POLICY "Admins manage gallery" ON public.gallery_images
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins manage working hours" ON public.working_hours;
CREATE POLICY "Admins manage working hours" ON public.working_hours
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins manage site content" ON public.site_content;
CREATE POLICY "Admins manage site content" ON public.site_content
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins view appointments" ON public.appointments;
CREATE POLICY "Admins view appointments" ON public.appointments
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins update appointments" ON public.appointments;
CREATE POLICY "Admins update appointments" ON public.appointments
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins delete appointments" ON public.appointments;
CREATE POLICY "Admins delete appointments" ON public.appointments
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins manage slots" ON public.availability_slots;
CREATE POLICY "Admins manage slots" ON public.availability_slots
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins manage invites" ON public.pending_admin_invites;
CREATE POLICY "Admins manage invites" ON public.pending_admin_invites
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can upload gallery files" ON storage.objects;
CREATE POLICY "Admins can upload gallery files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK ((bucket_id = 'gallery') AND private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can update gallery files" ON storage.objects;
CREATE POLICY "Admins can update gallery files" ON storage.objects
  FOR UPDATE TO authenticated
  USING ((bucket_id = 'gallery') AND private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK ((bucket_id = 'gallery') AND private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can delete gallery files" ON storage.objects;
CREATE POLICY "Admins can delete gallery files" ON storage.objects
  FOR DELETE TO authenticated
  USING ((bucket_id = 'gallery') AND private.has_role(auth.uid(), 'admin'::public.app_role));

-- Rebind updated_at triggers
DROP TRIGGER IF EXISTS services_set_updated_at ON public.services;
CREATE TRIGGER services_set_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

DROP TRIGGER IF EXISTS gallery_images_set_updated_at ON public.gallery_images;
CREATE TRIGGER gallery_images_set_updated_at BEFORE UPDATE ON public.gallery_images
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

DROP TRIGGER IF EXISTS working_hours_set_updated_at ON public.working_hours;
CREATE TRIGGER working_hours_set_updated_at BEFORE UPDATE ON public.working_hours
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

DROP TRIGGER IF EXISTS site_content_set_updated_at ON public.site_content;
CREATE TRIGGER site_content_set_updated_at BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

DROP TRIGGER IF EXISTS appointments_set_updated_at ON public.appointments;
CREATE TRIGGER appointments_set_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

DROP TRIGGER IF EXISTS availability_slots_set_updated_at ON public.availability_slots;
CREATE TRIGGER availability_slots_set_updated_at BEFORE UPDATE ON public.availability_slots
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- Drop the old public-schema helper functions
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.claim_first_admin(uuid);
DROP FUNCTION IF EXISTS public.set_updated_at();
