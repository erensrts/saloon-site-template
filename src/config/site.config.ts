import heroImg from "@/assets/hero.jpg";
import aboutImg from "@/assets/about.jpg";
import g1 from "@/assets/gallery/g1.jpg";
import g2 from "@/assets/gallery/g2.jpg";
import g3 from "@/assets/gallery/g3.jpg";
import g4 from "@/assets/gallery/g4.jpg";
import g5 from "@/assets/gallery/g5.jpg";
import g6 from "@/assets/gallery/g6.jpg";
import g7 from "@/assets/gallery/g7.jpg";
import g8 from "@/assets/gallery/g8.jpg";
import t1 from "@/assets/team/t1.jpg";
import t2 from "@/assets/team/t2.jpg";
import t3 from "@/assets/team/t3.jpg";

/**
 * Tek dosya = tek işletme.
 * Bu şablonu farklı bir işletmeye (diş hekimi, fitness, masaj salonu vb.)
 * uyarlamak için sadece bu dosyadaki değerleri değiştirin.
 */
export const siteConfig = {
  businessName: "Lumière",
  businessNameSuffix: "Beauty Studio",
  tagline: "Güzelliğinizi aydınlatıyoruz",
  heroSubtitle:
    "İstanbul’un kalbinde, sıcak ve davetkâr atmosferimizde sizi en iyi haline kavuşturuyoruz.",
  heroCta: "Randevu Al",
  heroImage: heroImg,

  about: {
    title: "Hakkımızda",
    subtitle: "10 yıllık deneyim, sonsuz ilham.",
    image: aboutImg,
    paragraphs: [
      "Lumière Beauty Studio, 2014 yılında küçük bir hayalle yola çıktı: her kadının kendini özel hissettiği, sıcak ve profesyonel bir alan yaratmak. Bugün üç katlı butik salonumuzda saçtan cilde, makyajdan tırnak bakımına kadar tüm güzellik ihtiyaçlarınızı tek bir çatı altında karşılıyoruz.",
      "Ekibimiz uluslararası eğitim almış uzmanlardan oluşuyor. En kaliteli ürünleri, en yumuşak dokunuşla birleştirerek size unutulmaz bir deneyim yaşatmak için buradayız.",
    ],
  },

  team: [
    {
      name: "Ayşe Kaya",
      role: "Baş Stilist & Kurucu",
      image: t1,
    },
    {
      name: "Elif Demir",
      role: "Cilt Bakım Uzmanı",
      image: t2,
    },
    {
      name: "Selin Yılmaz",
      role: "Makyaj Sanatçısı",
      image: t3,
    },
  ],

  services: [
    {
      icon: "Scissors",
      name: "Saç Kesimi & Fön",
      description: "Yüz hatlarınıza özel kesim ve profesyonel fön tekniği.",
      price: "₺250 – ₺450",
    },
    {
      icon: "Palette",
      name: "Saç Boyama & Balyaj",
      description: "Organik boyalarla doğal görünümlü renk geçişleri.",
      price: "₺800 – ₺1.500",
    },
    {
      icon: "Sparkles",
      name: "Manikür & Pedikür",
      description: "Klasik ve kalıcı uygulamalar, hijyenik ortamda.",
      price: "₺350 – ₺550",
    },
    {
      icon: "Flower2",
      name: "Cilt Bakımı",
      description: "Cildinizi yenileyen profesyonel bakım protokolleri.",
      price: "₺600 – ₺900",
    },
    {
      icon: "Eye",
      name: "Kaş & Kirpik Tasarımı",
      description: "Yüzünüzün ifadesini ön plana çıkaran şekillendirme.",
      price: "₺200 – ₺350",
    },
    {
      icon: "Brush",
      name: "Profesyonel Makyaj",
      description: "Davet, düğün ve özel günler için kalıcı makyaj.",
      price: "₺500 – ₺1.200",
    },
  ],

  gallery: [g1, g2, g3, g4, g5, g6, g7, g8],

  testimonials: [
    {
      name: "Merve A.",
      text: "Yıllardır gittiğim en iyi salon. Ayşe Hanım’ın elinden çıkan saç kesimi tam aradığım şeydi. Atmosferi de muhteşem.",
      rating: 5,
    },
    {
      name: "Zeynep T.",
      text: "Düğün makyajım için Selin’i seçmiştim. Tüm gün tazeliğini korudu, fotoğraflarda harika çıktı. Teşekkürler!",
      rating: 5,
    },
    {
      name: "Ceren K.",
      text: "Cilt bakımından sonra cildim bambaşka oldu. Elif Hanım çok ilgili ve bilgili. Kesinlikle tavsiye ederim.",
      rating: 5,
    },
    {
      name: "Defne S.",
      text: "Hem fiyatları uygun hem de işçilik birinci sınıf. Salonun dekoru bile insanın moralini düzeltiyor.",
      rating: 5,
    },
  ],

  contact: {
    phone: "+90 541 357 75 35",
    whatsapp: "905413577535",
    whatsappMessage: "Merhaba, randevu almak istiyorum.",
    whatsappLabel: "Bize Yazın",
    email: "info@lumiere-studio.com",
    address: "Bağdat Caddesi No: 142, Kadıköy / İstanbul",
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d752.5!2d29.063!3d40.971!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDU4JzE1LjYiTiAyOcKwMDMnNDYuOCJF!5e0!3m2!1str!2str!4v1700000000000",
    hours: [
      { day: "Pazartesi – Cuma", time: "10:00 – 20:00" },
      { day: "Cumartesi", time: "10:00 – 19:00" },
      { day: "Pazar", time: "12:00 – 18:00" },
    ],
  },

  social: {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    tiktok: "https://tiktok.com",
  },

  /** SEO ayarları (head etiketlerinde kullanılır) */
  seo: {
    title: "Lumière Beauty Studio — İstanbul Güzellik Salonu",
    description:
      "Saç, cilt, makyaj ve bakım hizmetlerinde profesyonel dokunuş. Kadıköy’deki butik salonumuzdan online randevu alın.",
    favicon: "/favicon.ico",
    ogImage: "/og-image.jpg",
    language: "tr",
  },
};

export type SiteConfig = typeof siteConfig;
