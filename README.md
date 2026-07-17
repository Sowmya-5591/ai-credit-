# AI Credit+ — Supabase Backend Integration

This is the backend foundation for the AI Credit+ platform: database schema,
RLS policies, Supabase Auth wiring, a typed service layer, and the Gemini-powered
credit assessment Edge Function. It's built to be dropped into your existing
Next.js/React frontend.

## What's included

```
supabase/
  migrations/
    0001_init_schema.sql     -- 5 tables + relationships + auto-sync trigger
    0002_rls_policies.sql    -- RLS enabled + own-row-only policies, every table
  functions/
    generate-credit-assessment/index.ts   -- Edge Function: reads profile+txns,
                                              calls Gemini, writes the result
src/
  lib/supabase/client.ts     -- typed Supabase client
  lib/supabase/types.ts      -- Database types matching the schema
  lib/auth/AuthContext.tsx   -- signUp/signIn/signOut/reset/Google OAuth, session state
  components/auth/
    ProtectedRoute.tsx       -- route guards (redirect logged-out / logged-in)
    LoginForm.tsx
    RegisterForm.tsx
  services/                  -- one file per table: CRUD used by every page
    financialProfile.service.ts
    transactions.service.ts
    creditAssessment.service.ts
    loanApplications.service.ts
  hooks/useDashboardData.ts  -- aggregates profile+txns+assessment+loans
  app/dashboard/page.tsx     -- example page wired end-to-end to live data
.env.example
```

## Setup

1. `npx supabase init` (if you don't already have a `supabase/` project) and
   `supabase link --project-ref <your-ref>`.
2. `supabase db push` to run both migrations.
3. `supabase functions deploy generate-credit-assessment`
4. `supabase secrets set GEMINI_API_KEY=... SUPABASE_SERVICE_ROLE_KEY=...`
   (get a Gemini key from https://aistudio.google.com/apikey)
5. In Supabase Dashboard → Authentication → Providers, enable **Google** OAuth
   and set the redirect URL to `<your-app-url>/auth/callback`.
6. Copy `.env.example` → `.env.local`, fill in `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Project Settings → API.
7. `npm install @supabase/supabase-js`
8. Wrap your app root in `<AuthProvider>` (from `src/lib/auth/AuthContext.tsx`).

## Design decisions worth knowing

- **RLS is the only access-control layer.** Every table policy checks
  `auth.uid() = user_id`. The service layer never trusts a client-supplied
  `user_id` — it always pulls it from `supabase.auth.getUser()` server-side-verified
  session, so even a tampered request can't write another user's row.
- **The AI key never reaches the browser.** `generateCreditAssessment()` calls
  a Supabase Edge Function over HTTPS; the function holds `GEMINI_API_KEY` and
  `SUPABASE_SERVICE_ROLE_KEY` as server secrets. The function reads the
  caller's own data using the caller's JWT (still RLS-protected) and writes
  the result using the service role (the only writer of `credit_assessments`
  in the system, so users can't fabricate their own score).
- **`public.users` mirrors `auth.users`** via a trigger, so you get a normal
  foreign-key-able profile table without duplicating auth logic.

## What's NOT built yet (by design, given scope)

This covers the auth flow end-to-end and one fully-wired page (Dashboard) as
a reference pattern. The remaining pages from your spec — Financial Health,
Business Health, Loan Recommendation detail, EMI Planner, Risk Alerts, AI
Suggestions, Notifications, Profile, and the whole Admin Dashboard — follow
the *same* pattern: a service file per concern (most already exist above) +
a hook that calls it + a page that renders it inside `<ProtectedRoute>`.

Two pieces need real product decisions before they can be built, not just
more code:
- **Admin role/authorization model** — the current schema has no `role`
  column or admin RLS policies. Needs a decision on whether admins are a
  `service_role` dashboard, a `role` claim on `public.users`, or a separate
  `admins` table.
- **Statement OCR/parsing** (PDF/CSV/Excel upload → transactions) — needs a
  parsing service (e.g. a dedicated Edge Function or external OCR API) since
  it's a distinct pipeline from the CRUD covered here.

Tell me which page or piece to build next and I'll wire it the same way.
