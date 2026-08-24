type AuthLike = {
  auth: {
    getUser: () => Promise<{
      data: { user: { email_confirmed_at?: string | null; confirmed_at?: string | null } | null };
      error: unknown;
    }>;
  };
};

/** True only when the signed-in user has confirmed their email address. */
export async function isEmailVerified(supabase: AuthLike): Promise<boolean> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return false;
  return Boolean(data.user.email_confirmed_at ?? data.user.confirmed_at);
}
