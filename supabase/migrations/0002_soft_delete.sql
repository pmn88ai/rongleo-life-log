-- Quan Sát v2.2 — soft-delete (tombstone) so deletes propagate between
-- devices, same as additions/edits already do (see pullFromCloud in
-- App.jsx). Previously `deleteDefinition`/`deleteEvent` ran a real SQL
-- DELETE: the row just vanished, so another signed-in device pulling data
-- down had no way to tell "never existed" apart from "existed, then got
-- deleted elsewhere" and kept showing its own stale local copy forever.
--
-- Additive only — existing rows are unaffected (deleted_at defaults to
-- null, i.e. "not deleted"). Run this against the same Supabase project
-- 0001_life_log_cloud.sql was applied to.

alter table public.event_definitions add column if not exists deleted_at timestamptz;
alter table public.events add column if not exists deleted_at timestamptz;
