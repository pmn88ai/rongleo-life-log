import { useCallback, useState } from 'react';
import { uid } from '../utils/id.js';

// Small temporary confirmations, with an optional "Hoàn tác" (undo) action —
// rapid quick-logging increases accidental taps, so undo matters (spec §19).
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts(p => p.filter(t => t.id !== id));
  }, []);

  const push = useCallback((message, { type = 'success', action, duration = 4000 } = {}) => {
    const id = uid();
    setToasts(p => [...p, { id, message, type, action }]);
    if (duration) setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  return { toasts, push, dismiss };
}

export function ToastHost({ toasts, dismiss }) {
  return (
    <div className="fixed left-0 right-0 bottom-20 sm:bottom-6 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`pointer-events-auto max-w-sm w-full sm:w-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium text-white animate-slide-in
            ${t.type === 'error' ? 'bg-rose-500' : t.type === 'warn' ? 'bg-amber-500' : 'bg-stone-800'}`}
        >
          <span className="flex-1">{t.message}</span>
          {t.action && (
            <button
              onClick={() => { t.action.onClick(); dismiss(t.id); }}
              className="shrink-0 font-semibold underline underline-offset-2"
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
