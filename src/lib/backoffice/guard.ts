type AdminContext = {
  supabase: {
    rpc: (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: boolean | null; error: unknown }>;
  };
  userId: string;
};

/** Throws unless the authenticated caller holds the admin role. */
export async function assertAdmin(context: unknown): Promise<void> {
  const ctx = context as AdminContext;
  const { data } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden: admin access required");
}
