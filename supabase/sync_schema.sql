-- user_integrations: one integration per user (Trello OR Google Calendar)
create table user_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  provider text not null check (provider in ('trello', 'google_calendar')),
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  trello_board_id text,
  trello_board_name text,
  trello_list_id text,
  trello_list_name text,
  event_type text default 'timed' check (event_type in ('all_day', 'timed')),
  is_active boolean not null default true,
  last_sync_error text,
  created_at timestamptz not null default now()
);

-- task_sync_items: tracks external cards/events created for each task per user
create table task_sync_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  provider text not null,
  external_id text not null,
  status text not null default 'active' check (status in ('active', 'completed')),
  created_at timestamptz not null default now()
);

-- RLS
alter table user_integrations enable row level security;

create policy "Users can manage their own integrations"
  on user_integrations for all
  using (auth.uid() = user_id);

alter table task_sync_items enable row level security;

create policy "Users can manage their own sync items"
  on task_sync_items for all
  using (auth.uid() = user_id);
