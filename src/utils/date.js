// Local-time (not UTC) date helpers — timezone-safe the same way the v1 app was.
export function dateKey(input) {
  const d = input instanceof Date ? input : new Date(input);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function todayKey() {
  return dateKey(new Date());
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export function fmtWeekdayLong(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('vi-VN', { weekday: 'long' });
}

export function fmtFullDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const weekday = d.toLocaleDateString('vi-VN', { weekday: 'long' });
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ngày ${d.getDate()} tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
}

export function fmtShortDate(iso) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function fmtDayLabel(dateKeyStr) {
  const [y, m, dd] = dateKeyStr.split('-').map(Number);
  return new Date(y, m - 1, dd).toLocaleDateString('vi-VN', { weekday: 'short' });
}

export function getLastNDays(n) {
  return Array.from({ length: n }, (_, i) => dateKey(addDays(new Date(), -(n - 1 - i))));
}

// Monday-first month grid: returns an array of week rows, each with 7 cells
// { date, dateKey, inMonth }.
export function getMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // Monday = 0
  const gridStart = addDays(first, -startOffset);
  const weeks = [];
  let cursor = gridStart;
  for (let w = 0; w < 6; w++) {
    const row = [];
    for (let d = 0; d < 7; d++) {
      row.push({
        date: cursor,
        dateKey: dateKey(cursor),
        inMonth: cursor.getMonth() === month,
      });
      cursor = addDays(cursor, 1);
    }
    weeks.push(row);
    // Stop once we've rendered the target month fully and moved past it.
    if (row[6].date.getMonth() !== month && cursor.getMonth() !== month && w >= 3) break;
  }
  return weeks;
}

// "Hôm nay" / "Hôm qua" / weekday+date — used as a separator between days
// in a flat, ungrouped chronological list (spec: every tap is its own row,
// but days must still be tellable apart at a glance).
export function fmtDaySeparator(dateKeyStr) {
  const today = todayKey();
  const yesterday = dateKey(addDays(new Date(), -1));
  if (dateKeyStr === today) return 'Hôm nay';
  if (dateKeyStr === yesterday) return 'Hôm qua';
  const [y, m, dd] = dateKeyStr.split('-').map(Number);
  const d = new Date(y, m - 1, dd);
  const weekday = d.toLocaleDateString('vi-VN', { weekday: 'long' });
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${String(dd).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

export function minutesToLabel(minutes) {
  if (minutes == null) return '';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0 && m > 0) return `${h}h${m}p`;
  if (h > 0) return `${h}h`;
  return `${m}p`;
}
