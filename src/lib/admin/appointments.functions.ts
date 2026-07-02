import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const APPOINTMENT_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export type AppointmentRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  service: string;
  date: string;
  time: string;
  note: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

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

const listSchema = z.object({
  from: z.string().regex(dateRegex).optional(),
  to: z.string().regex(dateRegex).optional(),
  status: z.enum(APPOINTMENT_STATUSES).optional(),
  search: z.string().trim().max(100).optional(),
});

export const adminListAppointments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => listSchema.parse(data ?? {}))
  .handler(async ({ data, context }): Promise<AppointmentRow[]> => {
    await assertAdmin(context);
    let q = context.supabase
      .from("appointments")
      .select(
        "id,name,phone,email,service,date,time,note,status,created_at,updated_at",
      )
      .order("date", { ascending: false })
      .order("time", { ascending: false })
      .limit(500);

    if (data.from) q = q.gte("date", data.from);
    if (data.to) q = q.lte("date", data.to);
    if (data.status) q = q.eq("status", data.status);
    if (data.search) {
      const like = `%${data.search}%`;
      q = q.or(`name.ilike.${like},phone.ilike.${like},email.ilike.${like}`);
    }

    const { data: rows, error } = await q;
    if (error) throw error;
    return (rows ?? []) as AppointmentRow[];
  });

const updateStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(APPOINTMENT_STATUSES),
});

export const adminUpdateAppointmentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => updateStatusSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("appointments")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

const deleteSchema = z.object({ id: z.string().uuid() });
export const adminDeleteAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => deleteSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context);
    // Free any linked slot first
    const { error: slotErr } = await context.supabase
      .from("availability_slots")
      .update({ is_booked: false, appointment_id: null })
      .eq("appointment_id", data.id);
    if (slotErr) throw slotErr;

    const { error } = await context.supabase
      .from("appointments")
      .delete()
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
