import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ServiceRow = {
  id: string;
  language: string;
  icon: string;
  name: string;
  description: string;
  price: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  language: z.string().min(2).max(5).default("tr"),
  icon: z.string().min(1).max(64),
  name: z.string().min(1).max(120),
  description: z.string().max(500).default(""),
  price: z.string().max(64).default(""),
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


/** List all services (including inactive) for the admin UI. */
export const adminListServices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => listSchema.parse(data ?? {}))
  .handler(async ({ data, context }): Promise<ServiceRow[]> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { data: rows, error } = await context.supabase
      .from("services")
      .select(
        "id,language,icon,name,description,price,sort_order,is_active,created_at,updated_at",
      )
      .eq("language", data.language)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (rows ?? []) as ServiceRow[];
  });

/** Create or update a service row. */
export const adminUpsertService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => upsertSchema.parse(data))
  .handler(async ({ data, context }): Promise<ServiceRow> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("services")
        .update({
          language: data.language,
          icon: data.icon,
          name: data.name,
          description: data.description,
          price: data.price,
          sort_order: data.sort_order,
          is_active: data.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id)
        .select(
          "id,language,icon,name,description,price,sort_order,is_active,created_at,updated_at",
        )
        .single();
      if (error) throw error;
      return row as ServiceRow;
    }

    const { data: row, error } = await context.supabase
      .from("services")
      .insert({
        language: data.language,
        icon: data.icon,
        name: data.name,
        description: data.description,
        price: data.price,
        sort_order: data.sort_order,
        is_active: data.is_active,
      })
      .select(
        "id,language,icon,name,description,price,sort_order,is_active,created_at,updated_at",
      )
      .single();
    if (error) throw error;
    return row as ServiceRow;
  });

/** Toggle active flag without opening the full editor. */
export const adminToggleService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => toggleSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { error } = await context.supabase
      .from("services")
      .update({ is_active: data.is_active, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/** Delete a service permanently. */
export const adminDeleteService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => idSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { error } = await context.supabase
      .from("services")
      .delete()
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
