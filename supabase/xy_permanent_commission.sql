alter table public.xy_players
  add column if not exists commission_accumulated_salary numeric not null default 0,
  add column if not exists commission_80_unlocked boolean not null default false;

alter table public.xy_players
  drop constraint if exists xy_players_commission_accumulated_salary_nonnegative;
alter table public.xy_players
  add constraint xy_players_commission_accumulated_salary_nonnegative
  check (commission_accumulated_salary >= 0) not valid;
alter table public.xy_players
  validate constraint xy_players_commission_accumulated_salary_nonnegative;

create or replace function public.adjust_xy_player_accumulated_salary()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_old_amount numeric := 0;
  v_new_amount numeric := 0;
begin
  if tg_op in ('UPDATE', 'DELETE') and coalesce(old.is_deleted, false) = false then
    v_old_amount := coalesce(old.staff_salary, 0);
  end if;

  if tg_op in ('INSERT', 'UPDATE') and coalesce(new.is_deleted, false) = false then
    v_new_amount := coalesce(new.staff_salary, 0);
  end if;

  if tg_op in ('UPDATE', 'DELETE') and old.discord_id is not null then
    update public.xy_players
    set commission_accumulated_salary = greatest(
          0,
          commission_accumulated_salary - v_old_amount
        ),
        updated_at = now()
    where discord_id = old.discord_id;
  end if;

  if tg_op in ('INSERT', 'UPDATE') and new.discord_id is not null then
    update public.xy_players
    set commission_accumulated_salary = greatest(
          0,
          commission_accumulated_salary + v_new_amount
        ),
        commission_80_unlocked = commission_80_unlocked or
          greatest(0, commission_accumulated_salary + v_new_amount) >= 7000,
        updated_at = now()
    where discord_id = new.discord_id;
  end if;

  return coalesce(new, old);
end;
$function$;

drop trigger if exists xy_play_orders_accumulated_salary_trigger
  on public.xy_play_orders;
create trigger xy_play_orders_accumulated_salary_trigger
after insert or update of staff_salary, discord_id, is_deleted or delete
on public.xy_play_orders
for each row execute function public.adjust_xy_player_accumulated_salary();
