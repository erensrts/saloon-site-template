
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username citext NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_username_format CHECK (username ~ '^[A-Za-z0-9_.]{2,30}$')
);

GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT UPDATE (username, updated_at) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Kullanıcı adının varlığını doğrulamak için herkese SELECT
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- Yeni kullanıcı için profil oluştur
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uname text := nullif(trim(NEW.raw_user_meta_data->>'username'), '');
  _base text;
  _candidate text;
  _n int := 0;
BEGIN
  IF _uname IS NULL THEN
    _base := regexp_replace(split_part(coalesce(NEW.email, ''), '@', 1), '[^A-Za-z0-9_.]', '', 'g');
    IF _base IS NULL OR length(_base) < 2 THEN
      _base := 'user' || substr(replace(NEW.id::text, '-', ''), 1, 6);
    END IF;
    _uname := left(_base, 24);
  ELSE
    _uname := regexp_replace(_uname, '[^A-Za-z0-9_.]', '', 'g');
    IF length(_uname) < 2 THEN
      _uname := 'user' || substr(replace(NEW.id::text, '-', ''), 1, 6);
    END IF;
    _uname := left(_uname, 30);
  END IF;

  _candidate := _uname;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = _candidate) LOOP
    _n := _n + 1;
    _candidate := left(_uname, 24) || _n::text;
  END LOOP;

  INSERT INTO public.profiles (id, username) VALUES (NEW.id, _candidate)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Mevcut kullanıcılar için geriye dönük profil doldur
DO $$
DECLARE
  r record;
  _base text;
  _candidate text;
  _n int;
BEGIN
  FOR r IN SELECT id, email FROM auth.users LOOP
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = r.id) THEN
      CONTINUE;
    END IF;
    _base := regexp_replace(split_part(coalesce(r.email, ''), '@', 1), '[^A-Za-z0-9_.]', '', 'g');
    IF _base IS NULL OR length(_base) < 2 THEN
      _base := 'user' || substr(replace(r.id::text, '-', ''), 1, 6);
    END IF;
    _base := left(_base, 24);
    _candidate := _base;
    _n := 0;
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = _candidate) LOOP
      _n := _n + 1;
      _candidate := _base || _n::text;
    END LOOP;
    INSERT INTO public.profiles (id, username) VALUES (r.id, _candidate);
  END LOOP;
END $$;

-- Kullanıcı adından e-posta çözümleyen özel fonksiyon (yalnız sunucu tarafı)
CREATE OR REPLACE FUNCTION private.resolve_email_by_username(_username text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.email
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.username = _username::citext
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION private.resolve_email_by_username(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.resolve_email_by_username(text) TO service_role;
