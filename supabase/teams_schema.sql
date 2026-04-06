-- Teams (households)
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references auth.users(id) not null,
  created_at timestamptz not null default now()
);

-- Team members
create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  email text not null,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique(team_id, user_id)
);

-- Team invites (shareable link tokens)
create table if not exists team_invites (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade not null,
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  created_by uuid references auth.users(id) not null,
  accepted_by uuid references auth.users(id),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

-- Add team fields to tasks
alter table tasks add column if not exists team_id uuid references teams(id) on delete set null;
alter table tasks add column if not exists assigned_to uuid references auth.users(id) on delete set null;

-- RLS
alter table teams enable row level security;
alter table team_members enable row level security;
alter table team_invites enable row level security;

-- Teams: visible to members
create policy "team members can view their team"
  on teams for select
  using (
    id in (select team_id from team_members where user_id = auth.uid())
  );

create policy "authenticated users can create teams"
  on teams for insert
  with check (auth.uid() = created_by);

-- Team members: visible to members of the same team
create policy "team members can view their teammates"
  on team_members for select
  using (
    team_id in (select team_id from team_members where user_id = auth.uid())
  );

create policy "team owners can manage members"
  on team_members for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- Team invites: members can create; anyone can read (token is the secret)
create policy "anyone can read team invites"
  on team_invites for select
  using (true);

create policy "team members can create invites"
  on team_invites for insert
  with check (
    team_id in (select team_id from team_members where user_id = auth.uid())
  );

create policy "team members can update invites"
  on team_invites for update
  using (auth.uid() is not null);

-- Update tasks RLS to include team tasks
drop policy if exists "users can manage their own tasks" on tasks;

create policy "users can view tasks"
  on tasks for select
  using (
    auth.uid() = user_id
    or (
      team_id is not null
      and exists (
        select 1 from team_members
        where team_members.team_id = tasks.team_id
        and team_members.user_id = auth.uid()
      )
    )
  );

create policy "users can insert tasks"
  on tasks for insert
  with check (auth.uid() = user_id);

create policy "users can update accessible tasks"
  on tasks for update
  using (
    auth.uid() = user_id
    or (
      team_id is not null
      and exists (
        select 1 from team_members
        where team_members.team_id = tasks.team_id
        and team_members.user_id = auth.uid()
      )
    )
  );

create policy "users can delete own tasks"
  on tasks for delete
  using (auth.uid() = user_id);

-- Update task_logs RLS similarly
drop policy if exists "users can manage their own task logs" on task_logs;

create policy "users can view task logs"
  on task_logs for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from tasks
      join team_members on team_members.team_id = tasks.team_id
      where tasks.id = task_logs.task_id
      and team_members.user_id = auth.uid()
    )
  );

create policy "users can insert task logs"
  on task_logs for insert
  with check (auth.uid() = user_id);
