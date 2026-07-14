import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "@/lib/admin/_authz";

export type SlotRow = {
  id: string;
  date: string;
  time: string;
  is_booked: boolean;
  appointment_id: string | null;
  created_at: string;
  updated_at: string;
};

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const listSchema = z.object({
  from: z.string().regex(dateRegex),
  to: z.string().regex(dateRegex),
});

export const adminListSlots = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => listSchema.parse(data))
  .handler(async ({ data, context }): Promise<SlotRow[]> => {
    await assertAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("availability_slots")
      .select("id,date,time,is_booked,appointment_id,created_at,updated_at")
      .gte("date", data.from)
      .lte("date", data.to)
      .order("date", { ascending: true })
      .order("time", { ascending: true });
    if (error) throw error;
    return (rows ?? []) as SlotRow[];
  });

const bulkSchema = z.object({
  from: z.string().regex(dateRegex),
  to: z.string().regex(dateRegex),
  // 0 = Sunday ... 6 = Saturday
  weekdays: z.array(z.number().int().min(0).max(6)).min(1),
  times: z.array(z.string().regex(timeRegex)).min(1).max(48),
});

export const adminBulkGenerateSlots = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => bulkSchema.parse(data))
  .handler(
    async ({ data, context }): Promise<{ inserted: number; skipped: number }> => {
      await assertAdmin(context);

      const from = new Date(`${data.from}T00:00:00Z`);
      const to = new Date(`${data.to}T00:00:00Z`);
      if (to.getTime() < from.getTime()) {
        throw new Error("Bitiş tarihi başlangıçtan önce olamaz");
      }
      const dayMs = 24 * 60 * 60 * 1000;
      const spanDays = Math.floor((to.getTime() - from.getTime()) / dayMs) + 1;
      if (spanDays > 120) throw new Error("En fazla 120 günlük aralık üretilebilir");

      const weekdaySet = new Set(data.weekdays);
      const rows: { date: string; time: string }[] = [];
      for (let i = 0; i < spanDays; i++) {
        const d = new Date(from.getTime() + i * dayMs);
        if (!weekdaySet.has(d.getUTCDay())) continue;
        const iso = d.toISOString().slice(0, 10);
        for (const t of data.times) {
          rows.push({ date: iso, time: `${t}:00` });
        }
      }

      if (rows.length === 0) return { inserted: 0, skipped: 0 };
      if (rows.length > 2000) throw new Error("Çok fazla kayıt (>2000)");

      // Fetch existing (date,time) pairs to compute skipped count
      const dates = Array.from(new Set(rows.map((r) => r.date)));
      const { data: existing, error: exErr } = await context.supabase
        .from("availability_slots")
        .select("date,time")
        .in("date", dates);
      if (exErr) throw exErr;
      const existingKey = new Set(
        (existing ?? []).map((r) => `${r.date}|${r.time}`),
      );
      const fresh = rows.filter((r) => !existingKey.has(`${r.date}|${r.time}`));

      if (fresh.length === 0) {
        return { inserted: 0, skipped: rows.length };
      }

      const { error: insErr } = await context.supabase
        .from("availability_slots")
        .insert(fresh);
      if (insErr) throw insErr;

      return { inserted: fresh.length, skipped: rows.length - fresh.length };
    },
  );

const deleteSchema = z.object({ id: z.string().uuid() });
export const adminDeleteSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => deleteSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("availability_slots")
      .delete()
      .eq("id", data.id)
      .eq("is_booked", false);
    if (error) throw error;
    return { ok: true };
  });

const deleteRangeSchema = z.object({
  from: z.string().regex(dateRegex),
  to: z.string().regex(dateRegex),
});
export const adminDeleteFreeSlotsInRange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => deleteRangeSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ deleted: number }> => {
    await assertAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("availability_slots")
      .delete()
      .gte("date", data.from)
      .lte("date", data.to)
      .eq("is_booked", false)
      .select("id");
    if (error) throw error;
    return { deleted: rows?.length ?? 0 };
  });
