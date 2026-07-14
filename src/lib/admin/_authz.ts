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
export async function assertAdmin(context: unknown): Promise<void> {
  const ctx = context as {
    supabase: {
      from: (t: string) => {
        select: (cols: string) => {
          eq: (
            col: string,
            val: string,
          ) => {
            eq: (
              col: string,
              val: string,
            ) => {
              maybeSingle: () => Promise<{
                data: { id: string } | null;
                error: unknown;
              }>;
            };
          };
        };
      };
    };
    userId: string;
  };
  const { data, error } = await ctx.supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", ctx.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Forbidden");
}
