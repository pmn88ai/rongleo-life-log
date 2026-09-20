import { Icon } from './Icon.jsx';
import { getMonthGrid, todayKey } from '../utils/date.js';

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export function CalendarGrid({ year, month, countsByDay, selectedKey, onSelect, onPrevMonth, onNextMonth }) {
  const weeks = getMonthGrid(year, month);
  const today = todayKey();

  return (
    <div className="bg-surface rounded-2xl border border-subtle shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={onPrevMonth}
          aria-label="Tháng trước"
          className="w-11 h-11 -m-1 flex items-center justify-center rounded-full text-muted hover:text-primary hover:bg-app transition-colors shrink-0"
        >
          <Icon.chevronLeft />
        </button>
        <p className="text-sm font-semibold text-primary">Tháng {month + 1}, {year}</p>
        <button
          onClick={onNextMonth}
          aria-label="Tháng sau"
          className="w-11 h-11 -m-1 flex items-center justify-center rounded-full text-muted hover:text-primary hover:bg-app transition-colors shrink-0"
        >
          <Icon.chevronRight />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_LABELS.map(w => (
          <div key={w} className="text-center text-[10px] font-medium text-muted py-1">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {weeks.flat().map(cell => {
          const count = countsByDay.get(cell.dateKey) || 0;
          const isSelected = cell.dateKey === selectedKey;
          const isToday = cell.dateKey === today;
          return (
            <button
              key={cell.dateKey}
              onClick={() => onSelect(cell.dateKey)}
              disabled={!cell.inMonth}
              className={`aspect-square flex flex-col items-center justify-center gap-0.5 rounded-xl mx-auto w-full text-xs transition-all
                ${!cell.inMonth ? 'text-transparent pointer-events-none' :
                  isSelected ? 'bg-ink text-on-ink font-semibold' :
                  isToday ? 'bg-surface-alt text-primary font-semibold' : 'text-body hover:bg-app'}`}
            >
              <span>{cell.date.getDate()}</span>
              {count > 0 && (
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-surface' : 'bg-amber-500'}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
