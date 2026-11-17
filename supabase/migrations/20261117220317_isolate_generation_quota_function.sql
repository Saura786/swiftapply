create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

alter function public.consume_generation_quota() set schema private;
revoke all on function private.consume_generation_quota() from public, anon;
grant execute on function private.consume_generation_quota() to authenticated;

create or replace function public.consume_generation_quota()
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select private.consume_generation_quota();
$$;

revoke all on function public.consume_generation_quota() from public, anon;
grant execute on function public.consume_generation_quota() to authenticated;
