import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Şu anki kullanıcının admin rolü olup olmadığını döner.
 *
 * `has_role` yardımcı fonksiyonu artık `private` şemasında olduğu için
 * PostgREST üzerinden RPC ile çağrılamıyor; rolü doğrudan `user_roles`
 * tablosundan okuyoruz (RLS izin veriyor: kullanıcı kendi rollerini görebilir).
 */
export const getMyRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (error) throw error;
    return { userId: context.userId, isAdmin: Boolean(data) };
  });

/**
 * Sistemde henüz admin yoksa çağıran kullanıcıyı admin yapar.
 *
 * Admin sayısı kontrolü ve rol yazımı service-role istemcisi ile
 * yapılır — böylece `claim_first_admin` fonksiyonunun API üzerinden
 * çağrılabilir olmasına gerek kalmaz.
 */
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { count, error: countErr } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (countErr) throw countErr;
    if ((count ?? 0) > 0) return { claimed: false };

    const { error: insertErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (insertErr) throw insertErr;
    return { claimed: true };
  });
