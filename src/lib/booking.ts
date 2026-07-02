import { supabase } from "@/integrations/supabase/client";

export type FreeSlot = { id: string; date: string; time: string };

/**
 * Public read of un-booked availability slots. Anon RLS grants only
 * (id, date, time, is_booked, created_at, updated_at) — appointment_id
 * is hidden.
 */
export async function fetchFreeSlots(opts: {
  from: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD (inclusive)
}): Promise<FreeSlot[]> {
  let q = supabase
    .from("availability_slots")
    .select("id,date,time")
    .eq("is_booked", false)
    .gte("date", opts.from)
    .order("date", { ascending: true })
    .order("time", { ascending: true });
  if (opts.to) q = q.lte("date", opts.to);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as FreeSlot[];
}

export type BookingInput = {
  slotId: string;
  name: string;
  phone: string;
  service: string;
  email?: string | null;
  note?: string | null;
};

/**
 * Atomic booking: locks the slot, inserts the appointment, marks the slot
 * booked in one transaction. Throws with a normalized message:
 *   - "slot_unavailable" — slot was taken between fetch and submit
 *   - "slot_past" — date is in the past
 *   - "invalid_*" — server-side length checks
 */
export async function bookAppointment(input: BookingInput): Promise<string> {
  // rpc<Database, ...> would need regenerated types; cast the client narrowly.
  const { data, error } = await (
    supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: string | null; error: { message: string } | null }>
  )("book_appointment", {
    _slot_id: input.slotId,
    _name: input.name,
    _phone: input.phone,
    _service: input.service,
    _email: input.email ?? null,
    _note: input.note ?? null,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("empty_response");
  return data;
}
