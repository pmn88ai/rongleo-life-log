// Starter event definitions for a brand-new install, so the Quick Log
// Grid is never empty on first run. Deliberately mundane/bodily-first
// (spec v2.1 §6) — this is the first thing a new user sees, and it must
// say "Life Event Logger", not "activity/habit tracker" (spec v2.1 §1).
import { getLibraryEntry } from './eventLibrary.js';
import { createDefinitionFromLibrary } from '../domain/eventService.js';

const STARTER_LIBRARY_IDS = [
  'body_dai_tien',
  'body_tieu_tien',
  'body_uong_nuoc',
  'drink_ca_phe',
  'body_tam',
  'food_an',
  'health_uong_thuoc',
  'pain_symptom_dau_dau',
];

export function getStarterDefinitions() {
  const now = new Date().toISOString();
  return STARTER_LIBRARY_IDS
    .map(id => getLibraryEntry(id))
    .filter(Boolean)
    .map(entry => createDefinitionFromLibrary(entry, { favorite: true, createdAt: now }));
}
