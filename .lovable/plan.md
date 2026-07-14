## Amaç
Admin kullanıcıları için şifre sıfırlama ve şifre değiştirme akışı eklemek. E-postalar Lovable'ın varsayılan gönderim altyapısı üzerinden gidecek (ek DNS/domain kurulumu yok).

## Akış Özeti

**1. /auth sayfasında "Şifremi unuttum"**
- Giriş formunun altına link.
- Tıklanınca aynı sayfada e-posta iste → `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" })`.
- Toast: "Sıfırlama bağlantısı e-postanıza gönderildi."

**2. Yeni public route: `/reset-password`**
- SSR kapalı, `noindex, nofollow`.
- Supabase, e-postadaki linkle geldiğinde `PASSWORD_RECOVERY` event'ini tetikler ve geçici oturum açar. Sayfa `onAuthStateChange` ile bu event'i dinler; geçerli recovery oturumu yoksa uyarı gösterir ("Bağlantı geçersiz veya süresi dolmuş").
- İki alan: Yeni şifre + Tekrar. En az 6 karakter, eşleşme kontrolü.
- Submit → `supabase.auth.updateUser({ password })` → başarı → `signOut()` + `/auth`'a yönlendirme + toast.

**3. Admin panelinde "Şifremi değiştir"**
- `src/routes/_authenticated/admin.tsx` içinde, mevcut "Çıkış yap" butonunun yanına küçük bir bölüm/dialog.
- Alanlar: Mevcut şifre, yeni şifre, tekrar.
- Mevcut şifreyi doğrulamak için `supabase.auth.signInWithPassword({ email: user.email, password: current })` (oturumu bozmaz, sadece kimlik doğrular); başarılı olursa `updateUser({ password: new })`.
- Toast ile geri bildirim; oturum korunur.

**4. i18n**
- `src/i18n/tr.ts` ve `en.ts`: `auth.forgot`, `auth.reset`, `admin.password` altında tüm etiketler, hata mesajları, toast metinleri.

## Dosya Değişiklikleri
- `src/routes/auth.tsx` — "Şifremi unuttum" akışı (aynı dosyada mod eklenerek).
- `src/routes/reset-password.tsx` (yeni) — public, ssr:false, recovery oturumunu bekler.
- `src/routes/_authenticated/admin.tsx` — şifre değiştirme paneli/dialog.
- `src/i18n/tr.ts`, `src/i18n/en.ts` — yeni sözlük anahtarları.
- `public/robots.txt` — `Disallow: /reset-password` satırı.

## Teknik Notlar
- Ek server fn veya migration gerekmez; her şey Supabase Auth client SDK üzerinden.
- E-postalar Lovable'ın varsayılan şablonuyla gider — ek kurulum yok. İleride markalı e-posta istenirse `scaffold_auth_email_templates` ile eklenebilir.
- `resetPasswordForEmail` çağrısı public'tir, hız limitine takılırsa `over_email_send_rate_limit` (429) görülebilir — nadiren olur, gerekirse `configure_auth` ile artırılır.

## Test
1. `/auth` → "Şifremi unuttum" → mail gelir.
2. Maildeki link `/reset-password`'a düşer, yeni şifre girilir, `/auth`'a yönlenir, yeni şifreyle giriş çalışır.
3. Admin panelinde "Şifremi değiştir" ile mevcut şifre doğrulanıp yeni şifre kaydedilir, oturum korunur.