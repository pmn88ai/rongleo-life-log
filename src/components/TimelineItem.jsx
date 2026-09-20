import { useState } from 'react';
import { fmtTime, minutesToLabel } from '../utils/date.js';
import { EmojiGlyph } from './EmojiGlyph.jsx';
import { Icon } from './Icon.jsx';
import { Modal } from './Modal.jsx';
import { RATING_EMOJI } from '../domain/eventTypes.js';

export function eventValueLabel(event) {
  if (event.rating != null) return `${RATING_EMOJI[event.rating] || ''} ${event.rating}/5`;
  if (event.durationSeconds != null) return minutesToLabel(event.durationSeconds / 60);
  if (event.value != null) return `${event.value}${event.unit ? ' ' + event.unit : ''}`;
  return null;
}

// `onDelete` is optional so existing call sites keep working without it,
// but every list that renders this row passes it (operator: bấm nhầm hay
// duplicate mà không xóa được — a trash icon right on the row, not buried
// inside the detail modal, is the fix). Still confirms via an in-app Modal,
// never native confirm() (see feedback_opencode... same lesson as before:
// destructive actions always confirm through the app, not the browser).
export function TimelineRow({ event, onOpen, onDelete }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const valueLabel = eventValueLabel(event);
  return (
    <>
      <div className="w-full bg-surface rounded-2xl px-4 py-3 shadow-sm border border-subtle flex items-center gap-3">
        <button
          onClick={() => onOpen(event)}
          className="flex-1 min-w-0 flex items-start gap-3 text-left active:scale-[0.99] transition-transform"
        >
          <EmojiGlyph className="text-2xl leading-none mt-0.5">{event.emojiSnapshot}</EmojiGlyph>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-sm font-medium text-primary">{event.nameSnapshot}</span>
              {valueLabel && <span className="text-xs text-muted">· {valueLabel}</span>}
            </div>
            {event.note && <p className="text-xs text-muted mt-0.5 italic truncate">{event.note}</p>}
          </div>
          <span className="text-xs text-muted font-mono shrink-0 mt-0.5">{fmtTime(event.timestamp)}</span>
        </button>
        {onDelete && (
          <button
            onClick={() => setConfirmOpen(true)}
            aria-label="Xóa sự kiện"
            className="w-9 h-9 -my-1 -mr-1 shrink-0 flex items-center justify-center rounded-lg text-muted hover:text-rose-500 hover:bg-app transition-colors"
          >
            <Icon.trash />
          </button>
        )}
      </div>

      {confirmOpen && (
        <Modal title="Xóa sự kiện" onClose={() => setConfirmOpen(false)}>
          <div className="space-y-4">
            <p className="text-sm text-body">
              Xóa "<strong>{event.nameSnapshot}</strong>" lúc {fmtTime(event.timestamp)}? Không thể hoàn tác.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="py-3 rounded-xl border border-default text-body text-sm font-medium"
              >
                Hủy
              </button>
              <button
                onClick={() => { onDelete(event.id); setConfirmOpen(false); }}
                className="py-3 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-all active:scale-95"
              >
                Xóa
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
