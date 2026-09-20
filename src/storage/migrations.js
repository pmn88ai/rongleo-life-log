import { getStarterDefinitions } from '../data/seed.js';
import { migrateLegacyExport, isLegacyExportPayload, readLegacyLocalStorage } from '../domain/migration.js';

export const CURRENT_SCHEMA_VERSION = 2;

export function emptyState() {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    eventDefinitions: [],
    events: [],
    settings: { onboardingSeen: false, theme: 'light' },
  };
}

// Normalizes whatever was parsed from storage (or an imported file) into
// the current v2 shape. Returns null if it truly cannot be understood.
export function migrateToCurrentSchema(raw) {
  if (!raw) return null;

  if (raw.schemaVersion === CURRENT_SCHEMA_VERSION) {
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      eventDefinitions: Array.isArray(raw.eventDefinitions) ? raw.eventDefinitions : [],
      events: Array.isArray(raw.events) ? raw.events : [],
      settings: raw.settings || { onboardingSeen: false, theme: 'light' },
    };
  }

  if (isLegacyExportPayload(raw)) {
    const { eventDefinitions, events } = migrateLegacyExport(raw);
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      eventDefinitions,
      events,
      settings: { onboardingSeen: false, theme: 'light' },
    };
  }

  return null;
}

// First-run bootstrap: nothing in the new key yet. Check for a v1
// installation living under the old `habits`/`logs` keys before falling
// back to a fresh starter set.
export function bootstrapState() {
  const legacy = readLegacyLocalStorage();
  if (legacy) {
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      eventDefinitions: legacy.eventDefinitions,
      events: legacy.events,
      settings: { onboardingSeen: true, theme: 'light' },
      migratedFromLegacy: true,
    };
  }
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    eventDefinitions: getStarterDefinitions(),
    events: [],
    settings: { onboardingSeen: false, theme: 'light' },
  };
}
