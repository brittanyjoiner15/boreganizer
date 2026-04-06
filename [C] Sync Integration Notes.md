# Trello + Google Calendar Sync — Feature Notes

## What it does
- Per-user integration (one provider per user: Trello OR Google Calendar)
- When sync is enabled, tasks assigned to you (or unassigned household tasks) get a Trello card or Google Calendar event matching the due date
- On task completion in Boreganizer:
  - **Trello**: mark existing card's due date complete, leave card in place, create new card for next due date
  - **Google Calendar**: add ✅ to existing event title + move event to actual completion date, create new event for next due date
- One-way sync only (Boreganizer → external service)
- Unassigned tasks sync to ALL household members who have sync enabled

## Decisions already made
- Default event time: 12pm
- Google Calendar: user chooses all-day vs timed during setup
- Trello: user picks board + list during setup
- One integration per user (not both at once, for now)
- Sync failure: silently skip, surface error somewhere in settings

## Open questions before building
- "Anyone" unassigned tasks: confirm it creates a card/event for every household member with sync enabled (currently assumed yes)
- Silent failure vs visible error: leaning toward a "last sync error" indicator on the integrations settings page

## Prerequisites (blockers)
Both require credentials that Britt needs to create before this can be tested:

### Trello
- API key from: https://trello.com/power-ups/admin
- Flow: redirect to `https://trello.com/1/authorize?key=KEY&response_type=token&scope=read,write&expiration=never`
- User picks board + list during onboarding

### Google Calendar
- Google Cloud project with Calendar API enabled
- OAuth 2.0 client credentials (Web Application type)
- Authorized redirect URI: `https://yourdomain.com/api/auth/google/callback`
- Scopes needed: `https://www.googleapis.com/auth/calendar.events`

## Env vars needed (add to .env.local + Vercel)
```
TRELLO_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_APP_URL=https://yourdomain.com  # needed for OAuth callbacks
```

## Schema needed
```sql
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
  created_at timestamptz not null default now()
);

create table task_sync_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  provider text not null,
  external_id text not null,
  status text not null default 'active' check (status in ('active', 'completed')),
  created_at timestamptz not null default now()
);
```

## Files to build when ready
- `supabase/sync_schema.sql`
- `src/app/api/auth/trello/callback/route.ts`
- `src/app/api/auth/google/callback/route.ts`
- `src/lib/trello.ts`
- `src/lib/google-calendar.ts`
- `src/app/(dashboard)/integrations/page.tsx`
- Hook `completeTask` and `createTask` actions to trigger sync
