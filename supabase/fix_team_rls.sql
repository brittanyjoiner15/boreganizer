-- Helper function that bypasses RLS to get the current user's team_id
-- security definer = runs as the function owner (postgres), not the calling user
create or replace function get_my_team_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select team_id from team_members where user_id = auth.uid() limit 1
$$;

-- Drop the recursive policy and replace with one that uses the helper
drop policy if exists "team members can view their teammates" on team_members;

create policy "team members can view their teammates"
  on team_members for select
  using (team_id = get_my_team_id());

-- Also fix the tasks and task_logs policies to use the helper
drop policy if exists "users can view tasks" on tasks;
drop policy if exists "users can update accessible tasks" on tasks;
drop policy if exists "users can view task logs" on task_logs;

create policy "users can view tasks"
  on tasks for select
  using (
    auth.uid() = user_id
    or (team_id is not null and team_id = get_my_team_id())
  );

create policy "users can update accessible tasks"
  on tasks for update
  using (
    auth.uid() = user_id
    or (team_id is not null and team_id = get_my_team_id())
  );

create policy "users can view task logs"
  on task_logs for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from tasks
      where tasks.id = task_logs.task_id
      and tasks.team_id = get_my_team_id()
    )
  );
