import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Şu anki kullanıcının admin rolü olup olmadığını döner.
 * RLS ve `has_role` üzerinden güvenli kontrol.
 */
export const getMyRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) throw error;
    return { userId: context.userId, isAdmin: Boolean(data) };
  });

/**
 * Sistemde henüz admin yoksa çağıran kullanıcıyı admin yapar.
 * `claim_first_admin` fonksiyonu kendi içinde admin sayısını kontrol ettiği
 * için güvenli — mevcut admin varsa `false` döner ve hiçbir değişiklik olmaz.
 */
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("claim_first_admin", {
      _user_id: context.userId,
    });
    if (error) throw error;
    return { claimed: Boolean(data) };
  });
