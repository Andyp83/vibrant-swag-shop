type AdminContext = {
  supabase: {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (
          column: string,
          value: unknown,
        ) => {
          eq: (
            column: string,
            value: unknown,
          ) => {
            maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
          };
        };
      };
    };
  };
  userId: string;
};

/** True when the authenticated caller holds the admin role. */
export async function isAdminContext(context: unknown): Promise<boolean> {
  const ctx = context as AdminContext;
  const { data } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId)
    .eq("role", "admin")
    .maybeSingle();
  return Boolean(data);
}

/** Throws unless the authenticated caller holds the admin role. */
export async function assertAdmin(context: unknown): Promise<void> {
  if (!(await isAdminContext(context))) {
    throw new Error("Forbidden: admin access required");
  }
}
