-- Выполнить ОДИН РАЗ в Supabase SQL Editor. Не удаляет старые брони.
create extension if not exists pgcrypto;
create table if not exists public.invitations (
 id uuid primary key default gen_random_uuid(),
 booking_id uuid not null unique references public.bookings(id) on delete cascade,
 token_hash text not null unique,
 status text not null default 'pending' check (status in ('pending','accepted','declined')),
 created_at timestamptz not null default now(), responded_at timestamptz
);
alter table public.invitations enable row level security;
revoke all on public.invitations from anon, authenticated;
create or replace function public.invite_is_admin() returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.admin_users where user_id = auth.uid())
$$;
revoke all on function public.invite_is_admin() from public;
grant execute on function public.invite_is_admin() to authenticated;
grant select on public.invitations to authenticated;
drop policy if exists invitations_admin_select on public.invitations;
create policy invitations_admin_select on public.invitations for select to authenticated using (public.invite_is_admin());

create or replace function public.create_invitation(p_name text,p_seats jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_token text; v_item jsonb; v_sector text; v_row int; v_seat int;
begin
 if not public.invite_is_admin() then raise exception 'NOT_ADMIN'; end if;
 if length(trim(coalesce(p_name,''))) < 2 or length(p_name)>150 then raise exception 'INVALID_NAME'; end if;
 if jsonb_typeof(p_seats) is distinct from 'array' or jsonb_array_length(p_seats) not between 1 and 6 then raise exception 'INVALID_SEATS'; end if;
 insert into public.bookings(full_name,phone,email) values(trim(p_name),'—','invitation@internal.invalid') returning id into v_id;
 for v_item in select value from jsonb_array_elements(p_seats) loop
  v_sector := v_item->>'sector'; v_row := (v_item->>'row')::int; v_seat := (v_item->>'seat')::int;
  if v_sector not in ('ПАРТЕР','АМФИТЕАТР','АМФИТЕАТР-БОКОВЫЕ','БЕЛЬЭТАЖ','Балкон','Зал','Сцена') or v_row not between -20 and 50 or v_seat not between 1 and 100 then raise exception 'INVALID_SEAT'; end if;
  insert into public.reserved_seats(booking_id,sector,row_num,seat_num,status) values(v_id,v_sector,v_row,v_seat,'booked');
 end loop;
 v_token := encode(gen_random_bytes(32),'hex');
 insert into public.invitations(booking_id,token_hash) values(v_id,encode(digest(v_token,'sha256'),'hex'));
 return jsonb_build_object('token',v_token,'id',v_id);
exception when unique_violation then raise exception 'SEAT_ALREADY_BOOKED';
end $$;

create or replace function public.invitation_details(p_token text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v public.invitations%rowtype; v_name text; v_seats jsonb;
begin
 if length(coalesce(p_token,''))<>64 or p_token !~ '^[0-9a-f]{64}$' then return null; end if;
 select * into v from public.invitations where token_hash=encode(digest(p_token,'sha256'),'hex');
 if not found then return null; end if;
 select full_name into v_name from public.bookings where id=v.booking_id;
 select coalesce(jsonb_agg(jsonb_build_object('sector',sector,'row',row_num,'seat',seat_num) order by sector,row_num,seat_num),'[]'::jsonb) into v_seats from public.reserved_seats where booking_id=v.booking_id;
 return jsonb_build_object('name',v_name,'status',v.status,'seats',v_seats);
end $$;

create or replace function public.respond_invitation(p_token text,p_accept boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v public.invitations%rowtype;
begin
 if length(coalesce(p_token,''))<>64 or p_token !~ '^[0-9a-f]{64}$' then raise exception 'INVALID_TOKEN'; end if;
 select * into v from public.invitations where token_hash=encode(digest(p_token,'sha256'),'hex') for update;
 if not found then raise exception 'INVALID_TOKEN'; end if;
 if v.status <> 'pending' then raise exception 'ALREADY_RESPONDED'; end if;
 update public.invitations set status=case when p_accept then 'accepted' else 'declined' end,responded_at=now() where id=v.id;
 if not p_accept then delete from public.reserved_seats where booking_id=v.booking_id; end if;
 return jsonb_build_object('status',case when p_accept then 'accepted' else 'declined' end);
end $$;
revoke all on function public.create_invitation(text,jsonb),public.invitation_details(text),public.respond_invitation(text,boolean) from public;
grant execute on function public.create_invitation(text,jsonb) to authenticated;
grant execute on function public.invitation_details(text),public.respond_invitation(text,boolean) to anon,authenticated;
