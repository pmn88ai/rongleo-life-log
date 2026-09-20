import { CURRENT_SCHEMA_VERSION, migrateToCurrentSchema } from './migrations.js';
import { todayKey } from '../utils/date.js';

export function buildExportPayload(state) {
  return {
    app: 'rongleo-life-log',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    eventDefinitions: state.eventDefinitions,
    events: state.events,
    settings: state.settings,
  };
}

export function downloadExport(state) {
  const payload = buildExportPayload(state);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `quan-sat-life-log-${todayKey()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseImportPayload(raw) {
  const migrated = migrateToCurrentSchema(raw);
  if (!migrated) throw new Error('File không đúng định dạng Quan Sát.');
  return migrated;
}

export function mergeStates(current, incoming) {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    eventDefinitions: mergeById(current.eventDefinitions, incoming.eventDefinitions),
    events: mergeById(current.events, incoming.events),
    settings: current.settings,
  };
}

export function replaceState(current, incoming) {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    eventDefinitions: incoming.eventDefinitions,
    events: incoming.events,
    settings: current.settings,
  };
}

export function mergeById(oldArr, newArr) {
  const map = new Map(oldArr.map(i => [i.id, i]));
  for (const item of newArr) {
    if (!map.has(item.id)) map.set(item.id, item);
  }
  return Array.from(map.values());
}
