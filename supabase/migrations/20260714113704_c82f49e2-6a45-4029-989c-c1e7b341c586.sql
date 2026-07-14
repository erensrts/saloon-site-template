
CREATE TABLE public.pending_admin_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pending_admin_invites TO authenticated;
GRANT ALL ON public.pending_admin_invites TO service_role;

ALTER TABLE public.pending_admin_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage invites"
  ON public.pending_admin_invites
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger: on new auth user, if their email is in pending_admin_invites, grant admin role.
CREATE OR REPLACE FUNCTION public.handle_new_user_admin_invite()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email TEXT := lower(coalesce(NEW.email, ''));
  _matched BOOLEAN := false;
BEGIN
  IF _email = '' THEN
    RETURN NEW;
  END IF;

  DELETE FROM public.pending_admin_invites
  WHERE lower(email) = _email
  RETURNING true INTO _matched;

  IF _matched THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_admin_invite ON auth.users;
CREATE TRIGGER on_auth_user_created_admin_invite
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_admin_invite();
