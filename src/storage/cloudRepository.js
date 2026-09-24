import { supabase, isCloudConfigured } from '../auth/supabaseClient.js';
import { eventToCloudRow, eventFromCloudRow, definitionToCloudRow, definitionFromCloudRow } from './cloudMapping.js';

// Thin Supabase CRUD layer, scoped to the current session's user. Never
// called directly by UI/domain code — only syncQueue and the migration/
// restore flows touch this. Every write is an upsert keyed by the same id
// the local record already has (spec §19), so retries are idempotent and
// there is exactly one cloud id per local id, never a second one minted.
export const cloudRepository = {
  async fetchAll(userId) {
    if (!isCloudConfigured) return { definitions: [], events: [] };
    const [defsRes, eventsRes] = await Promise.all([
      supabase.from('event_definitions').select('*').eq('user_id', userId),
      supabase.from('events').select('*').eq('user_id', userId),
    ]);
    if (defsRes.error) throw defsRes.error;
    if (eventsRes.error) throw eventsRes.error;
    return {
      definitions: defsRes.data.map(definitionFromCloudRow),
      events: eventsRes.data.map(eventFromCloudRow),
    };
  },

  async upsertDefinition(def, userId) {
    const { error } = await supabase.from('event_definitions').upsert(definitionToCloudRow(def, userId));
    if (error) throw error;
  },
  // Soft delete (tombstone), not a real DELETE: another signed-in device's
  // periodic pull (App.jsx pullFromCloud → mergeCloudDown) needs to be able
  // to tell "this id was deleted elsewhere" apart from "this id never
  // existed" so it can remove its own stale local copy. A real DELETE gives
  // no such signal — the row just silently stops coming back from fetchAll.
  async deleteDefinition(id, userId) {
    const { error } = await supabase.from('event_definitions').update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('user_id', userId);
    if (error) throw error;
  },
  async upsertEvent(event, userId) {
    const { error } = await supabase.from('events').upsert(eventToCloudRow(event, userId));
    if (error) throw error;
  },
  async deleteEvent(id, userId) {
    const { error } = await supabase.from('events').update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('user_id', userId);
    if (error) throw error;
  },

  async upsertManyDefinitions(defs, userId) {
    if (defs.length === 0) return;
    const { error } = await supabase.from('event_definitions').upsert(defs.map(d => definitionToCloudRow(d, userId)));
    if (error) throw error;
  },
  async upsertManyEvents(events, userId) {
    if (events.length === 0) return;
    const { error } = await supabase.from('events').upsert(events.map(e => eventToCloudRow(e, userId)));
    if (error) throw error;
  },
};
