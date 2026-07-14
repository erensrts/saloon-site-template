import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "@/lib/admin/_authz";

export type WorkingHourRow = {
  id: string;
  language: string;
  day_label: string;
  time_label: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  language: z.string().min(2).max(5).default("tr"),
  day_label: z.string().min(1).max(64),
  time_label: z.string().min(1).max(64),
  sort_order: z.number().int().min(0).max(9999).default(0),
});

const idSchema = z.object({ id: z.string().uuid() });
const listSchema = z
  .object({ language: z.string().min(2).max(5).default("tr") })
  .default({ language: "tr" });

async function assertAdmin(context: {
  supabase: { rpc: (fn: "has_role", args: { _user_id: string; _role: "admin" | "editor" }) => PromiseLike<{ data: boolean | null }> };
  userId: string;
}) {
  await assertAdmin(context);
}



export const adminListWorkingHours = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => listSchema.parse(data ?? {}))
  .handler(async ({ data, context }): Promise<WorkingHourRow[]> => {
    await assertAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("working_hours")
      .select("id,language,day_label,time_label,sort_order,created_at,updated_at")
      .eq("language", data.language)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (rows ?? []) as WorkingHourRow[];
  });

export const adminUpsertWorkingHour = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => upsertSchema.parse(data))
  .handler(async ({ data, context }): Promise<WorkingHourRow> => {
    await assertAdmin(context);
    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("working_hours")
        .update({
          language: data.language,
          day_label: data.day_label,
          time_label: data.time_label,
          sort_order: data.sort_order,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id)
        .select("id,language,day_label,time_label,sort_order,created_at,updated_at")
        .single();
      if (error) throw error;
      return row as WorkingHourRow;
    }
    const { data: row, error } = await context.supabase
      .from("working_hours")
      .insert({
        language: data.language,
        day_label: data.day_label,
        time_label: data.time_label,
        sort_order: data.sort_order,
      })
      .select("id,language,day_label,time_label,sort_order,created_at,updated_at")
      .single();
    if (error) throw error;
    return row as WorkingHourRow;
  });

export const adminDeleteWorkingHour = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => idSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("working_hours")
      .delete()
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
