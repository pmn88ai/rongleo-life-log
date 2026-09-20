import { syncQueue } from './syncQueue.js';

// The boundary the UI/domain layer is meant to depend on instead of
// "localStorage vs Supabase" directly (spec §5, §31). Local persistence
// itself is untouched — App.jsx's existing setDefinitions/setEvents +
// storage.saveState already do that correctly and are not being rewritten
// (spec §44: don't break v2.1). What this module owns is the ONE new
// decision every mutation needs to make: "does this also need to go to the
// cloud?" — answered by whether a userId is passed in. Guest mode (userId
// null/undefined) never touches this beyond a no-op, so it costs guests
// nothing and makes zero Supabase calls (spec §7).
export const eventRepository = {
  createEvent(event, userId) {
    if (userId) syncQueue.enqueue({ kind: 'event', op: 'upsert', payload: event });
  },
  updateEvent(event, userId) {
    if (userId) syncQueue.enqueue({ kind: 'event', op: 'upsert', payload: event });
  },
  deleteEvent(id, userId) {
    if (userId) syncQueue.enqueue({ kind: 'event', op: 'delete', payload: { id } });
  },
  createDefinition(definition, userId) {
    if (userId) syncQueue.enqueue({ kind: 'definition', op: 'upsert', payload: definition });
  },
  updateDefinition(definition, userId) {
    if (userId) syncQueue.enqueue({ kind: 'definition', op: 'upsert', payload: definition });
  },
  deleteDefinition(id, userId) {
    if (userId) syncQueue.enqueue({ kind: 'definition', op: 'delete', payload: { id } });
  },
};
