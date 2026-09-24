import { useState } from 'react';
import { Icon } from './Icon.jsx';
import { EmojiGlyph } from './EmojiGlyph.jsx';
import { StatisticCard } from './StatisticCard.jsx';
import { groupEventsByDefinition } from '../domain/selectors.js';
import { computeStatsForDefinition, summaryHeadline, inferDefinitionFromEvents } from '../domain/statistics.js';

// "Theo hoạt động" — the alternative to a flat chronological list on Dòng
// thời gian/Lịch (operator: "xem tập thể dục tổng hay tổng lượng nước uống
// trong ngày"): same events, grouped by which sự kiện they are, each row
// showing the aggregate for exactly the events passed in (a day, a filtered
// range — whatever the caller scopes it to), expandable into the same
// StatisticCard breakdown Thống kê uses, for one consistent definition of
// "tổng" everywhere in the app.
export function GroupedByActivity({ events, definitions, emptyMessage }) {
  const [openId, setOpenId] = useState(null);
  const groups = groupEventsByDefinition(events, definitions);

  if (groups.length === 0) {
    return (
      <div className="text-center py-8 text-muted">
        <p className="text-sm">{emptyMessage || 'Không có sự kiện nào.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {groups.map(group => {
        const definition = group.definition || inferDefinitionFromEvents(group.id, group.name, group.emoji, group.events);
        const stats = computeStatsForDefinition(definition, group.events);
        const isOpen = openId === group.id;
        const headline = summaryHeadline(stats);
        const suffix = stats.type === 'moment' ? '' : ` · ${group.events.length} lần`;
        return (
          <div key={group.id} className="bg-surface rounded-2xl border border-subtle shadow-sm overflow-hidden">
            <button
              onClick={() => setOpenId(isOpen ? null : group.id)}
              className="w-full text-left px-4 py-3 flex items-center gap-3"
            >
              <EmojiGlyph className="text-2xl leading-none">{group.emoji}</EmojiGlyph>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-primary">{group.name}</span>
                <p className="text-xs text-muted mt-0.5">{headline}{suffix}</p>
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
  );
}
