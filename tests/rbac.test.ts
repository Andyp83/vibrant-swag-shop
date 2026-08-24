/**
 * RBAC regression tests.
 *
 * Verifies that a signed-in NON-ADMIN user (and the anonymous role) cannot:
 *  - execute the privileged `has_role` SECURITY DEFINER helper
 *  - read or write admin-only tables (quote_requests, customers, quotes,
 *    jobs, proofs, invoices, payments, email_log, ...)
 *  - grant themselves an admin role row
 *  - mutate the public catalogue / banners
 *
 * Requires SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY and SUPABASE_SERVICE_ROLE_KEY
 * in the environment. The service role key is used ONLY to create and delete
 * the throwaway test user.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const SUPABASE_URL = process.env["SUPABASE_URL"]!;
const PUBLISHABLE_KEY = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
const SERVICE_ROLE_KEY = process.env["SUPABASE_SERVICE_ROLE_KEY"]!;

const ADMIN_ONLY_TABLES = [
  "quote_requests",
  "customers",
  "quotes",
  "quote_line_items",
  "jobs",
  "job_events",
  "proofs",
  "invoices",
  "payments",
  "email_log",
  "customer_uploads",
] as const;

const PUBLIC_READ_TABLES = [
  "catalog_categories",
  "catalog_subcategories",
  "catalog_products",
  "site_banners",
] as const;

function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const email = `rbac-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
const password = `Test-${Math.random().toString(36).slice(2)}-${Date.now()}`;

let userId = "";
let user: SupabaseClient;

beforeAll(async () => {
  for (const key of [
    "SUPABASE_URL",
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ]) {
    if (!process.env[key]) throw new Error(`Missing ${key} in environment`);
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("Could not create test user");
  userId = data.user.id;

  // Guard: the "first user becomes admin" trigger must not have fired for us.
  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (roles?.length) {
    await admin.auth.admin.deleteUser(userId);
    throw new Error("Test user unexpectedly received a role; aborting");
  }

  user = anonClient();
  const { error: signInError } = await user.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) throw signInError;
}, 60_000);

afterAll(async () => {
  if (userId) await admin.auth.admin.deleteUser(userId);
});

describe("privileged helper functions", () => {
  it("non-admin cannot execute has_role", async () => {
    const { error } = await user.rpc("has_role" as never, {
      _user_id: userId,
      _role: "admin",
    } as never);
    expect(error).not.toBeNull();
  });

  it("anonymous cannot execute has_role", async () => {
    const { error } = await anonClient().rpc("has_role" as never, {
      _user_id: userId,
      _role: "admin",
    } as never);
    expect(error).not.toBeNull();
  });

  it("non-admin cannot execute grant_first_user_admin", async () => {
    const { error } = await user.rpc("grant_first_user_admin" as never);
    expect(error).not.toBeNull();
  });
});

describe("restricted rows", () => {
  it.each(ADMIN_ONLY_TABLES)("non-admin cannot read %s", async (table) => {
    const { data, error } = await user.from(table).select("id").limit(1);
    // Either denied outright, or RLS filters every row away.
    expect(error !== null || (data ?? []).length === 0).toBe(true);
  });

  it.each(ADMIN_ONLY_TABLES)("anonymous cannot read %s", async (table) => {
    const { data, error } = await anonClient().from(table).select("id").limit(1);
    expect(error !== null || (data ?? []).length === 0).toBe(true);
  });

  it("non-admin cannot read other users' role rows", async () => {
    const { data, error } = await user.from("user_roles").select("user_id");
    expect(error).toBeNull();
    expect((data ?? []).every((row) => row.user_id === userId)).toBe(true);
  });

  it("non-admin cannot read the admin's role rows", async () => {
    const { data: adminRows } = await admin
      .from("user_roles")
      .select("id")
      .eq("role", "admin")
      .limit(1);
    const adminRoleId = adminRows?.[0]?.id;
    if (!adminRoleId) return; // no admin provisioned yet
    const { data } = await user.from("user_roles").select("id").eq("id", adminRoleId);
    expect((data ?? []).length).toBe(0);
  });
});

describe("privilege escalation", () => {
  it("non-admin cannot grant itself an admin role", async () => {
    const { error } = await user
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });
    expect(error).not.toBeNull();

    const { data: check } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId);
    expect((check ?? []).length).toBe(0);
  });

  it("non-admin cannot update an existing role row", async () => {
    const { data, error } = await user
      .from("user_roles")
      .update({ role: "admin" })
      .neq("user_id", userId)
      .select("id");
    expect(error !== null || (data ?? []).length === 0).toBe(true);
  });
});

describe("catalogue writes", () => {
  it.each(PUBLIC_READ_TABLES)("non-admin can read %s but not write it", async (table) => {
    const { error: readError } = await user.from(table).select("id").limit(1);
    expect(readError).toBeNull();

    const { data, error } = await user
      .from(table)
      .update({ sort_order: 999_999 })
      .gte("sort_order", 0)
      .select("id");
    expect(error !== null || (data ?? []).length === 0).toBe(true);
  });

  it("non-admin cannot delete catalogue rows", async () => {
    const { data, error } = await user
      .from("catalog_products")
      .delete()
      .gte("sort_order", 0)
      .select("id");
    expect(error !== null || (data ?? []).length === 0).toBe(true);
  });
});

describe("admin-only writes on business tables", () => {
  it("non-admin cannot insert a job", async () => {
    const { error } = await user.from("jobs").insert({
      number: "RBAC-TEST",
      customer_id: "00000000-0000-0000-0000-000000000000",
      title: "should fail",
    });
    expect(error).not.toBeNull();
  });

  it("non-admin cannot update quote requests", async () => {
    const { data, error } = await user
      .from("quote_requests")
      .update({ status: "won" })
      .neq("id", "00000000-0000-0000-0000-000000000000")
      .select("id");
    expect(error !== null || (data ?? []).length === 0).toBe(true);
  });
});
