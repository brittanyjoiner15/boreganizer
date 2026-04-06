-- Tasks table
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  category text,
  recurrence_type text not null check (recurrence_type in ('time', 'mileage')),
  recurrence_value integer not null check (recurrence_value > 0),
  recurrence_unit text not null check (recurrence_unit in ('days', 'weeks', 'months', 'years', 'miles')),
  next_due_date date,
  next_due_mileage integer,
  last_logged_mileage integer,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- Task logs table
create table if not exists task_logs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  completed_at timestamptz not null default now(),
  notes text,
  mileage_at_completion integer,
  created_at timestamptz not null default now()
);

-- Row level security
alter table tasks enable row level security;
alter table task_logs enable row level security;

create policy "users can manage their own tasks"
  on tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can manage their own task logs"
  on task_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Indexes for common queries
create index if not exists tasks_user_id_idx on tasks(user_id);
create index if not exists tasks_next_due_date_idx on tasks(next_due_date);
create index if not exists task_logs_task_id_idx on task_logs(task_id);
create index if not exists task_logs_completed_at_idx on task_logs(completed_at desc);
