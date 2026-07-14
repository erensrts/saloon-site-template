import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "@/lib/admin/_authz";

export type AdminUserRow = {
  id: string;
  email: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  isAdmin: boolean;
  isPending?: false;
};

export type PendingInviteRow = {
  id: string;
  email: string;
  createdAt: string;
  isPending: true;
};

export type AdminUserListItem = AdminUserRow | PendingInviteRow;

async function assertAdmin(context: {
  supabase: {
    rpc: (
      fn: "has_role",
      args: { _user_id: string; _role: "admin" | "editor" },
    ) => PromiseLike<{ data: boolean | null }>;
  };
  userId: string;
}) {
  await assertAdmin(context);
}

async function countAdmins(supabase: unknown): Promise<number> {
  const sb = supabase as {
    from: (t: string) => {
      select: (
        cols: string,
        opts: { count: "exact"; head: true },
      ) => {
        eq: (
          col: string,
          val: string,
        ) => Promise<{ count: number | null; error: unknown }>;
      };
    };
  };
  const { count, error } = await sb
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  if (error) throw error;
  return count ?? 0;
}


export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUserListItem[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { data: usersData, error: usersErr } =
      await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (usersErr) throw usersErr;

    const { data: roles, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id,role");
    if (rolesErr) throw rolesErr;
    const adminIds = new Set(
      (roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id),
    );

    const users: AdminUserListItem[] = (usersData?.users ?? []).map((u) => ({
      id: u.id,
      email: u.email ?? null,
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at ?? null,
      isAdmin: adminIds.has(u.id),
      isPending: false as const,
    }));

    const { data: invites, error: invErr } = await supabaseAdmin
      .from("pending_admin_invites")
      .select("id,email,created_at")
      .order("created_at", { ascending: false });
    if (invErr) throw invErr;

    const registeredEmails = new Set(
      users
        .map((u) => (u as AdminUserRow).email?.toLowerCase())
        .filter(Boolean) as string[],
    );

    const pendings: PendingInviteRow[] = (invites ?? [])
      .filter((i) => !registeredEmails.has(i.email.toLowerCase()))
      .map((i) => ({
        id: i.id,
        email: i.email,
        createdAt: i.created_at,
        isPending: true as const,
      }));

    return [...pendings, ...users];
  });

const inviteSchema = z.object({
  email: z.string().email().max(255),
});

export const adminInviteAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inviteSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true; sent: boolean }> => {
    await assertAdmin(context);
    const email = data.email.trim().toLowerCase();
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    // Look up existing user by email.
    const { data: usersData, error: usersErr } =
      await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (usersErr) throw usersErr;
    const existing = (usersData?.users ?? []).find(
      (u) => (u.email ?? "").toLowerCase() === email,
    );

    if (existing) {
      // Already registered — just grant admin role.
      const { error: roleErr } = await supabaseAdmin
        .from("user_roles")
        .upsert(
          { user_id: existing.id, role: "admin" },
          { onConflict: "user_id,role" },
        );
      if (roleErr) throw roleErr;
      return { ok: true, sent: false };
    }

    // Record pending invite so the trigger promotes them on signup.
    const { error: pendErr } = await supabaseAdmin
      .from("pending_admin_invites")
      .upsert(
        { email, invited_by: context.userId },
        { onConflict: "email" },
      );
    if (pendErr) throw pendErr;

    // Send Supabase invite email.
    const { error: inviteErr } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email);
    if (inviteErr) {
      // Roll back the pending row so it isn't stale.
      await supabaseAdmin
        .from("pending_admin_invites")
        .delete()
        .eq("email", email);
      throw inviteErr;
    }

    return { ok: true, sent: true };
  });

const setRoleSchema = z.object({
  userId: z.string().uuid(),
  makeAdmin: z.boolean(),
});

export const adminSetRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => setRoleSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context);
    if (data.userId === context.userId && !data.makeAdmin) {
      throw new Error("self_role_change_blocked");
    }
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    if (data.makeAdmin) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert(
          { user_id: data.userId, role: "admin" },
          { onConflict: "user_id,role" },
        );
      if (error) throw error;
    } else {
      const admins = await countAdmins(supabaseAdmin);
      if (admins <= 1) throw new Error("last_admin_protected");
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", "admin");
      if (error) throw error;
    }
    return { ok: true };
  });

const deleteSchema = z.object({ userId: z.string().uuid() });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => deleteSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context);
    if (data.userId === context.userId) {
      throw new Error("self_delete_blocked");
    }
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    // If target is admin, ensure they aren't the last one.
    const { data: rolesRows, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.userId);
    if (rolesErr) throw rolesErr;
    const targetIsAdmin = (rolesRows ?? []).some((r) => r.role === "admin");
    if (targetIsAdmin) {
      const admins = await countAdmins(supabaseAdmin);
      if (admins <= 1) throw new Error("last_admin_protected");
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw error;
    return { ok: true };
  });

const cancelInviteSchema = z.object({ id: z.string().uuid() });

export const adminCancelInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => cancelInviteSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin
      .from("pending_admin_invites")
      .delete()
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
