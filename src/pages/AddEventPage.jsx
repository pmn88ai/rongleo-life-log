import { useMemo, useState } from 'react';
import { FullScreenOverlay } from '../components/Modal.jsx';
import { CustomEventForm } from '../components/CustomEventForm.jsx';
import { CaptureInputSheet } from '../components/CaptureInputSheet.jsx';
import { Icon } from '../components/Icon.jsx';
import { EmojiGlyph } from '../components/EmojiGlyph.jsx';
import { EVENT_LIBRARY } from '../data/eventLibrary.js';
import { CATEGORIES } from '../data/categories.js';
import { searchDefinitions, getRecentDefinitionIds } from '../domain/selectors.js';
import { quickLogEvent, createEvent } from '../domain/eventService.js';
import { EVENT_TYPES } from '../domain/eventTypes.js';

const PREVIEW_COUNT = 8;

function LibraryTile({ entry, isActive, onPick }) {
  return (
    <button
      type="button"
      aria-label={entry.name}
      onClick={() => onPick(entry)}
      className="relative flex flex-col items-center justify-center gap-1.5 bg-surface rounded-2xl border border-subtle py-3.5 px-2 min-h-[84px] active:scale-95 transition-transform"
    >
      {isActive && (
        <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
          <Icon.check className="w-2.5 h-2.5" />
        </span>
      )}
      <EmojiGlyph className="text-2xl leading-none">{entry.emoji}</EmojiGlyph>
      <span className="text-[11px] font-medium text-heading text-center leading-tight line-clamp-2">{entry.name}</span>
    </button>
  );
}

export function AddEventPage({
  definitions, events, onClose,
  onActivateLibraryEntry, onCreateCustomDefinition,
  onAddEvent, onUndoEvent, toast,
  // Opened from Capture: picking something logs it immediately (spec v2.1
  // Test 3, ≤10s). Opened from Quản lý → Sự kiện: same browse/search/create
  // screen, but picking only adds the definition to your list — it's the
  // one shared "find or create an event type" flow used everywhere in the
  // app, just with a different outcome at the end.
  autoLog = true,
  title = 'Ghi điều khác',
}) {
  const [query, setQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [pendingDefinition, setPendingDefinition] = useState(null);

  const activeIds = useMemo(() => new Set(definitions.map(d => d.id)), [definitions]);
  const recentIds = useMemo(() => getRecentDefinitionIds(events, 8), [events]);
  const recentLibraryEntries = useMemo(
    () => recentIds.map(id => EVENT_LIBRARY.find(e => e.id === id)).filter(Boolean),
    [recentIds]
  );

  const searchResults = useMemo(
    () => (query.trim() ? searchDefinitions(EVENT_LIBRARY, query) : []),
    [query]
  );

  const byCategory = useMemo(() => {
    const map = new Map();
    for (const c of CATEGORIES) map.set(c.id, []);
    for (const entry of EVENT_LIBRARY) {
      if (!map.has(entry.category)) map.set(entry.category, []);
      map.get(entry.category).push(entry);
    }
    return map;
  }, []);

  function logAndClose(event, definition) {
    onAddEvent(event);
    toast(<><EmojiGlyph>{definition.emoji}</EmojiGlyph> {definition.name} đã ghi nhận</>, {
      action: { label: 'Hoàn tác', onClick: () => onUndoEvent(event.id) },
    });
    onClose();
  }

  function proceedWithDefinition(definition) {
    if (!autoLog) {
      toast(<><EmojiGlyph>{definition.emoji}</EmojiGlyph> Đã thêm "{definition.name}"</>);
      onClose();
      return;
    }
    if (definition.type === EVENT_TYPES.MEASUREMENT || definition.type === EVENT_TYPES.RATING) {
      setPendingDefinition(definition);
    } else {
      logAndClose(quickLogEvent(definition), definition);
    }
  }

  function handlePick(entry) {
    const definition = onActivateLibraryEntry(entry);
    proceedWithDefinition(definition);
  }

  function handleCustomSubmit(data) {
    const definition = onCreateCustomDefinition(data);
    setShowCustomForm(false);
    proceedWithDefinition(definition);
  }

  const isSearching = query.trim().length > 0;

  return (
    <FullScreenOverlay title={title} onClose={onClose}>
      <div className="relative mb-5">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"><Icon.search /></span>
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Tìm sự kiện... (tiếng Việt hoặc English)"
          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-default bg-surface text-sm focus:outline-none focus:border-focus"
        />
      </div>

      {isSearching ? (
        <div className="space-y-4">
          {searchResults.length === 0 ? (
            <div className="text-center py-10 text-muted">
              <p className="text-3xl mb-2">🔎</p>
              <p className="text-sm">Không tìm thấy sự kiện.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {searchResults.map(entry => (
                <LibraryTile key={entry.id} entry={entry} isActive={activeIds.has(entry.id)} onPick={handlePick} />
              ))}
            </div>
          )}
          <button
            onClick={() => setShowCustomForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-default text-secondary text-sm font-medium hover:border-strong hover:bg-app transition-all"
          >
            <Icon.plus className="w-4 h-4" /> Tạo "{query.trim()}" làm sự kiện mới
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {recentLibraryEntries.length > 0 && (
            <div>
              <p className="text-xs text-muted tracking-widest uppercase mb-2.5">Gần đây</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {recentLibraryEntries.map(entry => (
                  <LibraryTile key={entry.id} entry={entry} isActive={activeIds.has(entry.id)} onPick={handlePick} />
                ))}
              </div>
            </div>
          )}

          {CATEGORIES.map(cat => {
            const items = byCategory.get(cat.id) || [];
            if (items.length === 0) return null;
            const expanded = expandedCategory === cat.id;
            const shown = expanded ? items : items.slice(0, PREVIEW_COUNT);
            return (
              <div key={cat.id}>
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-xs text-muted tracking-widest uppercase">{cat.emoji} {cat.name}</p>
                  {items.length > PREVIEW_COUNT && (
                    <button
                      onClick={() => setExpandedCategory(expanded ? null : cat.id)}
                      className="text-xs font-medium text-secondary hover:text-primary"
                    >
                      {expanded ? 'Thu gọn' : `Xem tất cả (${items.length})`}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {shown.map(entry => (
                    <LibraryTile key={entry.id} entry={entry} isActive={activeIds.has(entry.id)} onPick={handlePick} />
                  ))}
                </div>
              </div>
            );
          })}

          <button
            onClick={() => setShowCustomForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-default text-secondary text-sm font-medium hover:border-strong hover:bg-app transition-all"
          >
            <Icon.plus className="w-4 h-4" /> Tạo sự kiện mới
          </button>
        </div>
      )}

      {showCustomForm && (
        <CustomEventForm
          onClose={() => setShowCustomForm(false)}
          onSubmit={handleCustomSubmit}
          initial={isSearching ? { name: query.trim() } : null}
        />
      )}

      {pendingDefinition && (
        <CaptureInputSheet
          definition={pendingDefinition}
          onClose={() => { setPendingDefinition(null); onClose(); }}
          onSubmit={(input) => logAndClose(createEvent(pendingDefinition, input), pendingDefinition)}
        />
      )}
    </FullScreenOverlay>
  );
}
