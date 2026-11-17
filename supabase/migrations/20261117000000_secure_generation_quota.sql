-- Enforce the daily AI generation quota in the database, not browser storage.
create table if not exists public.applyiq_generation_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  generation_count integer not null default 0 check (generation_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

alter table public.applyiq_generation_usage enable row level security;

-- No direct table access is granted to anon/authenticated. Access is through
-- the narrowly-scoped function below, which derives identity from auth.uid().
revoke all on table public.applyiq_generation_usage from anon, authenticated;

create or replace function public.consume_generation_quota()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  insert into public.applyiq_generation_usage (user_id, usage_date, generation_count)
  values (v_user_id, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, usage_date)
  do update
    set generation_count = public.applyiq_generation_usage.generation_count + 1,
        updated_at = now()
    where public.applyiq_generation_usage.generation_count < 5
  returning generation_count into v_count;

  return v_count is not null;
end;
$$;

revoke all on function public.consume_generation_quota() from public, anon;
grant execute on function public.consume_generation_quota() to authenticated;
