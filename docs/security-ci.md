# Automated security checks

The `Security` workflow (`.github/workflows/security.yml`) runs on every push to
`main`, on every pull request, weekly on Mondays, and on demand.

## Jobs

| Job | What it catches |
| --- | --- |
| **Dependency audit** | Known CVEs in npm dependencies (`bun audit`, fails on high/critical). |
| **Secret scan** | Credentials, API keys or tokens committed anywhere in git history (gitleaks). |
| **Lint, typecheck & build** | Unsafe patterns caught by ESLint, type errors, and a production build that must succeed before deploy. |
| **RBAC regression tests** | Non-admin users calling privileged helpers or reading restricted rows (`tests/rbac.test.ts`). |

## Required repository secrets

Add these under **Settings → Secrets and variables → Actions**:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (used only to create/delete the throwaway test user)
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`

If the backend secrets are absent the RBAC job logs a warning and passes, so
forked pull requests do not fail spuriously.

## Running locally

```bash
bun audit --audit-level=high   # dependency CVEs
bun run lint                   # static analysis
bun run test:rbac              # access-control regression suite
```

In addition, the Lovable Security tab runs backend policy scans (RLS coverage,
exposed columns, permissive policies) — review it before each release.
