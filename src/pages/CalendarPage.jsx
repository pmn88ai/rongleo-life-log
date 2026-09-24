import { useEffect, useMemo, useState } from 'react';
import { CalendarGrid } from '../components/CalendarGrid.jsx';
import { TimelineRow } from '../components/TimelineItem.jsx';
import { EventDetailModal } from '../components/EventDetailModal.jsx';
import { GroupedByActivity } from '../components/GroupedByActivity.jsx';
import { getEventCountsByDay, getEventsForDay, sortByTimestampDesc } from '../domain/selectors.js';
import { fmtFullDate, todayKey } from '../utils/date.js';

const PAGE_SIZE = 60;

const VIEW_MODES = [
  { id: 'chrono', label: 'Dòng thời gian' },
  { id: 'grouped', label: 'Theo hoạt động' },
];

export function CalendarPage({ definitions, events, onSaveEvent, onDeleteEvent }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedKey, setSelectedKey] = useState(todayKey());
  const [openEvent, setOpenEvent] = useState(null);
  const [viewMode, setViewMode] = useState('chrono');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [selectedKey]);

  const countsByDay = useMemo(() => getEventCountsByDay(events), [events]);
  const dayEvents = useMemo(() => sortByTimestampDesc(getEventsForDay(events, selectedKey)), [events, selectedKey]);
  const rows = dayEvents;
  const visibleRows = useMemo(() => rows.slice(0, visibleCount), [rows, visibleCount]);

  function goMonth(delta) {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonth(m);
    setYear(y);
  }

  const [sy, sm, sd] = selectedKey.split('-').map(Number);
  const selectedDate = new Date(sy, sm - 1, sd);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted tracking-widest uppercase mb-0.5">Xem theo tháng</p>
        <h1 className="text-xl font-bold text-primary">Lịch</h1>
      </div>

      <CalendarGrid
        year={year} month={month} countsByDay={countsByDay} selectedKey={selectedKey}
        onSelect={setSelectedKey} onPrevMonth={() => goMonth(-1)} onNextMonth={() => goMonth(1)}
      />

      <div>
        <p className="text-sm font-semibold text-primary">{fmtFullDate(selectedDate)}</p>
        <p className="text-xs text-muted mt-0.5">Sự kiện trong ngày ({dayEvents.length})</p>
      </div>

      {rows.length > 0 && (
        <div className="flex gap-2">
          {VIEW_MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setViewMode(m.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                viewMode === m.id ? 'bg-ink text-on-ink border-ink' : 'bg-surface border-default text-secondary'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="text-center py-10 text-muted">
          <p className="text-3xl mb-2">🌱</p>
          <p className="text-sm">Không có sự kiện nào trong ngày này.</p>
        </div>
      ) : viewMode === 'grouped' ? (
        <GroupedByActivity events={rows} definitions={definitions} />
      ) : (
        <div className="space-y-2">
          {visibleRows.map(event => (
            <TimelineRow key={event.id} event={event} onOpen={setOpenEvent} onDelete={onDeleteEvent} />
          ))}
          {rows.length > visibleCount && (
            <button
              onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
              className="w-full py-3 rounded-2xl border border-default bg-surface text-sm font-medium text-body hover:bg-app transition-all active:scale-95"
            >
              Xem thêm ({(rows.length - visibleCount).toLocaleString('vi-VN')} còn lại)
            </button>
          )}
        </div>
      )}

      {openEvent && (
        <EventDetailModal
          event={openEvent}
          onClose={() => setOpenEvent(null)}
          onSave={(id, patch) => { onSaveEvent(id, patch); setOpenEvent(null); }}
          onDelete={(id) => { onDeleteEvent(id); setOpenEvent(null); }}
        />
      )}
    </div>
  );
}
