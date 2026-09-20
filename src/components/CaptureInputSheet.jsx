import { useState } from 'react';
import { Modal } from './Modal.jsx';
import { EmojiGlyph } from './EmojiGlyph.jsx';
import {
  COUNT_QUICK_PRESETS_VOLUME, COUNT_QUICK_PRESETS_SMALL, isVolumeUnit,
  DURATION_QUICK_PRESETS, RATING_SCALE, RATING_EMOJI, EVENT_TYPES,
} from '../domain/eventTypes.js';

// The "customize" path: long-press on a count/duration tile, or a direct
// tap on measurement/rating tiles that have no sensible one-tap default.
export function CaptureInputSheet({ definition, onClose, onSubmit }) {
  const isCount = definition.type === EVENT_TYPES.COUNT;
  const isDuration = definition.type === EVENT_TYPES.DURATION;
  const isMeasurement = definition.type === EVENT_TYPES.MEASUREMENT;
  const isRating = definition.type === EVENT_TYPES.RATING;

  const [qty, setQty] = useState(String(definition.defaultValue ?? ''));
  const [note, setNote] = useState('');
  const [measurement, setMeasurement] = useState('');
  const [rating, setRating] = useState(null);

  const presets = isDuration
    ? DURATION_QUICK_PRESETS
    : isVolumeUnit(definition.unit) ? COUNT_QUICK_PRESETS_VOLUME : COUNT_QUICK_PRESETS_SMALL;

  function submitQuantity(value) {
    if (isDuration) onSubmit({ value, durationSeconds: value * 60, note });
    else onSubmit({ value, note });
  }

  function submitMeasurement() {
    const v = parseFloat(String(measurement).replace(',', '.'));
    if (Number.isNaN(v)) return;
    onSubmit({ value: v, note });
  }

  function submitRating() {
    if (rating == null) return;
    onSubmit({ value: rating, rating, note });
  }

  return (
    <Modal title={<><EmojiGlyph>{definition.emoji}</EmojiGlyph> {definition.name}</>} onClose={onClose}>
      {(isCount || isDuration) && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {presets.map(p => (
              <button
                key={p}
                onClick={() => submitQuantity(p)}
                className="py-3 rounded-xl border border-default bg-app hover:bg-surface-alt text-sm font-medium text-heading transition-all active:scale-95"
              >
                {isDuration ? `${p} phút` : `${p} ${definition.unit || ''}`}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              inputMode="decimal" type="number" min="0" value={qty} onChange={e => setQty(e.target.value)}
              placeholder={isDuration ? 'Số phút' : `Số ${definition.unit || ''}`}
              className="w-28 border border-default rounded-xl px-3 py-2.5 text-sm bg-app focus:outline-none focus:border-focus"
            />
            <input
              value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú (tuỳ chọn)"
              className="flex-1 border border-default rounded-xl px-3 py-2.5 text-sm bg-app focus:outline-none focus:border-focus"
            />
          </div>
          <button
            onClick={() => { const v = parseFloat(String(qty).replace(',', '.')); if (v > 0) submitQuantity(v); }}
            disabled={!(parseFloat(qty) > 0)}
            className="w-full bg-ink text-on-ink text-sm font-medium py-3 rounded-xl hover:bg-ink-hover transition-all active:scale-95 disabled:opacity-30"
          >
            Ghi nhận
          </button>
        </div>
      )}

      {isMeasurement && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-secondary uppercase tracking-wider">
              Giá trị {definition.unit ? `(${definition.unit})` : ''}
            </label>
            <input
              autoFocus inputMode="decimal" type="number" value={measurement} onChange={e => setMeasurement(e.target.value)}
              placeholder="Nhập số đo"
              className="w-full mt-1.5 border border-default rounded-xl px-4 py-3 bg-surface text-lg font-semibold text-primary focus:outline-none focus:border-focus"
            />
          </div>
          <input
            value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú (tuỳ chọn)"
            className="w-full border border-default rounded-xl px-4 py-2.5 text-sm bg-app focus:outline-none focus:border-focus"
          />
          <button
            onClick={submitMeasurement}
            disabled={String(measurement).trim() === ''}
            className="w-full bg-ink text-on-ink text-sm font-medium py-3 rounded-xl hover:bg-ink-hover transition-all active:scale-95 disabled:opacity-30"
          >
            Ghi nhận
          </button>
        </div>
      )}

      {isRating && (
        <div className="space-y-4">
          <div className="flex justify-between gap-2">
            {RATING_SCALE.map(v => (
              <button
                key={v} onClick={() => setRating(v)} aria-label={`Mức ${v}`}
                className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border transition-all active:scale-95 ${
                  rating === v ? 'border-ink bg-ink text-on-ink' : 'border-default bg-app text-body'}`}
              >
                <span className="text-2xl">{RATING_EMOJI[v]}</span>
                <span className="text-xs font-medium">{v}</span>
              </button>
            ))}
          </div>
          <input
            value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú (tuỳ chọn)"
            className="w-full border border-default rounded-xl px-4 py-2.5 text-sm bg-app focus:outline-none focus:border-focus"
          />
          <button
            onClick={submitRating}
            disabled={rating == null}
            className="w-full bg-ink text-on-ink text-sm font-medium py-3 rounded-xl hover:bg-ink-hover transition-all active:scale-95 disabled:opacity-30"
          >
            Ghi nhận
          </button>
        </div>
      )}
    </Modal>
  );
}
