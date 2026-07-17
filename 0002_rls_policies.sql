-- ============================================================
-- AI Credit+ : Row Level Security
-- Every table: users can only read/write their own rows.
-- No table is readable/writable without a valid auth session.
-- ============================================================

alter table public.users enable row level security;
alter table public.financial_profile enable row level security;
alter table public.transactions enable row level security;
alter table public.credit_assessments enable row level security;
alter table public.loan_applications enable row level security;

-- ---------------- users ----------------
create policy "users_select_own"
  on public.users for select
  using (auth.uid() = id);

create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- inserts happen via the handle_new_user() trigger (security definer),
-- so no direct insert policy is granted to end users.

-- ---------------- financial_profile ----------------
create policy "financial_profile_select_own"
  on public.financial_profile for select
  using (auth.uid() = user_id);

create policy "financial_profile_insert_own"
  on public.financial_profile for insert
  with check (auth.uid() = user_id);

create policy "financial_profile_update_own"
  on public.financial_profile for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "financial_profile_delete_own"
  on public.financial_profile for delete
  using (auth.uid() = user_id);

-- ---------------- transactions ----------------
create policy "transactions_select_own"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "transactions_insert_own"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "transactions_update_own"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "transactions_delete_own"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- ---------------- credit_assessments ----------------
-- Written only by the generate-credit-assessment Edge Function
-- (using the service role key), read-only for the owning user.
create policy "credit_assessments_select_own"
  on public.credit_assessments for select
  using (auth.uid() = user_id);

-- ---------------- loan_applications ----------------
create policy "loan_applications_select_own"
  on public.loan_applications for select
  using (auth.uid() = user_id);

create policy "loan_applications_insert_own"
  on public.loan_applications for insert
  with check (auth.uid() = user_id);

create policy "loan_applications_update_own"
  on public.loan_applications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
