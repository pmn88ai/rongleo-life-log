// Type-aware statistics. Deliberately free of judgmental labels
// (good/bad/better/worse) — spec §23. If interpretation is ever added it
// must be per-EventDefinition and explicit, never baked in here.
import { EVENT_TYPES } from './eventTypes.js';
import { dateKey } from '../utils/date.js';

function daySpan(events) {
  if (events.length === 0) return 1;
  const days = new Set(events.map(e => dateKey(e.timestamp)));
  return Math.max(days.size, 1);
}

function computeMomentStats(events) {
  if (events.length === 0) return { total: 0, avgPerDay: 0, lastAt: null, avgGapHours: null };
  const sorted = [...events].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  let gapSum = 0;
  for (let i = 1; i < sorted.length; i++) {
    gapSum += new Date(sorted[i].timestamp) - new Date(sorted[i - 1].timestamp);
  }
  const avgGapHours = sorted.length > 1 ? gapSum / (sorted.length - 1) / 3600000 : null;
  return {
    total: events.length,
    avgPerDay: +(events.length / daySpan(events)).toFixed(1),
    lastAt: sorted[sorted.length - 1].timestamp,
    avgGapHours: avgGapHours != null ? +avgGapHours.toFixed(1) : null,
  };
}

function computeCountStats(events, unit) {
  if (events.length === 0) return { total: 0, avgPerDay: 0, count: 0, avgPerOccurrence: 0, unit };
  const total = events.reduce((s, e) => s + (e.value || 0), 0);
  return {
    total: +total.toFixed(1),
    avgPerDay: +(total / daySpan(events)).toFixed(1),
    count: events.length,
    avgPerOccurrence: +(total / events.length).toFixed(1),
    unit,
  };
}

function computeDurationStats(events) {
  if (events.length === 0) return { totalMinutes: 0, avgPerSession: 0, sessionCount: 0 };
  const totalMinutes = events.reduce((s, e) => s + (e.value || (e.durationSeconds ? e.durationSeconds / 60 : 0)), 0);
  return {
    totalMinutes: Math.round(totalMinutes),
    avgPerSession: Math.round(totalMinutes / events.length),
    sessionCount: events.length,
  };
}

function computeMeasurementStats(events, unit) {
  if (events.length === 0) return { latest: null, min: null, max: null, average: null, trend: 'flat', unit };
  const sorted = [...events].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const values = sorted.map(e => e.value).filter(v => v != null);
  if (values.length === 0) return { latest: null, min: null, max: null, average: null, trend: 'flat', unit };
  const latest = values[values.length - 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const average = +(values.reduce((s, v) => s + v, 0) / values.length).toFixed(1);
  let trend = 'flat';
  if (values.length >= 2) {
    const mid = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, mid);
    const secondHalf = values.slice(mid);
    const firstAvg = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length;
    const delta = secondAvg - firstAvg;
    trend = Math.abs(delta) < firstAvg * 0.02 ? 'flat' : delta > 0 ? 'up' : 'down';
  }
  return { latest, min, max, average, trend, unit };
}

function computeRatingStats(events) {
  if (events.length === 0) return { average: null, highest: null, lowest: null, distribution: {} };
  const values = events.map(e => e.value).filter(v => v != null);
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const v of values) distribution[v] = (distribution[v] || 0) + 1;
  return {
    average: +(values.reduce((s, v) => s + v, 0) / values.length).toFixed(1),
    highest: Math.max(...values),
    lowest: Math.min(...values),
    distribution,
  };
}

export function computeStatsForDefinition(definition, events) {
  switch (definition.type) {
    case EVENT_TYPES.MOMENT:
      return { type: EVENT_TYPES.MOMENT, ...computeMomentStats(events) };
    case EVENT_TYPES.COUNT:
      return { type: EVENT_TYPES.COUNT, ...computeCountStats(events, definition.unit) };
    case EVENT_TYPES.DURATION:
      return { type: EVENT_TYPES.DURATION, ...computeDurationStats(events) };
    case EVENT_TYPES.MEASUREMENT:
      return { type: EVENT_TYPES.MEASUREMENT, ...computeMeasurementStats(events, definition.unit) };
    case EVENT_TYPES.RATING:
      return { type: EVENT_TYPES.RATING, ...computeRatingStats(events) };
    default:
      return { type: definition.type };
  }
}

// One-line aggregate headline for a definition's stats — shared by the
// Thống kê list and the "Theo hoạt động" grouped view (Dòng thời gian +
// Lịch) so both describe a definition's totals identically.
export function summaryHeadline(stats) {
  switch (stats.type) {
    case 'moment': return `${stats.total} lần`;
    case 'count': return `${stats.total} ${stats.unit || ''}`.trim();
    case 'duration': return `${stats.totalMinutes} phút`;
    case 'measurement': return stats.latest != null ? `${stats.latest} ${stats.unit || ''}`.trim() : 'Chưa có dữ liệu';
    case 'rating': return stats.average != null ? `TB ${stats.average}/5` : 'Chưa có dữ liệu';
    default: return '';
  }
}

// Best-effort type guess for a group whose original EventDefinition was
// deleted (only the event's own snapshot fields survive — no type/unit
// snapshot exists on Event, see eventService.createEvent). Good enough to
// keep the group's aggregate readable; exact count-vs-measurement can't be
// recovered without the live definition, so it defaults to "count" (safe
// to sum) rather than silently dropping the group from the grouped view.
export function inferDefinitionFromEvents(id, name, emoji, events) {
  const sample = events[0];
  let type = EVENT_TYPES.MOMENT;
  if (sample.rating != null) type = EVENT_TYPES.RATING;
  else if (sample.durationSeconds != null) type = EVENT_TYPES.DURATION;
  else if (sample.value != null) type = EVENT_TYPES.COUNT;
  return { id, name, emoji, type, unit: sample.unit || null };
}
