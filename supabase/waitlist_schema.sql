-- Waitlist table
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text,
  ip text,
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;

-- Allow anyone to insert (for landing forms). No select/update/delete by default.
drop policy if exists "waitlist_insert_public" on public.waitlist;

create policy "waitlist_insert_public"
on public.waitlist for insert
to public
with check (true);


