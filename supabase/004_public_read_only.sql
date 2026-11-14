-- RallyBoard: explicit public read-only projection for people opening a shared link.
-- Private tables, account IDs, admin membership, tokens and deleted matches stay private.
-- Existing admin-only write policies and sync RPC remain unchanged.
begin;
create schema if not exists rallyboard_private;
revoke all on schema rallyboard_private from public, anon, authenticated;

create or replace function rallyboard_private.pick_fields(value jsonb, allowed text[])
returns jsonb language sql immutable set search_path = '' as $$
  select coalesce(jsonb_object_agg(key, val), '{}'::jsonb)
  from jsonb_each(case when jsonb_typeof(value)='object' then value else '{}'::jsonb end) fields(key,val)
  where key = any(allowed);
$$;
revoke all on function rallyboard_private.pick_fields(jsonb,text[]) from public,anon,authenticated;

create or replace function public.rallyboard_public_board()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  record_row record;
  item jsonb;
  event_item jsonb;
  sub_item jsonb;
  public_match jsonb;
  public_sets jsonb;
  public_events jsonb;
  public_subs jsonb;
  public_matches jsonb := '[]'::jsonb;
  public_players jsonb := '[]'::jsonb;
  public_weights jsonb := '{}'::jsonb;
  latest_update timestamptz;
begin
  for record_row in
    select m.id, m.payload, m.updated_at
    from public.rallyboard_matches m
    where exists (
      select 1 from public.rallyboard_admins a where a.user_id=m.owner_id
    )
    order by m.updated_at desc, m.id
  loop
    if latest_update is null then latest_update := record_row.updated_at; end if;
    if record_row.id='__rallyboard_settings__' then
      public_players := coalesce(record_row.payload->'players','[]'::jsonb);
      public_weights := rallyboard_private.pick_fields(record_row.payload->'weights',array[
        'Kill','Ass','Blockpunkt','Gute Annahme','Gute Abwehr','Gute Sicherung',
        'Angriffsfehler','Aufschlagfehler','Annahmefehler','Abwehrfehler',
        'Sicherungsfehler','Annahme/Abwehr-Fehler','Angabefehler'
      ]);
      continue;
    end if;
    if record_row.payload->>'deletedAt' is not null
       or record_row.payload->>'linkedTo' is not null then continue; end if;

    public_sets := '[]'::jsonb;
    for item in select * from jsonb_array_elements(coalesce(record_row.payload->'sets','[]'::jsonb)) loop
      public_events := '[]'::jsonb;
      for event_item in select * from jsonb_array_elements(coalesce(item->'events','[]'::jsonb)) loop
        if coalesce(event_item->>'void','false')<>'true'
           and event_item->>'kind' in ('action','pos','sub') then
          public_events := public_events || jsonb_build_array(
            rallyboard_private.pick_fields(event_item,array['kind','player','category','position','slot','out','in'])
          );
        end if;
      end loop;
      public_subs := '[]'::jsonb;
      for sub_item in select * from jsonb_array_elements(coalesce(item->'subs','[]'::jsonb)) loop
        public_subs := public_subs || jsonb_build_array(
          case when jsonb_typeof(sub_item)='string' then sub_item
               else rallyboard_private.pick_fields(sub_item,array['out','in']) end
        );
      end loop;
      public_sets := public_sets || jsonb_build_array(
        rallyboard_private.pick_fields(item,array['active','score','pos','actions','teamErrors','coverage'])
        || jsonb_build_object('events',public_events,'subs',public_subs)
      );
    end loop;

    public_match := rallyboard_private.pick_fields(record_row.payload,
      array['opponent','date','done','historical','planned','fixtureKey']);
    public_match := public_match || jsonb_build_object('id',record_row.id,'sets',public_sets);
    if jsonb_typeof(record_row.payload->'official')='object' then
      public_match := public_match || jsonb_build_object('official',
        rallyboard_private.pick_fields(record_row.payload->'official',array[
          'key','number','matchId','date','time','timeMayBeDelayed','season','league',
          'team1','team2','opponent','host','isHost','venue','address','referee','source','checkedAt'
        ]) || jsonb_build_object('result',
          case when jsonb_typeof(record_row.payload->'official'->'result')='object'
          then rallyboard_private.pick_fields(record_row.payload->'official'->'result',array['own','opponent','setScores'])
          else 'null'::jsonb end
        )
      );
    end if;
    public_matches := public_matches || jsonb_build_array(public_match);
  end loop;
  return jsonb_build_object('players',public_players,'weights',public_weights,
    'matches',public_matches,'updatedAt',latest_update);
end;
$$;
revoke all on function public.rallyboard_public_board() from public,anon,authenticated;
grant execute on function public.rallyboard_public_board() to anon,authenticated;
commit;
