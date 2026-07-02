import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

type ServiceRow = {
  icon: string;
  name: string;
  description: string;
  price: string;
  sort_order: number;
};
type GalleryRow = { url: string; alt: string; sort_order: number };
type HoursRow = { day_label: string; time_label: string; sort_order: number };

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [k: string]: JsonValue };

export type PublicSiteData = {
  services: ServiceRow[];
  gallery: GalleryRow[];
  hours: HoursRow[];
  content: Record<string, JsonValue>;
} | null;

/**
 * Public read: services, gallery, working hours, site content JSON blocks.
 * Uses publishable key (RLS applies as `anon`). On any failure returns null
 * so callers can fall back to the bundled `siteConfig` defaults.
 */
export const getPublicSiteData = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicSiteData> => {
    try {
      const url =
        process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
      const key =
        process.env.SUPABASE_PUBLISHABLE_KEY ??
        process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      if (!url || !key) return null;

      const supa = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          storage: undefined,
        },
      });

      const language = "tr";
      const [servicesRes, galleryRes, hoursRes, contentRes] = await Promise.all([
        supa
          .from("services")
          .select("icon,name,description,price,sort_order")
          .eq("language", language)
          .eq("is_active", true)
          .order("sort_order"),
        supa
          .from("gallery_images")
          .select("url,alt,sort_order")
          .eq("language", language)
          .eq("is_active", true)
          .order("sort_order"),
        supa
          .from("working_hours")
          .select("day_label,time_label,sort_order")
          .eq("language", language)
          .order("sort_order"),
        supa
          .from("site_content")
          .select("key,value")
          .eq("language", language),
      ]);

      const content: Record<string, unknown> = {};
      for (const row of contentRes.data ?? []) {
        content[row.key as string] = row.value;
      }

      return {
        services: (servicesRes.data ?? []) as ServiceRow[],
        gallery: (galleryRes.data ?? []) as GalleryRow[],
        hours: (hoursRes.data ?? []) as HoursRow[],
        content,
      };
    } catch (err) {
      console.error("getPublicSiteData failed", err);
      return null;
    }
  },
);
