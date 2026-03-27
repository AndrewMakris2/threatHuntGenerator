-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Companies table
create table if not exists public.companies (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Saved hunts table
create table if not exists public.saved_hunts (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  hunt jsonb not null,
  saved_at timestamptz default now()
);

-- User settings table
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ai_provider text,
  ai_model text,
  ai_endpoint text,
  updated_at timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.saved_hunts enable row level security;
alter table public.user_settings enable row level security;

-- RLS Policies
create policy "users_own_profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "users_own_companies" on public.companies
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_own_saved_hunts" on public.saved_hunts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_own_settings" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
