export const tr = {
  nav: {
    services: "Hizmetler",
    gallery: "Galeri",
    about: "Hakkımızda",
    testimonials: "Yorumlar",
    contact: "İletişim",
    toggleMenu: "Menüyü aç/kapat",
    cta: "Randevu Al",
  },
  hero: {
    ourServices: "Hizmetlerimiz",
  },
  services: {
    eyebrow: "Hizmetler",
    heading: "Sizin için özenle seçilmiş bakımlar",
    priceLabel: "Fiyat",
  },
  gallery: {
    eyebrow: "Galeri",
    heading: "Çalışmalarımızdan kareler",
    imageAlt: (i: number) => `Galeri görseli ${i}`,
  },
  about: {
    imageAlt: "Salon iç mekân",
    teamHeading: "Tanışın, Ekibimiz",
  },
  testimonials: {
    eyebrow: "Yorumlar",
    heading: "Müşterilerimiz ne diyor?",
  },
  booking: {
    eyebrow: "Randevu",
    heading: "Sizi aramızda görmek isteriz",
    fields: {
      name: "Ad Soyad",
      phone: "Telefon",
      email: "E-posta",
      service: "Hizmet",
      servicePlaceholder: "Bir hizmet seçin…",
      date: "Tarih",
      time: "Saat",
      note: "Not (isteğe bağlı)",
    },
    submit: "WhatsApp ile Randevu Talep Et",
    submitting: "Yönlendiriliyor…",
    info: {
      address: "Adres",
      phone: "Telefon",
      email: "E-posta",
      hours: "Çalışma Saatleri",
    },
    mapTitle: "Konumumuz",
    validation: {
      name: "Ad soyad en az 2 karakter olmalı",
      phone: "Geçerli bir telefon girin",
      email: "Geçerli bir e-posta girin",
      service: "Bir hizmet seçin",
      date: "Tarih seçin",
      time: "Saat seçin",
      generic: "Lütfen formu kontrol edin",
    },
    toastSuccess: "Randevu talebiniz WhatsApp üzerinden iletiliyor…",
    waMessage: {
      intro: "Merhaba, randevu talebim var:",
      name: "Ad Soyad",
      phone: "Telefon",
      email: "E-posta",
      service: "Hizmet",
      date: "Tarih",
      time: "Saat",
      note: "Not",
    },
  },
  footer: {
    contact: "İletişim",
    follow: "Takip Edin",
    rights: (year: number, name: string) =>
      `© ${year} ${name}. Tüm hakları saklıdır.`,
    credit: "Tasarım & geliştirme şablonu",
  },
  whatsapp: {
    defaultLabel: "Bize Yazın",
  },
} as const;

export type Dictionary = typeof tr;
