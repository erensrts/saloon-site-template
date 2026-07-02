-- Security-definer function: allow a newly signed-up user to claim the
-- first admin role IF no admin exists yet. Used only from a server fn
-- that runs under requireSupabaseAuth (so caller identity is trusted).
CREATE OR REPLACE FUNCTION public.claim_first_admin(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_admin_count int;
BEGIN
  SELECT count(*) INTO existing_admin_count
  FROM public.user_roles
  WHERE role = 'admin';

  IF existing_admin_count > 0 THEN
    RETURN false;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_first_admin(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.claim_first_admin(uuid) TO authenticated;