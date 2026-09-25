-- =========================================================
-- FIX_EXISTING_PROJECT.sql
-- Запусти этот файл в Supabase SQL Editor, если setup.sql уже запускался раньше.
-- Он исправляет секции балкона и заново создаёт функцию бронирования.
-- =========================================================

-- 1) Разрешаем отдельные секции балкона: "Балкон Л-1", "Балкон П-1" и т.д.
alter table public.reserved_seats
  drop constraint if exists reserved_seats_sector_check;

alter table public.reserved_seats
  add constraint reserved_seats_sector_check
  check (sector in ('Сцена', 'Зал', 'Пульт', 'Балкон') or sector like 'Балкон %');

-- 2) Обновляем атомарную функцию бронирования.
create or replace function public.create_booking(
  p_full_name text,
  p_phone text,
  p_email text,
  p_seats jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking_id uuid;
  v_seat jsonb;
  v_count integer;
  v_sector text;
  v_row integer;
  v_seat_num integer;
begin
  if p_full_name is null or char_length(trim(p_full_name)) < 2 then
    raise exception 'INVALID_FULL_NAME';
  end if;

  if p_phone is null or char_length(trim(p_phone)) < 5 then
    raise exception 'INVALID_PHONE';
  end if;

  if p_email is null or p_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'INVALID_EMAIL';
  end if;

  if p_seats is null or jsonb_typeof(p_seats) <> 'array' then
    raise exception 'INVALID_SEATS';
  end if;

  v_count := jsonb_array_length(p_seats);
  if v_count < 1 or v_count > 6 then
    raise exception 'SEAT_COUNT_MUST_BE_1_TO_6';
  end if;

  insert into public.bookings (full_name, phone, email)
  values (trim(p_full_name), trim(p_phone), lower(trim(p_email)))
  returning id into v_booking_id;

  for v_seat in select value from jsonb_array_elements(p_seats)
  loop
    v_sector := trim(v_seat->>'sector');
    v_row := (v_seat->>'row')::integer;
    v_seat_num := (v_seat->>'seat')::integer;

    if not (v_sector in ('Сцена', 'Зал', 'Пульт', 'Балкон') or v_sector like 'Балкон %') then
      raise exception 'INVALID_SECTOR';
    end if;

    insert into public.reserved_seats (booking_id, sector, row_num, seat_num)
    values (v_booking_id, v_sector, v_row, v_seat_num);
  end loop;

  return v_booking_id;
exception
  when unique_violation then
    raise exception 'SEAT_ALREADY_BOOKED' using errcode = '23505';
end;
$$;

revoke all on function public.create_booking(text, text, text, jsonb) from public;
grant execute on function public.create_booking(text, text, text, jsonb) to anon, authenticated;
