import { useState } from 'react';
import { Modal } from './Modal.jsx';
import { CATEGORIES } from '../data/categories.js';
import { EVENT_TYPE_LIST, EVENT_TYPE_LABELS, EVENT_TYPE_HINTS, EVENT_TYPES } from '../domain/eventTypes.js';

const COMMON_EMOJIS = ['✨', '🤝', '📌', '🎯', '📍', '🧩', '🛠️', '🗒️', '🔔', '🧭', '🪄', '🎈'];

// Custom event creation (spec §15). The user picks a friendly type label —
// they're never shown the word "type system".
export function CustomEventForm({ onClose, onSubmit, initial }) {
  const [name, setName] = useState(initial?.name || '');
  const [emoji, setEmoji] = useState(initial?.emoji || '✨');
  const [category, setCategory] = useState(initial?.category || 'other');
  const [type, setType] = useState(initial?.type || EVENT_TYPES.MOMENT);
  const [unit, setUnit] = useState(initial?.unit || '');
  const [defaultValue, setDefaultValue] = useState(initial?.defaultValue ?? '');

  const needsUnit = type === EVENT_TYPES.COUNT || type === EVENT_TYPES.MEASUREMENT;
  const needsDefault = type === EVENT_TYPES.COUNT || type === EVENT_TYPES.DURATION;

  function handleSubmit() {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      emoji,
      category,
      type,
      unit: needsUnit ? (unit.trim() || null) : (type === EVENT_TYPES.DURATION ? 'phút' : null),
      defaultValue: needsDefault ? (Number(defaultValue) || (type === EVENT_TYPES.DURATION ? 30 : 1)) : null,
    });
  }

  return (
    <Modal title={initial?.id ? 'Sửa sự kiện' : 'Tạo sự kiện mới'} onClose={onClose} maxW="sm:max-w-lg">
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="w-20 shrink-0">
            <label className="text-xs font-medium text-secondary uppercase tracking-wider">Emoji</label>
            <input
              value={emoji} onChange={e => setEmoji(e.target.value.slice(0, 4))}
              className="w-full mt-1.5 border border-default rounded-xl px-2 py-3 bg-surface text-2xl text-center focus:outline-none focus:border-focus"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-secondary uppercase tracking-wider">Tên sự kiện</label>
            <input
              autoFocus value={name} onChange={e => setName(e.target.value)}
              placeholder="Ví dụ: Đi gặp khách"
              className="w-full mt-1.5 border border-default rounded-xl px-4 py-3 bg-surface text-sm text-primary placeholder-faint focus:outline-none focus:border-focus"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {COMMON_EMOJIS.map(e => (
            <button key={e} type="button" onClick={() => setEmoji(e)}
              className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition-all ${
                emoji === e ? 'border-ink bg-surface-alt' : 'border-default bg-surface'}`}>
              {e}
            </button>
          ))}
        </div>

        <div>
          <label className="text-xs font-medium text-secondary uppercase tracking-wider">Nhóm</label>
          <select
            value={category} onChange={e => setCategory(e.target.value)}
            className="w-full mt-1.5 border border-default rounded-xl px-4 py-3 bg-surface text-sm text-primary focus:outline-none focus:border-focus"
          >
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-secondary uppercase tracking-wider">Kiểu ghi nhận</label>
          <div className="grid grid-cols-1 gap-1.5 mt-1.5">
            {EVENT_TYPE_LIST.map(t => (
              <button
                key={t} type="button" onClick={() => setType(t)}
                className={`text-left px-4 py-2.5 rounded-xl border text-sm transition-all ${
                  type === t ? 'border-ink bg-app' : 'border-default bg-surface text-body'}`}
              >
                <span className="font-medium text-primary">{EVENT_TYPE_LABELS[t]}</span>
                <span className="block text-xs text-muted mt-0.5">{EVENT_TYPE_HINTS[t]}</span>
              </button>
            ))}
          </div>
        </div>

        {(needsUnit || needsDefault) && (
          <div className="flex gap-2">
            {needsUnit && (
              <div className="flex-1">
                <label className="text-xs font-medium text-secondary uppercase tracking-wider">Đơn vị</label>
                <input
                  value={unit} onChange={e => setUnit(e.target.value)} placeholder="ml, viên, kg…"
                  className="w-full mt-1.5 border border-default rounded-xl px-4 py-2.5 bg-surface text-sm focus:outline-none focus:border-focus"
                />
              </div>
            )}
            {needsDefault && (
              <div className="w-28">
                <label className="text-xs font-medium text-secondary uppercase tracking-wider">Mặc định</label>
                <input
                  type="number" value={defaultValue} onChange={e => setDefaultValue(e.target.value)}
                  placeholder={type === EVENT_TYPES.DURATION ? '30' : '1'}
                  className="w-full mt-1.5 border border-default rounded-xl px-4 py-2.5 bg-surface text-sm focus:outline-none focus:border-focus"
                />
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="w-full bg-ink text-on-ink font-medium py-3 rounded-xl hover:bg-ink-hover transition-all active:scale-95 disabled:opacity-30"
        >
          Lưu
        </button>
      </div>
    </Modal>
  );
}
