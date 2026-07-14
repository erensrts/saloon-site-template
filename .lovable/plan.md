# Salt-okunur Admin Paneli — Veri Görüntüleme Düzeltmesi

## Sorun
Admin paneli, giriş yapmış ancak admin rolü olmayan kullanıcılar için "salt-okunur mod" olarak açılıyor, ancak sekmelerin her biri hata veriyor ve içerik gösterilmiyor. Sebep:

- Tüm `adminList*` server fonksiyonları `assertAdmin(context)` çağırıyor → admin olmayan kullanıcıda `Forbidden` fırlatılıyor.
- Ayrıca tabloların RLS politikaları da yalnızca admin'e SELECT izni veriyor — RLS geçilse bile boş dönerdi.

## Yaklaşım
Okuma (list) fonksiyonlarında admin kısıtını kaldır; yazma (insert/update/delete/toggle/upsert/invite/setRole/deleteUser/cancelInvite) fonksiyonlarında `assertAdmin` aynen kalsın. Böylece yetkisiz düzenleme sunucu tarafından da engellenmiş olur — UI'daki `fieldset disabled` sadece görsel bir katman.

Okuma sırasında RLS admin'e kilitli olduğundan, list handler'ları `context.supabase` yerine `supabaseAdmin` istemcisini kullanacak. Bu güvenli, çünkü endpoint zaten `requireSupabaseAuth` ile korunuyor (yalnızca giriş yapmış kullanıcı).

## Dosya Bazlı Değişiklikler

**`src/lib/admin/appointments.functions.ts`**
- `adminListAppointments`: `assertAdmin` çağrısı kaldırılır. Sorgu `supabaseAdmin` üzerinden yapılır.
- `adminUpdateAppointmentStatus`, `adminDeleteAppointment`: değişmez (admin gerekli).

**`src/lib/admin/services.functions.ts`**
- `adminListServices`: `assertAdmin` kaldırılır, `supabaseAdmin` kullanır.
- Upsert/toggle/delete: değişmez.

**`src/lib/admin/gallery.functions.ts`**
- `adminListGallery`: `assertAdmin` kaldırılır, `supabaseAdmin` kullanır.
- Upsert/toggle/delete: değişmez.

**`src/lib/admin/slots.functions.ts`, `working-hours.functions.ts`, `site-content.functions.ts`**
- Her dosyada yalnızca `adminList*` benzeri okuma fonksiyonu, aynı şekilde `assertAdmin` kaldırılıp `supabaseAdmin` ile okuma.
- Diğer mutasyon fonksiyonları değişmez.

**`src/lib/admin/users.functions.ts`** (Kullanıcılar sekmesi)
- Bu tablo hassas: tüm kullanıcıların e-postaları, admin rolü listesi ve davetler. Salt-okunur görüntüleyicilere açmak gereksiz risk.
- `adminListUsers` ve tüm diğer fonksiyonlar `assertAdmin`'de kalır (değişmez).

**`src/routes/_authenticated/admin.tsx`**
- `Users` sekmesi (`TabsTrigger` + `TabsContent`) yalnızca `isAdmin` iken render edilecek.
- Non-admin ilk yüklemede varsayılan sekme (`appointments`) açık kalır ve içerik görünür olur.

## Neden Böyle Güvenli
- Kayıt / güncelleme / silme uçları hâlâ `assertAdmin` ile korunuyor — admin olmayan bir kullanıcı, UI'daki disabled durumunu bypass etse bile server yazma işlemini reddeder.
- Okuma uçları yine `requireSupabaseAuth` ile korunuyor — genel internete açık değil, yalnızca giriş yapmış kullanıcılar erişebilir.
- Users sekmesi hassas olduğu için tamamen admin'e özel kalır.

## Test Senaryoları
1. Admin girişi: tüm sekmeler eskisi gibi çalışır, düzenleme yapılabilir.
2. Non-admin girişi: Randevular / Hizmetler / Saatler / Slotlar / Galeri / İçerik sekmelerinde veriler listelenir; butonlar disabled görünür; Kullanıcılar sekmesi görünmez.
3. Non-admin biri UI dışından mutasyon endpoint'ini çağırırsa → `Forbidden` hatası alır.
