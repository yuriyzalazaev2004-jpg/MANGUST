-- Run after setup.sql. These are read-only checks.

-- 1) Tables
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('bookings', 'reserved_seats', 'donation_intents')
order by table_name;

-- 2) RLS enabled?
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where relname in ('bookings', 'reserved_seats', 'donation_intents')
order by relname;

-- 3) Policies
select schemaname, tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('bookings', 'reserved_seats', 'donation_intents')
order by tablename, policyname;

-- 4) Realtime publication
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and tablename = 'reserved_seats';

-- 5) Functions
select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name in ('create_booking', 'log_donation_intent')
order by routine_name;
