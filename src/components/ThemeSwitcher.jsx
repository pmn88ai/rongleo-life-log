// Shared between the quick-access button on Capture (operator: "cho giao
// diện ra ngoài màn hình chính") and Quản lý → Dữ liệu, so both stay in
// sync with a single implementation instead of two copies drifting apart.
export const THEMES = [
  { id: 'light', label: 'Sáng', swatch: '#fafaf9', ring: '#e7e5e4' },
  { id: 'dark', label: 'Tối', swatch: '#0c0a09', ring: '#57534e' },
  { id: 'luxury', label: 'Sang trọng', swatch: '#d4af37', ring: '#15120d' },
];

export function ThemeSwitcherGrid({ theme, onSetTheme }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {THEMES.map(t => (
        <button
          key={t.id}
          onClick={() => onSetTheme(t.id)}
          aria-pressed={theme === t.id}
          className={`flex flex-col items-center gap-2 py-3 rounded-2xl border-2 transition-all active:scale-95 ${
            theme === t.id ? 'border-ink bg-surface-alt' : 'border-default bg-surface hover:border-strong'}`}
        >
          <span
            className="w-7 h-7 rounded-full shadow-sm"
            style={{ backgroundColor: t.swatch, boxShadow: `inset 0 0 0 1.5px ${t.ring}` }}
            aria-hidden="true"
          />
          <span className={`text-xs font-medium ${theme === t.id ? 'text-primary' : 'text-secondary'}`}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}
