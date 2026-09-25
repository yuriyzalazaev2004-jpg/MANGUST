-- =========================================================
-- ADMIN ACCESS for concert-site
-- Run AFTER setup.sql
-- =========================================================

-- List of Supabase Auth users allowed to see private bookings.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

revoke all on table public.admin_users from anon, authenticated;
grant select on table public.admin_users to authenticated;

-- An authenticated user may only see their own admin-membership row.
drop policy if exists "Admin can read own membership" on public.admin_users;
create policy "Admin can read own membership"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());

-- Private bookings: only users listed in admin_users may read them.
grant select on table public.bookings to authenticated;

drop policy if exists "Admins can read bookings" on public.bookings;
create policy "Admins can read bookings"
on public.bookings
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users a
    where a.user_id = auth.uid()
  )
);

-- Optional: allow admins to inspect donation click-intents as well.
grant select on table public.donation_intents to authenticated;

drop policy if exists "Admins can read donation intents" on public.donation_intents;
create policy "Admins can read donation intents"
on public.donation_intents
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users a
    where a.user_id = auth.uid()
  )
);

-- =========================================================
-- ASSIGN THE ORGANIZER AS ADMIN
-- IMPORTANT: first create this user in Authentication > Users.
-- Then run this file (or rerun it): the INSERT below is idempotent.
-- =========================================================
insert into public.admin_users (user_id)
select id
from auth.users
where lower(email) = lower('urazal128@mail.ru')
on conflict (user_id) do nothing;
