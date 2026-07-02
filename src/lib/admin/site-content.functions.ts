import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SiteContentRow = {
  id: string;
  language: string;
  key: string;
  value: unknown;
  created_at: string;
  updated_at: string;
};

async function assertAdmin(context: {
  supabase: {
    rpc: (
      fn: "has_role",
      args: { _user_id: string; _role: "admin" | "editor" },
    ) => PromiseLike<{ data: boolean | null }>;
  };
  userId: string;
}) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden");
}

const listSchema = z
  .object({ language: z.string().min(2).max(5).default("tr") })
  .default({ language: "tr" });

const upsertSchema = z.object({
  language: z.string().min(2).max(5).default("tr"),
  key: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z][a-z0-9_]*$/, "sadece küçük harf, rakam, alt çizgi"),
  value: z.unknown(),
});

const deleteSchema = z.object({
  language: z.string().min(2).max(5).default("tr"),
  key: z.string().min(1).max(64),
});

const COLS = "id,language,key,value,created_at,updated_at";

export const adminListSiteContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => listSchema.parse(data ?? {}))
  .handler(async ({ data, context }): Promise<SiteContentRow[]> => {
    await assertAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("site_content")
      .select(COLS)
      .eq("language", data.language)
      .order("key", { ascending: true });
    if (error) throw error;
    return (rows ?? []) as SiteContentRow[];
  });

export const adminUpsertSiteContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => upsertSchema.parse(data))
  .handler(async ({ data, context }): Promise<SiteContentRow> => {
    await assertAdmin(context);
    const { data: row, error } = await context.supabase
      .from("site_content")
      .upsert(
        {
          language: data.language,
          key: data.key,
          value: data.value as never,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "language,key" },
      )
      .select(COLS)
      .single();
    if (error) throw error;
    return row as SiteContentRow;
  });

export const adminDeleteSiteContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => deleteSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("site_content")
      .delete()
      .eq("language", data.language)
      .eq("key", data.key);
    if (error) throw error;
    return { ok: true };
  });
