import { useState } from 'react';
import { Modal } from './Modal.jsx';
import { EmojiGlyph } from './EmojiGlyph.jsx';
import { RATING_SCALE, RATING_EMOJI } from '../domain/eventTypes.js';

function toLocalInputValue(iso) {
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventDetailModal({ event, onClose, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(event.value ?? '');
  const [rating, setRating] = useState(event.rating ?? null);
  const [note, setNote] = useState(event.note || '');
  const [timestamp, setTimestamp] = useState(toLocalInputValue(event.timestamp));
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isDuration = event.durationSeconds != null;
  const showsRatingEditor = event.rating != null;

  function handleSave() {
    const patch = { note, timestamp: new Date(timestamp).toISOString() };
    if (showsRatingEditor) {
      patch.rating = rating;
      patch.value = rating;
    } else if (event.value != null || isDuration) {
      const numeric = parseFloat(String(value).replace(',', '.'));
      if (!Number.isNaN(numeric)) {
        patch.value = numeric;
        if (isDuration) patch.durationSeconds = numeric * 60;
      }
    }
    onSave(event.id, patch);
    setEditing(false);
  }

  return (
    <Modal title={event.nameSnapshot} onClose={onClose}>
      <div className="text-center mb-2">
        <p className="text-5xl mb-2"><EmojiGlyph>{event.emojiSnapshot}</EmojiGlyph></p>
        <p className="text-lg font-semibold text-primary">{event.nameSnapshot}</p>
      </div>

      {!editing ? (
        <div className="space-y-4">
          <div className="bg-app rounded-2xl p-4 border border-subtle space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-secondary">Thời gian</span>
              <span className="font-medium text-primary">
                {new Date(event.timestamp).toLocaleDateString('vi-VN')} · {new Date(event.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {event.rating != null && (
              <div className="flex justify-between">
                <span className="text-secondary">Đánh giá</span>
                <span className="font-medium text-primary">{RATING_EMOJI[event.rating]} {event.rating}/5</span>
              </div>
            )}
            {event.rating == null && isDuration && (
              <div className="flex justify-between">
                <span className="text-secondary">Thời lượng</span>
                <span className="font-medium text-primary">{event.value} phút</span>
              </div>
            )}
            {event.rating == null && !isDuration && event.value != null && (
              <div className="flex justify-between">
                <span className="text-secondary">Giá trị</span>
                <span className="font-medium text-primary">{event.value}{event.unit ? ` ${event.unit}` : ''}</span>
              </div>
            )}
            {event.note && (
              <div className="pt-2 border-t border-subtle">
                <p className="text-secondary mb-0.5">Ghi chú</p>
                <p className="text-heading italic">{event.note}</p>
              </div>
            )}
          </div>

          {!confirmDelete ? (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setEditing(true)}
                className="py-3 rounded-xl border border-default text-heading text-sm font-medium hover:bg-app transition-all active:scale-95">
                Sửa
              </button>
              <button onClick={() => setConfirmDelete(true)}
                className="py-3 rounded-xl border border-rose-200 text-rose-500 text-sm font-medium hover:bg-rose-50 transition-all active:scale-95">
                Xóa
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-secondary text-center">Xóa sự kiện này? Không thể hoàn tác.</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setConfirmDelete(false)}
                  className="py-3 rounded-xl border border-default text-body text-sm font-medium">
                  Hủy
                </button>
                <button onClick={() => onDelete(event.id)}
                  className="py-3 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-all active:scale-95">
                  Xóa
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-secondary uppercase tracking-wider">Thời gian</label>
            <input
              type="datetime-local" value={timestamp} onChange={e => setTimestamp(e.target.value)}
              className="w-full mt-1.5 border border-default rounded-xl px-4 py-2.5 bg-surface text-sm focus:outline-none focus:border-focus"
            />
          </div>

          {showsRatingEditor && (
            <div>
              <label className="text-xs font-medium text-secondary uppercase tracking-wider">Đánh giá</label>
              <div className="flex justify-between gap-2 mt-1.5">
                {RATING_SCALE.map(v => (
                  <button key={v} onClick={() => setRating(v)}
                    className={`flex-1 py-2.5 rounded-xl border text-lg transition-all ${rating === v ? 'border-ink bg-ink text-on-ink' : 'border-default bg-app'}`}>
                    {RATING_EMOJI[v]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!showsRatingEditor && (event.value != null || isDuration) && (
            <div>
              <label className="text-xs font-medium text-secondary uppercase tracking-wider">
                {isDuration ? 'Thời lượng (phút)' : `Giá trị ${event.unit ? `(${event.unit})` : ''}`}
              </label>
              <input
                type="number" inputMode="decimal" value={value} onChange={e => setValue(e.target.value)}
                className="w-full mt-1.5 border border-default rounded-xl px-4 py-2.5 bg-surface text-sm focus:outline-none focus:border-focus"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-secondary uppercase tracking-wider">Ghi chú</label>
            <input
              value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú (tuỳ chọn)"
              className="w-full mt-1.5 border border-default rounded-xl px-4 py-2.5 bg-surface text-sm focus:outline-none focus:border-focus"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button onClick={() => setEditing(false)} className="py-3 rounded-xl border border-default text-body text-sm font-medium">
              Hủy
            </button>
            <button onClick={handleSave} className="py-3 rounded-xl bg-ink text-on-ink text-sm font-medium hover:bg-ink-hover transition-all active:scale-95">
              Lưu thay đổi
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
