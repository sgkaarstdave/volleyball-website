-- Allow removing an unused Auth user without first deleting its admin grant.
-- Match/event ownership constraints remain restrictive to preserve game data.
begin;
alter table public.rallyboard_admins
  drop constraint rallyboard_admins_user_id_fkey;
alter table public.rallyboard_admins
  add constraint rallyboard_admins_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;
commit;
