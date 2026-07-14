# Kullanıcı Adı ile Kayıt & Giriş

## Amaç
- Kayıtta e-posta yanında **kullanıcı adı** alanı zorunlu olacak.
- Girişte kullanıcı; **kullanıcı adı VEYA e-posta** ile giriş yapabilecek.
- Şifre için hiçbir uzunluk / karmaşıklık kısıtlaması olmayacak.

## Yapılacaklar

### 1) Veritabanı — `profiles` tablosu (migration)
- `public.profiles` tablosu: `id (uuid, PK, FK → auth.users on delete cascade)`, `username (citext, unique, not null)`, `created_at`, `updated_at`.
- GRANT + RLS: herkes (`anon`+`authenticated`) yalnızca `SELECT` yapabilir (username → email çözümü için gerekli, ama sadece kullanıcı adının varlığını doğrular; e-posta profilde tutulmuyor). Kendi profilini `UPDATE` edebilir.
- Trigger: `auth.users` üzerinde AFTER INSERT → yeni kaydın `raw_user_meta_data->>'username'` değerini `profiles`'a yazar. Kullanıcı adı boşsa (ör. davet akışı) e-postanın `@` öncesini kullanır; çakışırsa sonuna kısa random ek koyar.
- `private` şemasında `resolve_email_by_username(text) returns text` fonksiyonu (SECURITY DEFINER) — `profiles` + `auth.users` join'ler, e-postayı döner.

### 2) Backend — server function
- `src/lib/auth.functions.ts` içine `resolveLoginEmail({ identifier })` eklenecek:
  - Girdi `@` içeriyorsa aynen döner.
  - Aksi halde `supabaseAdmin.rpc('resolve_email_by_username', ...)` çağırıp e-postayı döner.
  - Bulunamazsa hata (`Kullanıcı adı bulunamadı`).
- Public serverFn — kimlik doğrulama gerektirmez, yalnızca username→email çevirir.

### 3) Frontend — `src/routes/auth.tsx`
- **Kayıt (signup):** yeni **Kullanıcı adı** alanı (2–30 karakter, `[a-zA-Z0-9_.]`), `supabase.auth.signUp` çağrısına `options.data.username` eklenecek. Çakışma hatası kullanıcı dostu mesajla gösterilecek.
- **Giriş (signin):** "E-posta" alanı **"E-posta veya Kullanıcı adı"** olarak değiştirilecek; submit'te önce `resolveLoginEmail` çağrılıp dönen e-posta ile `signInWithPassword` yapılacak.
- **Şifre alanları:** `minLength={6}` ve `required` dışındaki tüm kısıtlar kaldırılacak (boş olmayacak, uzunluk şartı yok).

### 4) Diğer şifre girişleri
- `src/components/admin/ChangePasswordDialog.tsx` ve `src/routes/reset-password.tsx`: `minLength={6}` kaldırılacak, "en az 6 karakter" kontrolleri ve mesajları silinecek. "Yeni şifre eskisiyle aynı olamaz" kontrolü kalabilir.

### 5) i18n
- `tr.ts` ve `en.ts` içine yeni etiketler: `usernameLabel`, `identifierLabel` ("E-posta veya kullanıcı adı"), doğrulama mesajları (`usernameInvalid`, `usernameTaken`, `identifierNotFound`).

## Önemli Not — Şifre Minimum Uzunluk
Supabase Auth backend'i **varsayılan olarak 6 karakter minimum şifre uzunluğu** uygular ve bu proje için mevcut yönetim aracıyla değiştirilemiyor. İstemci tarafındaki tüm kısıtları kaldıracağız; ancak backend 6'dan kısa şifreyi reddederse Supabase'in orijinal hata mesajı toast olarak gösterilecek. Bu limiti tamamen kaldırmak için Supabase Auth ayarlarının manuel değiştirilmesi gerekir.

## Teknik Ayrıntılar
- `profiles.username` için `citext` uzantısı kullanılır → case-insensitive unique.
- Trigger `handle_new_user_admin_invite` ile çakışmaz; ayrı `AFTER INSERT` trigger olarak eklenecek.
- Mevcut kullanıcılar için migration içinde geriye dönük `profiles` doldurma yapılacak (`email` local-part + gerekiyorsa suffix).
- `resolve_email_by_username` `private` şemasında olduğu için PostgREST'e sızmaz; sadece server-side kullanılır.

## Test Senaryoları
1. Yeni kayıt: kullanıcı adı + e-posta + şifre → profil oluşur, giriş her ikisiyle de çalışır.
2. Aynı kullanıcı adıyla ikinci kayıt → hata.
3. Kullanıcı adıyla giriş → başarılı.
4. E-posta ile giriş → başarılı.
5. Var olmayan kullanıcı adı ile giriş → "Kullanıcı adı bulunamadı".
6. Şifre alanına 3 karakter → istemci engellemez (backend cevabına göre davranır).
