-- Allow team creator to see their team even before being added to team_members
drop policy if exists "team members can view their team" on teams;

create policy "team members can view their team"
  on teams for select
  using (
    created_by = auth.uid()
    or id = get_my_team_id()
  );
