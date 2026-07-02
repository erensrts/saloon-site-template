import { queryOptions } from "@tanstack/react-query";
import { siteConfig } from "@/config/site.config";
import {
  getPublicSiteData,
  type PublicSiteData,
} from "./site-content.functions";

export type SiteData = ReturnType<typeof mergeSiteData>;

/**
 * DB verisi + `siteConfig` fallback. DB'de bir alan yoksa / bozuksa
 * config değeri kullanılır. Görsel URL'leri sadece http(s) ile başlıyorsa
 * DB'den alınır (aksi halde build edilmiş import'lar korunur).
 */
export function mergeSiteData(remote: PublicSiteData) {
  const content = (remote?.content ?? {}) as Record<string, any>;
  const hero = content.hero ?? {};
  const about = content.about ?? {};
  const team = content.team ?? {};
  const testimonials = content.testimonials ?? {};
  const contact = content.contact ?? {};
  const social = content.social ?? {};

  const dbGallery = (remote?.gallery ?? [])
    .map((g) => g.url)
    .filter((u): u is string => typeof u === "string" && /^https?:\/\//.test(u));

  return {
    businessName: hero.businessName ?? siteConfig.businessName,
    businessNameSuffix:
      hero.businessNameSuffix ?? siteConfig.businessNameSuffix,
    tagline: hero.tagline ?? siteConfig.tagline,
    heroSubtitle: hero.subtitle ?? siteConfig.heroSubtitle,
    heroCta: hero.cta ?? siteConfig.heroCta,
    heroImage: siteConfig.heroImage,

    about: {
      title: about.title ?? siteConfig.about.title,
      subtitle: about.subtitle ?? siteConfig.about.subtitle,
      image: siteConfig.about.image,
      paragraphs: Array.isArray(about.paragraphs)
        ? (about.paragraphs as string[])
        : siteConfig.about.paragraphs,
    },

    team: Array.isArray(team.members) && team.members.length
      ? (team.members as typeof siteConfig.team)
      : siteConfig.team,

    services: remote && remote.services.length
      ? remote.services.map((s) => ({
          icon: s.icon,
          name: s.name,
          description: s.description,
          price: s.price,
        }))
      : siteConfig.services,

    gallery: dbGallery.length ? dbGallery : siteConfig.gallery,

    testimonials:
      Array.isArray(testimonials.items) && testimonials.items.length
        ? (testimonials.items as typeof siteConfig.testimonials)
        : siteConfig.testimonials,

    contact: {
      phone: contact.phone ?? siteConfig.contact.phone,
      whatsapp: contact.whatsapp ?? siteConfig.contact.whatsapp,
      whatsappMessage:
        contact.whatsappMessage ?? siteConfig.contact.whatsappMessage,
      whatsappLabel:
        contact.whatsappLabel ?? siteConfig.contact.whatsappLabel,
      email: contact.email ?? siteConfig.contact.email,
      address: contact.address ?? siteConfig.contact.address,
      mapEmbed: contact.mapEmbed ?? siteConfig.contact.mapEmbed,
      hours: remote && remote.hours.length
        ? remote.hours.map((h) => ({
            day: h.day_label,
            time: h.time_label,
          }))
        : siteConfig.contact.hours,
    },

    social: {
      instagram: social.instagram ?? siteConfig.social.instagram,
      facebook: social.facebook ?? siteConfig.social.facebook,
      tiktok: social.tiktok ?? siteConfig.social.tiktok,
    },

    seo: siteConfig.seo,
  };
}

export const FALLBACK_SITE_DATA: SiteData = mergeSiteData(null);

export const siteDataQueryOptions = queryOptions({
  queryKey: ["public-site-data"],
  queryFn: async () => mergeSiteData(await getPublicSiteData()),
  staleTime: 60_000,
});
