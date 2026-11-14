-- Run AFTER 001_rallyboard.sql in the dedicated RallyBoard project.
begin;
create or replace function public.rallyboard_sync_match(
 p_id text,p_payload jsonb,p_expected_revision bigint,p_events jsonb
) returns bigint language plpgsql security invoker set search_path=public as $$
declare existing public.rallyboard_matches; next_revision bigint; item jsonb;
begin
 if auth.uid() is null or not exists(select 1 from public.rallyboard_admins where user_id=auth.uid()) then
  raise exception 'RALLYBOARD_ADMIN_REQUIRED';
 end if;
 if p_payload->>'id' is distinct from p_id then raise exception 'Invalid payload ID'; end if;
 -- Serialize creation and revision checks for one match, including first upload.
 perform pg_advisory_xact_lock(hashtextextended(p_id,0));
 select * into existing from public.rallyboard_matches where id=p_id for update;
 if found then
  if existing.owner_id<>auth.uid() then raise exception 'Owner mismatch'; end if;
  if existing.payload=p_payload then return existing.revision; end if;
  if existing.revision<>p_expected_revision then raise exception 'RALLYBOARD_CONFLICT'; end if;
  next_revision:=existing.revision+1;
  update public.rallyboard_matches set payload=p_payload,revision=next_revision,updated_at=now() where id=p_id;
 else
  if p_expected_revision<>0 then raise exception 'RALLYBOARD_CONFLICT'; end if;
  next_revision:=1;
  insert into public.rallyboard_matches(id,owner_id,payload,revision) values(p_id,auth.uid(),p_payload,next_revision);
 end if;
 for item in select * from jsonb_array_elements(p_events) loop
  insert into public.rallyboard_events(id,owner_id,match_id,set_index,payload,voided)
  values((item->>'id')::uuid,auth.uid(),p_id,(item->>'set_index')::integer,item->'payload',(item->>'voided')::boolean)
  on conflict(id) do update set voided=public.rallyboard_events.voided or excluded.voided,
   payload=excluded.payload
   where public.rallyboard_events.owner_id=auth.uid() and public.rallyboard_events.match_id=p_id;
 end loop;
 return next_revision;
end;
$$;
revoke all on function public.rallyboard_sync_match(text,jsonb,bigint,jsonb) from public,anon;
grant execute on function public.rallyboard_sync_match(text,jsonb,bigint,jsonb) to authenticated;
commit;
