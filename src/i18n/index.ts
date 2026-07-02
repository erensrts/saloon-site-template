import { siteConfig } from "@/config/site.config";
import { tr, type Dictionary } from "./tr";
import { en } from "./en";

export type Locale = "tr" | "en";

const dictionaries: Record<Locale, Dictionary> = { tr, en };

/**
 * Aktif dil. Şu an tek dil / build; canlı değiştirici yok.
 * Yeni bir dil versiyonu için sadece `siteConfig.locale` değiştirilir.
 */
export const activeLocale: Locale =
  (siteConfig.locale as Locale) ?? "tr";

/**
 * Aktif dilin sözlüğü. Bileşenler:
 *   const { services } = t;
 *   <h2>{services.heading}</h2>
 * şeklinde doğrudan kullanabilir — kayıp anahtar derleme zamanında yakalanır.
 */
export const t: Dictionary = dictionaries[activeLocale];

/**
 * Intl.DateTimeFormat için BCP-47 kodu.
 */
export const intlLocale: string =
  activeLocale === "tr" ? "tr-TR" : "en-US";
