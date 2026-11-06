create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create table if not exists private.dashboard_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

revoke all on private.dashboard_admins from public, anon, authenticated;

create or replace function public.is_project_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.dashboard_admins as admins
    where admins.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_project_admin() from public, anon;
grant execute on function public.is_project_admin() to authenticated;

create table if not exists public.dashboard_indicators (
  id text primary key check (id in (
    'directParticipants',
    'indirectReach',
    'wasteReduction',
    'recipes',
    'composters',
    'multipliers',
    'donationFamilies'
  )),
  value numeric not null check (value >= 0),
  target numeric check (target is null or target >= 0),
  source text not null,
  is_published boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create table if not exists public.project_measurements (
  id uuid primary key default gen_random_uuid(),
  indicator_id text not null references public.dashboard_indicators (id) on delete cascade,
  value numeric not null check (value >= 0),
  target numeric check (target is null or target >= 0),
  measured_on date not null,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

alter table public.dashboard_indicators enable row level security;
alter table public.project_measurements enable row level security;

revoke all on public.dashboard_indicators, public.project_measurements from public;
revoke select on public.dashboard_indicators, public.project_measurements from anon, authenticated;
grant select (id, value, target, source, is_published, updated_at)
  on public.dashboard_indicators to anon, authenticated;
grant select (id, indicator_id, value, target, measured_on, is_published)
  on public.project_measurements to anon, authenticated;
grant insert, update, delete on public.dashboard_indicators, public.project_measurements to authenticated;

drop policy if exists "Public can read published indicators" on public.dashboard_indicators;
create policy "Public can read published indicators"
  on public.dashboard_indicators for select
  to anon, authenticated
  using (is_published or (select public.is_project_admin()));

drop policy if exists "Project admins manage indicators" on public.dashboard_indicators;
create policy "Project admins manage indicators"
  on public.dashboard_indicators for all
  to authenticated
  using ((select public.is_project_admin()))
  with check ((select public.is_project_admin()));

drop policy if exists "Public can read published measurements" on public.project_measurements;
create policy "Public can read published measurements"
  on public.project_measurements for select
  to anon, authenticated
  using (is_published or (select public.is_project_admin()));

drop policy if exists "Project admins manage measurements" on public.project_measurements;
create policy "Project admins manage measurements"
  on public.project_measurements for all
  to authenticated
  using ((select public.is_project_admin()))
  with check ((select public.is_project_admin()));

create or replace function public.admin_add_project_measurement(
  p_indicator_id text,
  p_value numeric,
  p_target numeric,
  p_measured_on date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_measurement_id uuid;
begin
  if not (select public.is_project_admin()) then
    raise exception 'Administrator access is required.';
  end if;

  if p_value is null or p_value < 0 or (p_target is not null and p_target < 0) then
    raise exception 'Measurement values must be non-negative.';
  end if;

  insert into public.project_measurements (
    indicator_id,
    value,
    target,
    measured_on,
    created_by
  )
  values (
    p_indicator_id,
    p_value,
    p_target,
    p_measured_on,
    (select auth.uid())
  )
  returning id into new_measurement_id;

  update public.dashboard_indicators
  set
    value = p_value,
    target = coalesce(p_target, target),
    updated_at = now(),
    updated_by = (select auth.uid())
  where id = p_indicator_id;

  if not found then
    raise exception 'Unknown dashboard indicator: %', p_indicator_id;
  end if;

  return new_measurement_id;
end;
$$;

revoke all on function public.admin_add_project_measurement(text, numeric, numeric, date) from public, anon;
grant execute on function public.admin_add_project_measurement(text, numeric, numeric, date) to authenticated;

create or replace function public.admin_update_indicator_targets(p_targets jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_entry record;
  target_value numeric;
begin
  if not (select public.is_project_admin()) then
    raise exception 'Administrator access is required.';
  end if;

  if jsonb_typeof(p_targets) <> 'object' then
    raise exception 'Targets must be a JSON object.';
  end if;

  for target_entry in select key, value from jsonb_each(p_targets)
  loop
    if target_entry.key not in (
      'directParticipants',
      'indirectReach',
      'wasteReduction',
      'recipes',
      'composters',
      'multipliers',
      'donationFamilies'
    ) then
      raise exception 'Unknown dashboard indicator: %', target_entry.key;
    end if;

    if jsonb_typeof(target_entry.value) = 'null' then
      target_value := null;
    elsif jsonb_typeof(target_entry.value) = 'number' then
      target_value := (target_entry.value #>> '{}')::numeric;
      if target_value < 0 then
        raise exception 'Targets must be non-negative.';
      end if;
    else
      raise exception 'Targets must be numbers or null.';
    end if;

    update public.dashboard_indicators
    set target = target_value, updated_at = now(), updated_by = (select auth.uid())
    where id = target_entry.key;
  end loop;
end;
$$;

revoke all on function public.admin_update_indicator_targets(jsonb) from public, anon;
grant execute on function public.admin_update_indicator_targets(jsonb) to authenticated;

insert into public.dashboard_indicators (id, value, source)
values
  ('directParticipants', 30, 'Contagem informada para participantes das oficinas.'),
  ('indirectReach', 180, 'Estimativa de alcance por materiais, multiplicadores e eventos comunitários.'),
  ('wasteReduction', 70, 'Autoavaliação relatada pelas famílias participantes; não corresponde à pesagem de resíduos.'),
  ('recipes', 12, 'Manual prático informado no relato do projeto; não indica data de medição.'),
  ('composters', 4, 'Três estruturas domésticas e uma composteira comunitária.'),
  ('multipliers', 6, 'Voluntários capacitados para replicar as oficinas.'),
  ('donationFamilies', 2, 'Famílias atendidas pelo fluxo de excedentes.')
on conflict (id) do nothing;
