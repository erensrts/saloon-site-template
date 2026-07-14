import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Girişte kullanılan kimliği (kullanıcı adı veya e-posta) e-postaya çevirir.
 * Girdi `@` içeriyorsa aynen döner; aksi halde `profiles` tablosundan kullanıcı
 * kimliğini bulup Auth Admin API ile e-postayı okur. Bulunamazsa hata fırlatır.
 */
export const resolveLoginEmail = createServerFn({ method: "POST" })
  .inputValidator((input: { identifier: string }) => {
    const identifier = String(input?.identifier ?? "").trim();
    if (!identifier) throw new Error("Kimlik gerekli");
    return { identifier };
  })
  .handler(async ({ data }) => {
    if (data.identifier.includes("@")) return { email: data.identifier };
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("username", data.identifier)
      .maybeSingle();
    if (error) throw error;
    if (!profile) throw new Error("Kullanıcı adı bulunamadı");
    const { data: userRes, error: uerr } = await supabaseAdmin.auth.admin.getUserById(profile.id);
    if (uerr) throw uerr;
    const email = userRes?.user?.email ?? null;
    if (!email) throw new Error("Kullanıcı adı bulunamadı");
    return { email };
  });

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
