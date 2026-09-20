import { Icon } from './Icon.jsx';

export const NAV_ITEMS = [
  { id: 'capture', label: 'Ghi nhận', icon: Icon.capture },
  { id: 'timeline', label: 'Dòng thời gian', icon: Icon.timeline },
  { id: 'calendar', label: 'Lịch', icon: Icon.calendar },
  { id: 'stats', label: 'Thống kê', icon: Icon.stats },
];

export function BottomNav({ page, onNavigate }) {
  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden sm:flex fixed left-0 top-0 h-full w-56 bg-surface border-r border-subtle flex-col py-8 px-4 shadow-sm z-20">
        <div className="mb-8 px-2">
          <p className="text-xs text-muted tracking-widest uppercase">Ứng dụng</p>
          <h1 className="text-xl font-bold text-primary mt-0.5">Quan Sát</h1>
        </div>
        {NAV_ITEMS.map(n => (
          <button
            key={n.id}
            onClick={() => onNavigate(n.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition-all ${
              page === n.id ? 'bg-ink text-on-ink' : 'text-secondary hover:text-primary hover:bg-app'}`}
          >
            <n.icon />
            {n.label}
          </button>
        ))}
      </div>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-subtle flex z-20 safe-bottom">
        {NAV_ITEMS.map(n => (
          <button
            key={n.id}
            onClick={() => onNavigate(n.id)}
            aria-label={n.label}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all min-h-[44px] ${
              page === n.id ? 'text-primary-strong' : 'text-muted'}`}
          >
            <n.icon />
            <span className="text-[10px] font-medium">{n.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
