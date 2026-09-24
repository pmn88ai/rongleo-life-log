import { includesLoose } from '../utils/text.js';
import { dateKey } from '../utils/date.js';

const FREQUENCY_WINDOW_DAYS = 30;

export function sortByTimestampDesc(events) {
  return [...events].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export function getFrequencyMap(events, days = FREQUENCY_WINDOW_DAYS) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const map = new Map();
  for (const e of events) {
    if (new Date(e.timestamp).getTime() < cutoff) continue;
    map.set(e.eventDefinitionId, (map.get(e.eventDefinitionId) || 0) + 1);
  }
  return map;
}

// Distinct definition ids ordered by most recent use.
export function getRecentDefinitionIds(events, limit = 10) {
  const seen = new Set();
  const order = [];
  for (const e of sortByTimestampDesc(events)) {
    if (!seen.has(e.eventDefinitionId)) {
      seen.add(e.eventDefinitionId);
      order.push(e.eventDefinitionId);
    }
    if (order.length >= limit) break;
  }
  return order;
}

export function getRecentDefinitions(definitions, events, limit = 10) {
  const byId = new Map(definitions.map(d => [d.id, d]));
  return getRecentDefinitionIds(events, limit)
    .map(id => byId.get(id))
    .filter(Boolean);
}

// Quick Log Grid priority/order: favorites -> recently used -> frequently
// used -> everything else. No cap — the grid always shows every definition
// the user has (operator: "tao muốn không giới hạn"), so it and Quản lý →
// Sự kiện always describe the exact same set, unconditionally. Only the
// ORDER is curated, not which ones show.
export function getQuickGridDefinitions(definitions, events) {
  const result = [];
  const used = new Set();

  const favorites = definitions.filter(d => d.favorite);
  for (const d of favorites) {
    result.push(d);
    used.add(d.id);
  }

  const recentIds = getRecentDefinitionIds(events, definitions.length);
  for (const id of recentIds) {
    if (used.has(id)) continue;
    const def = definitions.find(d => d.id === id);
    if (!def) continue;
    result.push(def);
    used.add(def.id);
  }

  const freq = getFrequencyMap(events);
  const byFrequency = definitions
    .filter(d => !used.has(d.id) && freq.has(d.id))
    .sort((a, b) => freq.get(b.id) - freq.get(a.id));
  for (const d of byFrequency) {
    result.push(d);
    used.add(d.id);
  }

  const rest = definitions.filter(d => !used.has(d.id));
  for (const d of rest) {
    result.push(d);
    used.add(d.id);
  }

  return result;
}

export function filterEventsByRange(events, rangeKey) {
  if (rangeKey === 'all') return events;
  const days = { '7d': 7, '30d': 30, '90d': 90 }[rangeKey] || 7;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return events.filter(e => new Date(e.timestamp).getTime() >= cutoff);
}

export function getEventsForDay(events, dateKeyStr) {
  return events.filter(e => dateKey(e.timestamp) === dateKeyStr);
}

export function getEventCountsByDay(events) {
  const map = new Map();
  for (const e of events) {
    const k = dateKey(e.timestamp);
    map.set(k, (map.get(k) || 0) + 1);
  }
  return map;
}

export function searchDefinitions(definitions, query) {
  if (!query || !query.trim()) return definitions;
  return definitions.filter(d =>
    includesLoose(d.name, query) ||
    includesLoose(d.category, query) ||
    d.emoji === query.trim() ||
    (d.aliases || []).some(a => includesLoose(a, query))
  );
}

// "Theo hoạt động" view (Dòng thời gian + Lịch): the same events grouped by
// which EventDefinition logged them, newest-first-used ordering swapped for
// most-frequent-first (matches Thống kê's own sort). Groups by id but keeps
// the event's own name/emoji SNAPSHOT for display, so a deleted definition's
// history still groups and renders correctly (same principle as everywhere
// else events outlive their definition).
export function groupEventsByDefinition(events, definitions) {
  const defsById = new Map(definitions.map(d => [d.id, d]));
  const groups = new Map();
  const order = [];
  for (const e of events) {
    const key = e.eventDefinitionId;
    if (!groups.has(key)) {
      groups.set(key, { id: key, name: e.nameSnapshot, emoji: e.emojiSnapshot, definition: defsById.get(key) || null, events: [] });
      order.push(key);
    }
    groups.get(key).events.push(e);
  }
  return order.map(key => groups.get(key)).sort((a, b) => b.events.length - a.events.length);
}

export function searchEvents(events, query) {
  if (!query || !query.trim()) return events;
  return events.filter(e =>
    includesLoose(e.nameSnapshot, query) ||
    includesLoose(e.categorySnapshot, query) ||
    includesLoose(e.note, query) ||
    e.emojiSnapshot === query.trim()
  );
}
