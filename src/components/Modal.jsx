import { useEffect } from 'react';
import { Icon } from './Icon.jsx';

// A stack of currently-open overlays (Modal and FullScreenOverlay can both
// nest — e.g. the "⋯" action sheet opened from inside Quản lý). Each
// independently listening for Escape would ALL fire on one keypress and
// close every layer at once; instead there is exactly one document-level
// listener, and it only ever closes the most recently opened (topmost) one.
const closeStack = [];
if (typeof document !== 'undefined') {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && closeStack.length > 0) {
      closeStack[closeStack.length - 1]();
    }
  });
}

function useEscapeToClose(onClose) {
  useEffect(() => {
    closeStack.push(onClose);
    return () => {
      const idx = closeStack.lastIndexOf(onClose);
      if (idx !== -1) closeStack.splice(idx, 1);
    };
  }, [onClose]);
}

// Bottom-sheet on mobile, centered dialog on desktop — reused everywhere a
// screen needs to interrupt capture briefly (quantity, rating, detail, forms).
export function Modal({ title, onClose, children, maxW = 'sm:max-w-md' }) {
  useEscapeToClose(onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={`relative w-full ${maxW} bg-surface rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 pb-8 max-h-[85vh] overflow-y-auto safe-bottom animate-sheet-in sm:animate-fade-in`}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-primary text-lg">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="w-11 h-11 -m-2.5 flex items-center justify-center rounded-full text-muted hover:text-heading hover:bg-app transition-colors shrink-0"
          >
            <Icon.x />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Full-screen page overlay (Add Event, Manage) — same shell, no bottom-sheet
// affordance, meant to feel like a real screen rather than a small dialog.
export function FullScreenOverlay({ title, onClose, children, headerRight }) {
  useEscapeToClose(onClose);

  return (
    <div className="fixed inset-0 z-40 bg-app flex flex-col animate-fade-in">
      <div className="flex items-center justify-between px-2 py-2 border-b border-subtle bg-surface shrink-0">
        <button
          onClick={onClose}
          aria-label="Đóng"
          className="w-11 h-11 flex items-center justify-center rounded-full text-secondary hover:text-primary hover:bg-app transition-colors shrink-0"
        >
          <Icon.chevronLeft />
        </button>
        <h2 className="font-semibold text-primary">{title}</h2>
        <div className="w-11 h-11 flex items-center justify-center shrink-0">{headerRight}</div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-4 py-4 pb-24">{children}</div>
      </div>
    </div>
  );
}
