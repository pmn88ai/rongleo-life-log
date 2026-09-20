import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { EmojiGlyph } from '../components/EmojiGlyph.jsx';
import { StatisticCard } from '../components/StatisticCard.jsx';
import { filterEventsByRange } from '../domain/selectors.js';
import { computeStatsForDefinition } from '../domain/statistics.js';

const RANGES = [
  { id: '7d', label: '7 ngày' },
  { id: '30d', label: '30 ngày' },
  { id: '90d', label: '90 ngày' },
  { id: 'all', label: 'Tất cả' },
];

function summaryHeadline(stats) {
  switch (stats.type) {
    case 'moment': return `${stats.total} lần`;
    case 'count': return `${stats.total} ${stats.unit || ''}`.trim();
    case 'duration': return `${stats.totalMinutes} phút`;
    case 'measurement': return stats.latest != null ? `${stats.latest} ${stats.unit || ''}`.trim() : 'Chưa có dữ liệu';
    case 'rating': return stats.average != null ? `TB ${stats.average}/5` : 'Chưa có dữ liệu';
    default: return '';
  }
}

export function StatisticsPage({ definitions, events }) {
  const [range, setRange] = useState('7d');
  const [openId, setOpenId] = useState(null);

  const rangedEvents = useMemo(() => filterEventsByRange(events, range), [events, range]);

  const rows = useMemo(() => {
    const activeDefs = definitions.filter(d => d.active);
    return activeDefs
      .map(def => {
        const defEvents = rangedEvents.filter(e => e.eventDefinitionId === def.id);
        return { definition: def, events: defEvents, stats: computeStatsForDefinition(def, defEvents) };
      })
      .filter(row => row.events.length > 0)
      .sort((a, b) => b.events.length - a.events.length);
  }, [definitions, rangedEvents]);

  if (events.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs text-muted tracking-widest uppercase mb-0.5">Nhịp sống của bạn</p>
          <h1 className="text-xl font-bold text-primary">Thống kê</h1>
        </div>
        <div className="text-center py-16 text-muted">
          <p className="text-3xl mb-2">📊</p>
          <p className="text-sm">Chưa đủ dữ liệu.<br />Ghi nhận vài ngày để bắt đầu thấy nhịp sống của bạn.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted tracking-widest uppercase mb-0.5">Nhịp sống của bạn</p>
        <h1 className="text-xl font-bold text-primary">Thống kê</h1>
      </div>

      <div className="flex gap-2">
        {RANGES.map(r => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
              range === r.id ? 'bg-ink text-on-ink border-ink' : 'bg-surface border-default text-secondary'}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <p className="text-3xl mb-2">📊</p>
          <p className="text-sm">Không có dữ liệu trong khoảng thời gian này.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map(({ definition, stats }) => {
            const isOpen = openId === definition.id;
            return (
              <div key={definition.id} className="bg-surface rounded-2xl border border-subtle shadow-sm overflow-hidden">
                <button
                  onClick={() => setOpenId(isOpen ? null : definition.id)}
                  className="w-full text-left px-4 py-3 flex items-center gap-3"
                >
                  <EmojiGlyph className="text-2xl leading-none">{definition.emoji}</EmojiGlyph>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-primary">{definition.name}</span>
                    <p className="text-xs text-muted mt-0.5">{summaryHeadline(stats)}</p>
                  </div>
                  <Icon.chevronDown className={`w-4 h-4 text-muted transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 border-t border-subtle pt-3">
                    <StatisticCard definition={definition} stats={stats} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
