-- Quan Sát v2.2 — optional cloud sync for admin/authenticated users.
--
-- Scope decision (documented per spec §12): the 354-entry suggestion
-- library lives in the frontend bundle (src/data/eventLibrary.js), not in
-- the database — there is nothing "system-wide" to store here. Every row
-- in these tables belongs to exactly one authenticated user (the one who
-- activated/logged it); there is no shared/global definitions concept to
-- reconcile, which keeps this migration additive and simple.
--
-- Run this against a Supabase project you already control. If this project
-- already has other tables/migrations, read them first — this migration
-- only creates two new tables and does not touch anything else.

create table if not exists public.event_definitions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  emoji text not null,
  category text not null,
  type text not null check (type in ('moment', 'count', 'measurement', 'duration', 'rating')),
  unit text,
  default_value numeric,
  aliases text[] not null default '{}',
  favorite boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Intentionally NOT a foreign key to event_definitions: exactly like the
  -- local storage model, an event must keep displaying correctly (via the
  -- snapshot columns below) even after its definition is edited or deleted.
  event_definition_id text not null,
  "timestamp" timestamptz not null,
  value numeric,
  unit text,
  duration_seconds integer,
  rating smallint check (rating is null or (rating between 1 and 5)),
  note text not null default '',
  name_snapshot text not null,
  emoji_snapshot text not null,
  category_snapshot text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists event_definitions_user_id_idx on public.event_definitions(user_id);
create index if not exists events_user_id_idx on public.events(user_id);
create index if not exists events_user_id_timestamp_idx on public.events(user_id, "timestamp" desc);

alter table public.event_definitions enable row level security;
alter table public.events enable row level security;

-- Ownership is enforced by the database, never trusted from the client
-- (spec §13/§14): every policy checks auth.uid() = user_id, and INSERT's
-- WITH CHECK prevents a client from writing rows under someone else's id.
create policy "event_definitions_select_own" on public.event_definitions
  for select using (auth.uid() = user_id);
create policy "event_definitions_insert_own" on public.event_definitions
  for insert with check (auth.uid() = user_id);
create policy "event_definitions_update_own" on public.event_definitions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "event_definitions_delete_own" on public.event_definitions
  for delete using (auth.uid() = user_id);

create policy "events_select_own" on public.events
  for select using (auth.uid() = user_id);
create policy "events_insert_own" on public.events
  for insert with check (auth.uid() = user_id);
create policy "events_update_own" on public.events
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "events_delete_own" on public.events
  for delete using (auth.uid() = user_id);
