// Converts a v1 Quan Sát (habit tracker) export into the v2 event-log shape
// (spec §28). habit -> EventDefinition, log -> Event.
import { EVENT_TYPES } from './eventTypes.js';
import { EVENT_LIBRARY } from '../data/eventLibrary.js';
import { includesLoose } from '../utils/text.js';

function guessLibraryMatch(habitName) {
  return EVENT_LIBRARY.find(entry =>
    includesLoose(entry.name, habitName) || includesLoose(habitName, entry.name) ||
    (entry.aliases || []).some(a => includesLoose(a, habitName) || includesLoose(habitName, a))
  ) || null;
}

export function isLegacyExportPayload(raw) {
  return !!raw && raw.version === 1 && !!raw.data && Array.isArray(raw.data.habits) && Array.isArray(raw.data.logs);
}

export function migrateLegacyExport(raw) {
  const { habits = [], logs = [] } = raw.data || {};

  const eventDefinitions = habits.map(h => {
    const guess = guessLibraryMatch(h.name || '');
    return {
      id: `legacy_${h.id}`,
      name: h.name || 'Không tên',
      emoji: guess ? guess.emoji : '📝',
      category: guess ? guess.category : 'other',
      type: EVENT_TYPES.COUNT,
      unit: h.unit || 'lần',
      defaultValue: 1,
      aliases: [],
      favorite: false,
      active: true,
      createdAt: h.created_at || new Date().toISOString(),
    };
  });
  const defById = new Map(eventDefinitions.map(d => [d.id, d]));

  const events = logs
    .map(l => {
      const def = defById.get(`legacy_${l.habit_id}`);
      if (!def) return null;
      return {
        id: l.id,
        eventDefinitionId: def.id,
        timestamp: l.created_at || new Date().toISOString(),
        value: Number(l.quantity) || 1,
        unit: def.unit,
        durationSeconds: null,
        rating: null,
        note: l.note || '',
        nameSnapshot: def.name,
        emojiSnapshot: def.emoji,
        categorySnapshot: def.category,
        createdAt: l.created_at || new Date().toISOString(),
      };
    })
    .filter(Boolean);

  return { eventDefinitions, events };
}

// Detect the raw v1 localStorage keys (not an export file — the actual
// in-browser keys the old app used) so a first run on an old browser
// profile can self-migrate.
export function readLegacyLocalStorage() {
  try {
    const habits = JSON.parse(localStorage.getItem('habits') || 'null');
    const logs = JSON.parse(localStorage.getItem('logs') || 'null');
    if (!Array.isArray(habits) || !Array.isArray(logs)) return null;
    if (habits.length === 0 && logs.length === 0) return null;
    return migrateLegacyExport({ version: 1, data: { habits, logs, messages: [] } });
  } catch {
    return null;
  }
}
