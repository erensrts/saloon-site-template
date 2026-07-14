
REVOKE ALL ON FUNCTION public.handle_new_user_profile() FROM PUBLIC, anon, authenticated;

CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION citext SET SCHEMA extensions;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;

-- profiles.username sütununun tip referansını da güncelle
ALTER TABLE public.profiles ALTER COLUMN username TYPE extensions.citext;

-- resolve fonksiyonunu güncel tip ile yeniden oluştur
CREATE OR REPLACE FUNCTION private.resolve_email_by_username(_username text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT u.email
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.username = _username::extensions.citext
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION private.resolve_email_by_username(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.resolve_email_by_username(text) TO service_role;
