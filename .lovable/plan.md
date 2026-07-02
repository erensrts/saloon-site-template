# Plan: DB-Destekli, Admin Panelli, Çok Dilli Salon Şablonu (Onaylandı)

## Netleşen Kararlar
1. **Profiles tablosu YOK** — sadece `auth.users` + `user_roles` + `has_role()`.
2. **Slotlar toplu üretilir** — admin çalışma saati + aralık girer, sistem `availability_slots`'u otomatik doldurur.

## Uygulama Sırası (6 Faz — her faz sonunda test için durulur)

### Faz 1 — i18n İskeleti (SIRADAKİ)
- `src/i18n/tr.ts`, `src/i18n/en.ts` sözlükleri (nav, form etiketleri, toast'lar, gelecekteki admin UI stringleri).
- `src/i18n/index.ts` → `t(key)` helper, `siteConfig.locale` okur.
- `site.config.ts`'e `locale: "tr"` alanı.
- Public bileşenlerdeki sabit TR stringleri `t(...)`'a taşınır. Görsel çıktı birebir aynı.
- `<html lang>` ve `head` meta locale'e bağlanır.
- **Risk:** Düşük. **Test:** Site aynı görünmeli; `locale` "en" yapıldığında UI İngilizce görünmeli.

### Faz 2 — Lovable Cloud + Şema + Public Okuma
- Cloud aktif, migration'lar: `services`, `gallery_images`, `working_hours`, `availability_slots`, `site_content`, `appointments`, `user_roles` — hepsinde `language text not null default 'tr'`, GRANT'ler, RLS, `has_role()`.
- Seed migration: bugünkü `site.config.ts` içeriği `tr` locale ile eklenir.
- Public bileşenler publishable-key server fn'lerle veri çeker; DB hatası → config fallback.
- **Test:** Site DB'den okuyor mu, DB'yi bozunca fallback devreye giriyor mu.

### Faz 3 — Auth + `/admin` Kabuğu
- Supabase Email/Password auth.
- `/auth` public giriş sayfası.
- `_authenticated/route.tsx` (managed gate, `ssr: false`).
- `/_authenticated/admin` + `has_role(uid, 'admin')` ikinci kapı.
- `noindex, nofollow` meta + `robots.txt`'te `Disallow: /admin`, `/auth`.
- **Test:** Admin'e girişsiz erişilemez, admin olmayan kullanıcı reddedilir.

### Faz 4 — Admin Dashboard (6 sekme)
Randevular / Hizmetler / Galeri / Çalışma Saatleri / Boş Zaman Dilimleri (toplu üretici) / Site İçeriği. Tüm yazma işlemleri `requireSupabaseAuth` + `has_role` kontrollü server fn.

### Faz 5 — Görsel Upload + Client-Side WebP
- Supabase Storage `gallery` bucket.
- Admin'de canvas → `toBlob('image/webp', 0.85)`; sadece WebP yüklenir. Safari fallback.

### Faz 6 — Booking → DB + Sitemap
- Booking formu boş slot'ları DB'den çeker; submit `appointments`'a INSERT + slot'u atomik olarak doldurur; WhatsApp yönlendirmesi korunur.
- `src/routes/sitemap[.]xml.ts` (sadece public route'lar).
- `robots.txt` güncellenir.

## Riskler (özet)
- RLS/GRANT eksikliği → 401: her tablo için checklist.
- Service role sızıntısı: `client.server` sadece `.server.ts` + handler içinde `await import(...)`.
- Slot çakışması: `UPDATE ... WHERE dolu=false RETURNING` idempotent yazım.
- Config↔DB çift kaynak: Faz 2 sonunda config sadece `locale`, `seo`, WhatsApp numarası gibi build-time sabitleri tutar.

Faz 1'e başlıyorum, biter bitmez durup test için bildireceğim.
