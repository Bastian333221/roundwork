-- Run once in the selected Supabase project. Contains no personal workout data.
begin;
create table if not exists public.roundwork_workout_history (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 1 check (revision > 0),
  document jsonb not null check (
    jsonb_typeof(document) = 'object' and (document ->> 'schema' = '1') is true
    and (jsonb_typeof(document -> 'records') = 'object') is true
    and octet_length(document::text) <= 8000000
  ),
  updated_at timestamptz not null default now()
);
alter table public.roundwork_workout_history enable row level security;
revoke all on public.roundwork_workout_history from anon, authenticated;
grant select on public.roundwork_workout_history to authenticated;
drop policy if exists roundwork_owner_read on public.roundwork_workout_history;
create policy roundwork_owner_read on public.roundwork_workout_history for select to authenticated
  using ((select auth.uid()) = owner_id);

-- Narrow writer: clients cannot pick another owner, skip revisions, remove history keys,
-- or replace a document based on an obsolete read. Writes are serialized per owner.
create schema if not exists roundwork_private;
revoke all on schema roundwork_private from public, anon;
grant usage on schema roundwork_private to authenticated;

create or replace function roundwork_private.roundwork_save_history(expected_revision bigint, next_document jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  previous public.roundwork_workout_history%rowtype;
  next_revision bigint;
begin
  if actor is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if expected_revision is null or expected_revision < 0 or next_document is null
    or jsonb_typeof(next_document) <> 'object' or next_document ->> 'schema' is distinct from '1'
    or jsonb_typeof(next_document -> 'records') is distinct from 'object'
    or octet_length(next_document::text) > 8000000 then
    raise exception 'Invalid workout document' using errcode = '22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text, 742018));
  select * into previous from public.roundwork_workout_history where owner_id = actor for update;
  if not found then
    if expected_revision <> 0 then return jsonb_build_object('saved', false); end if;
    insert into public.roundwork_workout_history(owner_id, revision, document)
      values (actor, 1, next_document);
    next_revision := 1;
  else
    if previous.revision <> expected_revision then return jsonb_build_object('saved', false); end if;
    if exists(select 1 from jsonb_object_keys(previous.document -> 'records') as keys(id)
      where not (next_document -> 'records') ? keys.id) then
      raise exception 'History entries must be retained, including deleted entries' using errcode = '22023';
    end if;
    next_revision := previous.revision + 1;
    update public.roundwork_workout_history set document = next_document, revision = next_revision, updated_at = now()
      where owner_id = actor;
  end if;
  return jsonb_build_object('saved', true, 'revision', next_revision);
end;
$$;
revoke all on function roundwork_private.roundwork_save_history(bigint,jsonb) from public, anon;
grant execute on function roundwork_private.roundwork_save_history(bigint,jsonb) to authenticated;

create or replace function public.roundwork_save_history(expected_revision bigint, next_document jsonb)
returns jsonb language sql security invoker set search_path = '' as $$
  select roundwork_private.roundwork_save_history(expected_revision, next_document);
$$;
revoke all on function public.roundwork_save_history(bigint,jsonb) from public, anon;
grant execute on function public.roundwork_save_history(bigint,jsonb) to authenticated;
comment on table public.roundwork_workout_history is 'ROUNDWORK account-scoped workout logs. Deleted sessions are retained for recovery.';
commit;
