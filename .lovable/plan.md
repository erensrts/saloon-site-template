# Admin Kullanıcı Yönetimi

Admin paneline yeni bir **"Kullanıcılar"** sekmesi eklenir. Silme, rol yönetimi ve yeni admin davet etme özelliklerini içerir.

## Özellikler

**Liste:** Tüm kullanıcılar tabloda gösterilir — e-posta, kayıt tarihi, son giriş, rol rozeti (admin / kullanıcı).

**Rol yönetimi:** Her satırda "Admin yap" / "Admin rolünü kaldır" butonu. `user_roles` tablosuna insert/delete.

**Davet:** Üstte "Yeni admin davet et" butonu → e-posta girilir → Supabase Auth Admin API ile davet gönderilir (Lovable varsayılan e-postası) → kullanıcı kaydolduğunda otomatik admin rolü verilir.

**Silme:** Her satırda çöp kutusu ikonu → onay diyaloğu → kullanıcı `auth.users`'tan tamamen silinir (cascade ile `user_roles` da temizlenir).

## Güvenlik Kuralları

- Tüm işlemler `createServerFn` + `requireSupabaseAuth` + `has_role(admin)` kontrolünden geçer.
- **Kendini silme engellenir:** server fn `context.userId === targetId` ise hata döner.
- **Son admin koruması:** silinen/rolü alınan kullanıcı sistemdeki tek admin ise işlem reddedilir (admin kilitlenmesini önler).
- Auth Admin API çağrıları için `supabaseAdmin` handler içinde `await import(...)` ile yüklenir (module scope'ta değil).

## Teknik Detaylar

**Yeni dosyalar:**
- `src/lib/admin/users.functions.ts` — `adminListUsers`, `adminInviteAdmin`, `adminSetRole`, `adminDeleteUser` server fn'leri. Listeleme `supabaseAdmin.auth.admin.listUsers()` + `user_roles` join. Davet `supabaseAdmin.auth.admin.inviteUserByEmail(email, { data: { pending_role: 'admin' } })` + davet edilen e-postayı bir `pending_admin_invites` tablosuna kaydeder.
- `src/components/admin/UsersTab.tsx` — tablo, davet dialog'u, rol butonları, silme onay diyaloğu (mevcut `AppointmentsTab` deseniyle aynı: React Query + `useServerFn` + `sonner` toast + `AlertDialog`).
- Migration: `pending_admin_invites` tablosu (email, invited_by, created_at) + RLS (sadece admin okur/yazar) + `handle_new_user` trigger'ı: yeni kayıt olan kullanıcının e-postası `pending_admin_invites`'ta varsa otomatik `user_roles`'a admin ekle ve daveti sil.

**Değişecek dosyalar:**
- `src/routes/_authenticated/admin.tsx` — yeni "Kullanıcılar" sekmesi eklenir.
- `src/i18n/tr.ts` ve `src/i18n/en.ts` — `admin.users` altında etiketler (title, subtitle, invite, delete, makeAdmin, removeAdmin, confirmDelete, kendini silme hatası, son admin hatası, vb.).

## Test

1. Yeni bir e-postayı davet et → e-posta gelir → kaydol → otomatik admin olarak listelenir.
2. Başka bir admine "Admin rolünü kaldır" → rozet "kullanıcı"ya döner.
3. Kendi hesabını sil/rolünü kaldır → hata toast'ı görünür, işlem yapılmaz.
4. Tek admin kalınca rol kaldırmayı dene → engellenir.
5. Kullanıcıyı sil → auth'tan kaybolur, tekrar aynı e-postayla kaydolabilir.
