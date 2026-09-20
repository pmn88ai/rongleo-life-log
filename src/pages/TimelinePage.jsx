import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { TimelineRow } from '../components/TimelineItem.jsx';
import { EventDetailModal } from '../components/EventDetailModal.jsx';
import { sortByTimestampDesc, searchEvents } from '../domain/selectors.js';
import { CATEGORIES } from '../data/categories.js';
import { dateKey, fmtDaySeparator } from '../utils/date.js';

// Search/sort run over the full dataset (cheap, O(n)) but only a bounded
// window is ever mounted as DOM — this is what keeps the timeline usable at
// 10,000+ events (spec §37, §45). Every event is its own row, newest first —
// no clumping into "× N" groups, so repeats stay distinguishable by time.
const PAGE_SIZE = 60;

export function TimelinePage({ events, onSaveEvent, onDeleteEvent }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [openEvent, setOpenEvent] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [query, category]);

  const presentCategories = useMemo(() => {
    const set = new Set(events.map(e => e.categorySnapshot).filter(Boolean));
    return CATEGORIES.filter(c => set.has(c.id));
  }, [events]);

  const filtered = useMemo(() => {
    let list = sortByTimestampDesc(events);
    if (category !== 'all') list = list.filter(e => e.categorySnapshot === category);
    list = searchEvents(list, query);
    return list;
  }, [events, category, query]);

  const rows = filtered;
  const visibleRows = useMemo(() => rows.slice(0, visibleCount), [rows, visibleCount]);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted tracking-widest uppercase mb-0.5">Lịch sử</p>
        <h1 className="text-xl font-bold text-primary">Dòng thời gian</h1>
      </div>

      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"><Icon.search className="w-4 h-4" /></span>
        <input
          value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Tìm theo tên, ghi chú..."
          className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-default bg-surface text-sm focus:outline-none focus:border-focus"
        />
      </div>

      {presentCategories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            onClick={() => setCategory('all')}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              category === 'all' ? 'bg-ink text-on-ink' : 'bg-surface border border-default text-secondary'}`}
          >
            Tất cả
          </button>
          {presentCategories.map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                category === c.id ? 'bg-ink text-on-ink' : 'bg-surface border border-default text-secondary'}`}
            >
              {c.emoji} {c.name}
            </button>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="text-center py-16 text-muted">
          {query || category !== 'all' ? (
            <>
              <p className="text-3xl mb-2">🔎</p>
              <p className="text-sm">Không tìm thấy sự kiện.</p>
            </>
          ) : (
            <>
              <p className="text-3xl mb-2">🌱</p>
              <p className="text-sm">Chưa có gì hôm nay.<br />Một chạm để bắt đầu ghi lại ngày của bạn.</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {visibleRows.map((event, i) => {
            const dk = dateKey(event.timestamp);
            const showSeparator = i === 0 || dateKey(visibleRows[i - 1].timestamp) !== dk;
            return (
              <div key={event.id}>
                {showSeparator && (
                  <p className="text-xs font-medium text-muted uppercase tracking-wider pt-2 pb-2 first:pt-0">
                    {fmtDaySeparator(dk)}
                  </p>
                )}
                <TimelineRow event={event} onOpen={setOpenEvent} onDelete={onDeleteEvent} />
              </div>
            );
          })}
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
