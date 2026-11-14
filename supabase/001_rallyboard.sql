-- Run only in a NEW RallyBoard Supabase project. Never in MiSai Hub.
-- No frontend cloud writes are enabled until admin provisioning is complete.
begin;
create table public.rallyboard_admins (user_id uuid primary key references auth.users(id));
alter table public.rallyboard_admins enable row level security;
create policy own_admin on public.rallyboard_admins for select to authenticated using(user_id=auth.uid());
create table public.rallyboard_matches (
 id text primary key, owner_id uuid not null references auth.users(id),
 payload jsonb not null, revision bigint not null default 0,
 updated_at timestamptz not null default now(),
 unique(id,owner_id)
);
create table public.rallyboard_events (
 id uuid primary key, owner_id uuid not null references auth.users(id),
 match_id text not null, set_index integer not null check(set_index>=0),
 payload jsonb not null, voided boolean not null default false,
 created_at timestamptz not null default now(),
 foreign key(match_id,owner_id) references public.rallyboard_matches(id,owner_id)
);
alter table public.rallyboard_matches enable row level security;
alter table public.rallyboard_events enable row level security;
create policy admin_matches on public.rallyboard_matches for all to authenticated
 using(owner_id=auth.uid() and exists(select 1 from public.rallyboard_admins where user_id=auth.uid()))
 with check(owner_id=auth.uid() and exists(select 1 from public.rallyboard_admins where user_id=auth.uid()));
create policy admin_events on public.rallyboard_events for all to authenticated
 using(owner_id=auth.uid() and exists(select 1 from public.rallyboard_admins where user_id=auth.uid()))
 with check(owner_id=auth.uid() and exists(select 1 from public.rallyboard_admins where user_id=auth.uid()));
revoke all on public.rallyboard_admins from anon,authenticated;
grant select on public.rallyboard_admins to authenticated;
revoke all on public.rallyboard_matches,public.rallyboard_events from anon;
grant select,insert,update,delete on public.rallyboard_matches,public.rallyboard_events to authenticated;
commit;
-- Provision ONE admin in SQL using their actual auth.users UUID:
-- insert into public.rallyboard_admins(user_id) values ('ADMIN-UUID');
-- Future sync: upsert by stable event UUID, persist voided tombstones, use
-- revision compare-and-swap for match metadata; never last-write-wins snapshots.
