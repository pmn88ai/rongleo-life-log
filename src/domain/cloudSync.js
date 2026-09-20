import { mergeById } from '../storage/exportImport.js';

// Pure decision logic for the two flows spec v2.2 §20/§21 require right
// after a login resolves. Kept separate from the React/Supabase wiring so
// the actual choice — "which screen do we show, if any" — is a plain
// function of the two datasets and easy to reason about/test.
export function planCloudSync(local, cloud) {
  const localHasData = local.eventDefinitions.length > 0 || local.events.length > 0;
  const cloudHasData = cloud.definitions.length > 0 || cloud.events.length > 0;

  if (!localHasData && cloudHasData) {
    return { kind: 'restore', localCounts: countOf(local.eventDefinitions, local.events), cloudCounts: countOf(cloud.definitions, cloud.events) };
  }
  if (localHasData) {
    return { kind: 'merge', localCounts: countOf(local.eventDefinitions, local.events), cloudCounts: countOf(cloud.definitions, cloud.events) };
  }
  return { kind: 'none' };
}

function countOf(definitions, events) {
  return {
    events: events.length,
    customDefinitions: definitions.filter(d => d.id.startsWith('custom_')).length,
    definitions: definitions.length,
  };
}

// Dedupe by id, LOCAL wins on conflict (local-first: spec's own default
// button is "Gộp dữ liệu" / merge, and local is the thing that was being
// actively used) — cloud-only records are simply added in.
export function mergeLocalAndCloud(local, cloud) {
  return {
    eventDefinitions: mergeById(local.eventDefinitions, cloud.definitions),
    events: mergeById(local.events, cloud.events),
  };
}
