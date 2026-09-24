import { mergeById } from '../storage/exportImport.js';

// Strips soft-deleted (tombstoned) rows — see 0002_soft_delete.sql and
// cloudRepository.deleteDefinition/deleteEvent. Used everywhere cloud data
// feeds a flow that only ever ADDS records (the first-login merge screen
// below): without this, a definition/event someone deleted on another
// device before this device's first login would get silently resurrected
// by mergeLocalAndCloud, since to that function a tombstoned row just looks
// like an ordinary cloud-only record to add in.
export function stripDeleted(cloud) {
  return {
    definitions: cloud.definitions.filter(d => !d.deletedAt),
    events: cloud.events.filter(e => !e.deletedAt),
  };
}

// Pure decision logic for the two flows spec v2.2 §20/§21 require right
// after a login resolves. Kept separate from the React/Supabase wiring so
// the actual choice — "which screen do we show, if any" — is a plain
// function of the two datasets and easy to reason about/test.
export function planCloudSync(local, rawCloud) {
  const cloud = stripDeleted(rawCloud);
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
// actively used) — cloud-only records are simply added in. Tombstoned cloud
// rows are stripped first (see stripDeleted) so a delete made on another
// device before this one's first login doesn't get resurrected.
export function mergeLocalAndCloud(local, rawCloud) {
  const cloud = stripDeleted(rawCloud);
  return {
    eventDefinitions: mergeById(local.eventDefinitions, cloud.definitions),
    events: mergeById(local.events, cloud.events),
  };
}

// Ongoing pull-down sync (App.jsx's periodic/on-focus refresh while signed
// in), as opposed to the one-time login screen above. Here CLOUD wins on
// conflict: cloud is the shared record every signed-in device pushes to
// promptly (outbox flushes on every state change while online), so by the
// time another device pulls, cloud already reflects the most recent edit
// from whichever device made it — unlike the login screen, there's no "which
// one was the user actively using" ambiguity to protect against here.
// Unlike mergeLocalAndCloud above, this one takes the RAW (tombstone-
// including) cloud data on purpose: a tombstoned row here means "delete
// this id locally too" (see cloudRepository.deleteDefinition/deleteEvent +
// 0002_soft_delete.sql) — the only place in the app deletes actually
// propagate to another signed-in device.
export function mergeCloudDown(local, cloud) {
  return {
    eventDefinitions: mergeCloudWins(local.eventDefinitions, cloud.definitions),
    events: mergeCloudWins(local.events, cloud.events),
  };
}

function mergeCloudWins(localArr, cloudArr) {
  const map = new Map(localArr.map(i => [i.id, i]));
  for (const item of cloudArr) {
    if (item.deletedAt) map.delete(item.id);
    else map.set(item.id, item);
  }
  return Array.from(map.values());
}
