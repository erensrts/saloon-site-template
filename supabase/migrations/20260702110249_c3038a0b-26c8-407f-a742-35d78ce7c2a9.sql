
-- Restrict has_role EXECUTE
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Tighten appointment insert policy
DROP POLICY "Anyone can request appointment" ON public.appointments;
CREATE POLICY "Anyone can request appointment" ON public.appointments
  FOR INSERT
  WITH CHECK (
    length(trim(name)) BETWEEN 2 AND 100
    AND length(trim(phone)) BETWEEN 7 AND 25
    AND length(trim(service)) BETWEEN 1 AND 100
    AND date >= current_date
    AND (note IS NULL OR length(note) <= 500)
    AND (email IS NULL OR length(email) <= 255)
  );
