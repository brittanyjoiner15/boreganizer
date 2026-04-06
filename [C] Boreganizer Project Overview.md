# Boreganizer — Project Overview

A web app for tracking boring-but-necessary chores and routine maintenance. The name says it all: organize the boring stuff so you don't forget it.

---

## Goal

Build and ship a multi-user web app where people can track recurring tasks (cleaning, oil changes, flea meds, etc.) with smart due date handling and a clean mobile-first UI.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router) |
| Styling | Tailwind CSS |
| Database + Auth | Supabase |
| Deployment | Vercel |

---

## Key Features

### 1. Recurring Tasks
- Create tasks with common presets: daily, weekly, monthly, every 3/6 months, annually
- Custom recurrence in days/weeks/months/years
- Mileage-based recurrence (e.g., every 10,000 miles)

### 2. Completion History + Notes
- Log each time a task is done with a timestamp
- Optional notes per completion (e.g., "used brand X", "noticed a leak")
- View full history for any task

### 3. Smart Due Date Adjustment
- When you mark something done late, next due date recalculates from the actual completion date, not the original due date
- No duplicate tasks — if something is overdue, it shows as one overdue item, not multiple

### 4. Mileage-Based Tasks
- Log your current mileage when completing a task
- Next due = logged mileage + recurrence interval (e.g., 45,000 + 10,000 = due at 55,000)
- Dashboard shows "due in X,XXX miles" based on last logged mileage

### 5. Dashboard Views
- **Overdue** — past due, needs attention
- **Due Today** — on the list for today
- **Due Soon** — coming up in the next 7 days
- **Upcoming** — everything else

---

## Design Direction

- Fun and playful — this stuff is boring, the app shouldn't be
- Mobile-first responsive (primary use case is phone)
- Clean, easy to tap, glanceable dashboard

---

## Database Schema (planned)

### `tasks`
- `id`, `user_id`, `name`, `description`, `category`
- `recurrence_type`: `daily | weekly | monthly | yearly | custom | mileage`
- `recurrence_value`: number (e.g., 7, 10000)
- `recurrence_unit`: `days | weeks | months | years | miles`
- `next_due_date`: date (time-based tasks)
- `next_due_mileage`: number (mileage-based tasks)
- `last_logged_mileage`: number (most recent mileage entered)
- `created_at`

### `task_logs`
- `id`, `task_id`, `user_id`
- `completed_at`: timestamp
- `notes`: text
- `mileage_at_completion`: number (mileage-based tasks only)

---

## Open Problems

1. Scaffold Next.js app with Tailwind and Supabase client
2. Set up Supabase project: schema, RLS policies, auth
3. Build core task CRUD (create, edit, delete, archive)
4. Build completion logging + due date recalculation logic
5. Build dashboard (overdue / today / soon / upcoming)
6. Build task history view
7. Mileage task UI and logic
8. Auth flow (sign up, login, protected routes)
9. Polish: design, animations, empty states
10. Deploy to Vercel

---

## Notes

- Users own their own data — RLS policies should enforce user_id scoping on all tables
- Mileage tracking is per-task, not per-vehicle (keep it simple for v1)
