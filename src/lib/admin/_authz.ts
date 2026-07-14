/**
 * Shared admin authorization helper.
 *
 * Uses the authenticated user's supabase client to check `user_roles`
 * directly. The "Users can view own roles" RLS policy allows every
 * signed-in user to see their own rows, so no elevated privileges are
 * needed. This replaced the previous `has_role` RPC calls after that
 * helper was moved to the private schema (no longer exposed via the
 * Data API).
 */
export async function assertAdmin(context: {
  supabase: {
    from: (t: "user_roles") => {
      select: (cols: string) => {
        eq: (
          col: string,
          val: string,
        ) => {
          eq: (
            col: string,
            val: string,
          ) => {
            maybeSingle: () => PromiseLike<{
              data: { id: string } | null;
              error: unknown;
            }>;
          };
        };
      };
    };
  };
  userId: string;
}): Promise<void> {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Forbidden");
}
