## Plan: Kuaför / Güzellik Salonu Şablon Sitesi (Onaylandı + 2 Ek)

### Onaylanmış Yapı (Özet)
Tek sayfa, 7 bölüm: Hero → Hizmetler → Galeri → Hakkımızda → Yorumlar → Randevu/İletişim → Footer. Sabit WhatsApp butonu. Pudra/bej/altın renk paleti. Mobil öncelikli, hafif animasyonlar. Merkezi `src/config/site.config.ts` ile tüm içerik ve renkler yönetilecek.

### Eklenen Gereksinim 1 — Demo İçerik

Şablon "boş" görünmesin diye config dosyası gerçekçi demo verilerle doldurulacak:

- **Hizmetler (6 adet):** Saç Kesimi & Fön (250–450₺), Saç Boyama (800–1500₺), Manikür & Pedikür (350–550₺), Cilt Bakımı (600–900₺), Kaş & Kirpik Tasarımı (200–350₺), Makyaj (500–1200₺). Her biri Lucide ikonu + 1–2 cümlelik Türkçe açıklama.
- **Galeri (8–10 görsel):** `imagegen` ile üretilecek gerçekçi salon/saç/makyaj fotoğrafları. `src/assets/gallery/` altında ES6 import edilecek.
- **Ekip (3 kişi):** Türkçe isim + rol (Baş Stilist, Cilt Uzmanı, Makyaj Sanatçısı) + `imagegen` ile üretilmiş profesyonel portre.
- **Yorumlar (4–5 adet):** Türkçe gerçekçi müşteri yorumları, isim ve 5 yıldız.
- **Hero:** `imagegen` ile üretilmiş sıcak tonlu salon iç mekan görseli.
- **Hakkımızda:** 2 paragraflık örnek işletme hikayesi.
- **İletişim:** Örnek İstanbul adresi, telefon, çalışma saatleri, sahte WhatsApp numarası.

Tüm metinler config'te ortada — gerçek işletmeye uyarlama tek dosya düzenlemesiyle bitecek.

### Eklenen Gereksinim 2 — SEO Alanları (site.config.ts)

Config'e `seo` bölümü eklenecek:

```ts
seo: {
  title: "Lumière Beauty Studio — İstanbul Güzellik Salonu",
  description: "Saç, cilt, makyaj ve bakım hizmetlerinde profesyonel dokunuş. Hemen online randevu alın.",
  favicon: "/favicon.ico",
  ogImage: "/og-image.jpg", // hero görseli baz alınacak
  language: "tr",
}
```

Bu değerler `src/routes/index.tsx` içindeki `head()` fonksiyonuna bağlanacak (title, description, og:title, og:description, og:image, canonical). Favicon yolu `__root.tsx` içindeki `links` dizisinde config'ten okunacak.

### Build Sırası (Bileşen Bileşen)

1. `src/config/site.config.ts` — tüm içerik + tema + SEO
2. `src/styles.css` — config renklerini CSS değişkenlerine bağla, fontları tanımla (DM Serif Display + DM Sans, root `__root.tsx` head'inde `<link>` ile yüklenecek)
3. `imagegen` çağrıları — hero, galeri (8), ekip (3) görselleri `src/assets/` altına
4. Bileşenler: `Navbar` → `HeroSection` → `ServicesSection` → `GallerySection` → `AboutSection` → `TestimonialsSection` → `BookingSection` (form + harita + saatler) → `Footer` → `WhatsAppButton`
5. `src/routes/index.tsx` — bileşenleri compose et + `head()` SEO bağlantısı
6. `src/routes/__root.tsx` — favicon ve font `<link>` etiketleri
7. Mobil ve masaüstü preview ile görsel doğrulama

Plan onaylandığında build aşamasına geçeceğim.