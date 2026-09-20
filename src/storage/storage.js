import { migrateToCurrentSchema, bootstrapState } from './migrations.js';

export const STORAGE_KEY = 'rongleo_life_log';

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return bootstrapState();
    const parsed = JSON.parse(raw);
    const migrated = migrateToCurrentSchema(parsed);
    return migrated || bootstrapState();
  } catch {
    return bootstrapState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    // Quota exceeded or storage disabled — surfaced to the UI by callers
    // via the return value, not thrown, so a save failure never crashes
    // an in-progress log.
    console.error('Không thể lưu dữ liệu vào bộ nhớ thiết bị', err);
    return false;
  }
  return true;
}
