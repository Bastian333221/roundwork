-- Synthetic identities and data exist only inside this rolled-back transaction.
begin;
select set_config('roundwork.test_a', gen_random_uuid()::text, true);
select set_config('roundwork.test_b', gen_random_uuid()::text, true);
insert into auth.users(id,aud,role,email,created_at,updated_at)
select current_setting('roundwork.test_a')::uuid,'authenticated','authenticated',
  'roundwork-test-'||current_setting('roundwork.test_a')||'@example.invalid',now(),now()
union all
select current_setting('roundwork.test_b')::uuid,'authenticated','authenticated',
  'roundwork-test-'||current_setting('roundwork.test_b')||'@example.invalid',now(),now();

set local role anon;
do $$ begin
  begin perform 1 from public.roundwork_workout_history; raise exception 'Anon unexpectedly read private logs';
    exception when insufficient_privilege then null; end;
  begin perform public.roundwork_save_history(0,'{"schema":1,"records":{}}'); raise exception 'Anon unexpectedly wrote logs';
    exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claims','{}',true);
do $$ begin
  begin perform public.roundwork_save_history(0,'{"schema":1,"records":{}}'); raise exception 'Missing identity unexpectedly wrote logs';
    exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('roundwork.test_a'),'role','authenticated')::text,true);
do $$ declare result jsonb; begin
  result:=public.roundwork_save_history(0,'{"schema":1,"records":{"session-test":{"measurement":40}}}');
  if result->>'saved'<>'true' or (result->>'revision')::int<>1 then raise exception 'Initial save failed'; end if;
  if (select count(*) from public.roundwork_workout_history)<>1 then raise exception 'Owner read failed'; end if;
  result:=public.roundwork_save_history(0,'{"schema":1,"records":{"session-test":{"measurement":99}}}');
  if result->>'saved'<>'false' then raise exception 'Stale save unexpectedly succeeded'; end if;
  if (select document #>> '{records,session-test,measurement}' from public.roundwork_workout_history)<>'40' then raise exception 'Stale save replaced data'; end if;
  begin perform public.roundwork_save_history(1,'{"schema":1,"records":{}}'); raise exception 'Removal unexpectedly erased a history key';
    exception when invalid_parameter_value then null; end;
  begin perform public.roundwork_save_history(1,'{"schema":1}'); raise exception 'Missing record map accepted';
    exception when invalid_parameter_value then null; end;
  begin perform public.roundwork_save_history(-1,'{"schema":1,"records":{}}'); raise exception 'Negative revision accepted';
    exception when invalid_parameter_value then null; end;
  begin update public.roundwork_workout_history set revision=99; raise exception 'Direct update unexpectedly succeeded';
    exception when insufficient_privilege then null; end;
  begin delete from public.roundwork_workout_history; raise exception 'Direct delete unexpectedly succeeded';
    exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('roundwork.test_b'),'role','authenticated')::text,true);
do $$ declare result jsonb; begin
  if (select count(*) from public.roundwork_workout_history)<>0 then raise exception 'Another account could read owner logs'; end if;
  result:=public.roundwork_save_history(0,'{"schema":1,"records":{"session-second":{"measurement":25}}}');
  if result->>'saved'<>'true' then raise exception 'Second owner save failed'; end if;
  if (select count(*) from public.roundwork_workout_history)<>1 then raise exception 'Second owner isolation failed'; end if;
  if exists(select 1 from public.roundwork_workout_history where owner_id=current_setting('roundwork.test_a')::uuid) then raise exception 'First owner was exposed'; end if;
  begin insert into public.roundwork_workout_history(owner_id,document) values(current_setting('roundwork.test_a')::uuid,'{"schema":1,"records":{}}'); raise exception 'Cross-owner insert unexpectedly succeeded';
    exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('roundwork.test_a'),'role','authenticated')::text,true);
do $$ begin
  if (select count(*) from public.roundwork_workout_history)<>1 then raise exception 'Owner visibility changed after second account write'; end if;
  if (select document #>> '{records,session-test,measurement}' from public.roundwork_workout_history)<>'40' then raise exception 'Second account altered first owner data'; end if;
end $$;
reset role;
rollback;
select 'Passed: anonymous denial, owner isolation, stale-save rejection, required authentication, retained history keys, payload checks, direct-write denial and transaction rollback' as result;
