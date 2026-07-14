import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "@/lib/admin/_authz";

export type GalleryRow = {
  id: string;
  language: string;
  url: string;
  alt: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  language: z.string().min(2).max(5).default("tr"),
  url: z.string().url().max(2048),
  alt: z.string().max(200).default(""),
  sort_order: z.number().int().min(0).max(9999).default(0),
  is_active: z.boolean().default(true),
});

const idSchema = z.object({ id: z.string().uuid() });
const toggleSchema = z.object({
  id: z.string().uuid(),
  is_active: z.boolean(),
});
const listSchema = z
  .object({ language: z.string().min(2).max(5).default("tr") })
  .default({ language: "tr" });

const COLS =
  "id,language,url,alt,sort_order,is_active,created_at,updated_at";

export const adminListGallery = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => listSchema.parse(data ?? {}))
  .handler(async ({ data }): Promise<GalleryRow[]> => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: rows, error } = await supabaseAdmin
      .from("gallery_images")
      .select(COLS)
      .eq("language", data.language)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (rows ?? []) as GalleryRow[];
  });

export const adminUpsertGallery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => upsertSchema.parse(data))
  .handler(async ({ data, context }): Promise<GalleryRow> => {
    await assertAdmin(context);
    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("gallery_images")
        .update({
          language: data.language,
          url: data.url,
          alt: data.alt,
          sort_order: data.sort_order,
          is_active: data.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id)
        .select(COLS)
        .single();
      if (error) throw error;
      return row as GalleryRow;
    }
    const { data: row, error } = await context.supabase
      .from("gallery_images")
      .insert({
        language: data.language,
        url: data.url,
        alt: data.alt,
        sort_order: data.sort_order,
        is_active: data.is_active,
      })
      .select(COLS)
      .single();
    if (error) throw error;
    return row as GalleryRow;
  });

export const adminToggleGallery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => toggleSchema.parse(data))
  .handler(async ({ data, context }): Promise<GalleryRow> => {
    await assertAdmin(context);
    const { data: row, error } = await context.supabase
      .from("gallery_images")
      .update({ is_active: data.is_active, updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .select(COLS)
      .single();
    if (error) throw error;
    return row as GalleryRow;
  });

export const adminDeleteGallery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => idSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("gallery_images")
      .delete()
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
