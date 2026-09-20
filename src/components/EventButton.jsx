import { useRef } from 'react';
import { EVENT_TYPES } from '../domain/eventTypes.js';
import { EmojiGlyph } from './EmojiGlyph.jsx';
import { Icon } from './Icon.jsx';

const LONG_PRESS_MS = 500;
const MOVE_CANCEL_PX = 10;

// One tile in the Quick Log grid. Behavior per type (spec §4, §7):
//  - moment: tap logs instantly.
//  - count/duration: tap logs the default value instantly; a long-press
//    opens the customize sheet instead of forcing a modal on everyone.
//  - measurement/rating: tap opens the input sheet (no sensible "default").
//
// One-tap logging must never be blocked by the long-press affordance, so a
// tap that turns into a scroll/drag (finger moves, or the browser cancels
// the pointer for its own gesture recognition) cancels the timer instead of
// firing customize, and a fired long-press always suppresses the trailing
// click so a single physical press can never log twice.
export function EventButton({ definition, onQuickLog, onCustomize }) {
  const timerRef = useRef(null);
  const firedLongPressRef = useRef(false);
  const startPosRef = useRef(null);

  const needsInput = definition.type === EVENT_TYPES.MEASUREMENT || definition.type === EVENT_TYPES.RATING;
  const supportsLongPress = definition.type === EVENT_TYPES.COUNT || definition.type === EVENT_TYPES.DURATION;

  function clearTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPosRef.current = null;
  }

  function handlePointerDown(e) {
    if (!supportsLongPress) return;
    firedLongPressRef.current = false;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    timerRef.current = setTimeout(() => {
      firedLongPressRef.current = true;
      timerRef.current = null;
      onCustomize(definition);
    }, LONG_PRESS_MS);
  }

  function handlePointerMove(e) {
    if (!timerRef.current || !startPosRef.current) return;
    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;
    if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) clearTimer();
  }

  function handleClick() {
    if (firedLongPressRef.current) {
      firedLongPressRef.current = false;
      return;
    }
    if (needsInput) onCustomize(definition);
    else onQuickLog(definition);
  }

  return (
    <button
      type="button"
      aria-label={definition.name}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={clearTimer}
      onPointerCancel={clearTimer}
      onPointerLeave={clearTimer}
      onContextMenu={(e) => e.preventDefault()}
      onClick={handleClick}
      style={{ touchAction: 'manipulation', WebkitTouchCallout: 'none' }}
      className="relative flex flex-col items-center justify-center gap-1.5 bg-surface rounded-2xl shadow-sm border border-subtle py-4 px-2 min-h-[88px] active:scale-95 transition-transform select-none"
    >
      {supportsLongPress && (
        <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-surface-alt2" aria-hidden="true" />
      )}
      {definition.favorite && (
        <Icon.star filled className="absolute top-2 left-2 w-3 h-3 text-amber-400" aria-hidden="true" />
      )}
      <EmojiGlyph className="text-[32px] leading-none">{definition.emoji}</EmojiGlyph>
      <span className="text-xs font-medium text-heading text-center leading-tight line-clamp-2">{definition.name}</span>
    </button>
  );
}
