# Noticing

A calm, minimalist journaling app for daily noticing and weekly reflection.

## Stack

- Next.js (App Router)
- Tailwind CSS
- Supabase (auth + database)
- OpenAI API (weekly reflection)

## Setup

1. Install dependencies

```bash
npm install
```

2. Create a Supabase project and enable Email + Password auth.

3. Create the database tables and policies below in the Supabase SQL editor.

4. Add environment variables in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

5. Run the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Supabase schema (SQL)

```sql
create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  answer_1 text,
  answer_2 text,
  answer_3 text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table if not exists public.reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists reflections_user_week_idx
  on public.reflections (user_id, week_start);

alter table public.entries enable row level security;
alter table public.reflections enable row level security;

create policy "Users can read their entries"
  on public.entries
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their entries"
  on public.entries
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their entries"
  on public.entries
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can read their reflections"
  on public.reflections
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their reflections"
  on public.reflections
  for insert
  with check (auth.uid() = user_id);
```

## Notes

- Entries are upserted by `(user_id, date)` so the same day can be edited.
- Reflections are generated on demand and stored in the `reflections` table.
- No notifications or gamification are included by design.
