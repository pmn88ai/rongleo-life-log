import { uid } from '../utils/id.js';
import { EVENT_TYPES } from './eventTypes.js';

// Build a real, user-owned EventDefinition from a library suggestion.
// The library's stable id is reused so re-browsing the library never
// creates duplicates for the same concept.
export function createDefinitionFromLibrary(libEntry, overrides = {}) {
  return {
    id: libEntry.id,
    name: libEntry.name,
    emoji: libEntry.emoji,
    category: libEntry.category,
    type: libEntry.type,
    unit: libEntry.unit,
    defaultValue: libEntry.defaultValue,
    aliases: libEntry.aliases || [],
    favorite: false,
    active: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createCustomDefinition({ name, emoji, category, type, unit, defaultValue }) {
  return {
    id: `custom_${uid()}`,
    name: name.trim(),
    emoji: emoji || '✨',
    category: category || 'other',
    type: type || EVENT_TYPES.MOMENT,
    unit: unit || null,
    defaultValue: defaultValue ?? null,
    aliases: [],
    favorite: false,
    active: true,
    createdAt: new Date().toISOString(),
  };
}

// Build a raw Event from a definition + captured input. Snapshots the
// definition's name/emoji so history survives later edits/deletes (spec §26).
export function createEvent(definition, input = {}) {
  const {
    value = null,
    durationSeconds = null,
    rating = null,
    note = '',
    timestamp = new Date().toISOString(),
  } = input;
  return {
    id: uid(),
    eventDefinitionId: definition.id,
    timestamp,
    value,
    unit: definition.unit,
    durationSeconds,
    rating,
    note: note || '',
    nameSnapshot: definition.name,
    emojiSnapshot: definition.emoji,
    categorySnapshot: definition.category,
    createdAt: new Date().toISOString(),
  };
}

// The "one tap" path: log using the definition's own default, per type.
export function quickLogEvent(definition, extra = {}) {
  switch (definition.type) {
    case EVENT_TYPES.COUNT:
      return createEvent(definition, { value: definition.defaultValue ?? 1, ...extra });
    case EVENT_TYPES.DURATION:
      return createEvent(definition, {
        value: definition.defaultValue ?? 30,
        durationSeconds: (definition.defaultValue ?? 30) * 60,
        ...extra,
      });
    case EVENT_TYPES.MOMENT:
      return createEvent(definition, extra);
    default:
      // measurement/rating have no sensible one-tap default; caller must
      // route them through an input step instead of calling this directly.
      return createEvent(definition, extra);
  }
}

export function updateEvent(event, patch) {
  return { ...event, ...patch };
}
