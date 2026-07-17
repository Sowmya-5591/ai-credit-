-- ============================================================
-- AI Credit+ : Core schema
-- Run via `supabase db push` or the SQL editor in the dashboard
-- ============================================================

create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- users (mirrors auth.users, holds app-level profile fields)
-- ------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique not null,
  phone_number text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- financial_profile
-- ------------------------------------------------------------
create table if not exists public.financial_profile (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  occupation text,
  employment_type text check (employment_type in ('salaried','self_employed','gig_worker','farmer','msme_owner','unemployed')),
  monthly_income numeric(14,2) default 0,
  monthly_expenses numeric(14,2) default 0,
  savings numeric(14,2) default 0,
  existing_loans numeric(14,2) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- ------------------------------------------------------------
-- transactions
-- ------------------------------------------------------------
create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  transaction_type text not null check (transaction_type in ('income','expense')),
  category text not null,
  amount numeric(14,2) not null check (amount >= 0),
  transaction_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists idx_transactions_user_date
  on public.transactions (user_id, transaction_date desc);

-- ------------------------------------------------------------
-- credit_assessments
-- ------------------------------------------------------------
create table if not exists public.credit_assessments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  alternative_credit_score int not null check (alternative_credit_score between 300 and 900),
  risk_level text not null check (risk_level in ('low','medium','high')),
  loan_eligibility boolean not null default false,
  ai_summary text,
  positive_factors jsonb default '[]'::jsonb,
  negative_factors jsonb default '[]'::jsonb,
  suggestions jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_credit_assessments_user
  on public.credit_assessments (user_id, created_at desc);

-- ------------------------------------------------------------
-- loan_applications
-- ------------------------------------------------------------
create table if not exists public.loan_applications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  requested_amount numeric(14,2) not null check (requested_amount > 0),
  recommended_amount numeric(14,2),
  interest_rate numeric(5,2),
  tenure_months int,
  status text not null default 'pending' check (status in ('pending','approved','rejected','disbursed')),
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_loan_applications_user
  on public.loan_applications (user_id, created_at desc);

-- ------------------------------------------------------------
-- keep public.users in sync with auth.users on signup
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, full_name, email, phone_number)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    new.raw_user_meta_data->>'phone_number'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- keep financial_profile.updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_financial_profile_updated on public.financial_profile;
create trigger trg_financial_profile_updated
  before update on public.financial_profile
  for each row execute function public.set_updated_at();
