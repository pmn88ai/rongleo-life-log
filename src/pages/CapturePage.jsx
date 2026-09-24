import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { EmojiGlyph } from '../components/EmojiGlyph.jsx';
import { EventGrid } from '../components/EventGrid.jsx';
import { CaptureInputSheet } from '../components/CaptureInputSheet.jsx';
import { TimelineRow } from '../components/TimelineItem.jsx';
import { EventDetailModal } from '../components/EventDetailModal.jsx';
import { StorageModeBadge } from '../components/StorageModeBadge.jsx';
import { ThemeSwitcherGrid } from '../components/ThemeSwitcher.jsx';
import { Modal } from '../components/Modal.jsx';
import { getQuickGridDefinitions, getEventsForDay, sortByTimestampDesc } from '../domain/selectors.js';
import { quickLogEvent, createEvent } from '../domain/eventService.js';
import { fmtFullDate, todayKey } from '../utils/date.js';

const TODAY_STREAM_LIMIT = 15;

// Capture is the product, not a dashboard (spec v2.1 §4). This screen must
// answer "chuyện gì vừa xảy ra?" and prove — within the same screen — that
// tapping actually recorded something (§5 Today Stream, §12 feedback loop).
export function CapturePage({
  definitions, events, onAddEvent, onOpenAddEvent, onOpenManage, toast, onUndoEvent,
  onSaveEvent, onDeleteEvent, onGoToTimeline, theme, onSetTheme, onSyncNow,
}) {
  const [customizeTarget, setCustomizeTarget] = useState(null);
  const [openEvent, setOpenEvent] = useState(null);
  const [themeOpen, setThemeOpen] = useState(false);

  const quickGrid = useMemo(() => getQuickGridDefinitions(definitions, events), [definitions, events]);

  const todayEvents = useMemo(() => sortByTimestampDesc(getEventsForDay(events, todayKey())), [events]);
  const visibleTodayEvents = todayEvents.slice(0, TODAY_STREAM_LIMIT);

  function logAndToast(event, definition) {
    onAddEvent(event);
    toast(<><EmojiGlyph>{definition.emoji}</EmojiGlyph> {definition.name} đã ghi nhận</>, {
      action: { label: 'Hoàn tác', onClick: () => onUndoEvent(event.id) },
    });
  }

  function handleQuickLog(definition) {
    logAndToast(quickLogEvent(definition), definition);
  }

  function handleCustomize(definition) {
    setCustomizeTarget(definition);
  }

  function handleCustomSubmit(input) {
    const event = createEvent(customizeTarget, input);
    logAndToast(event, customizeTarget);
    setCustomizeTarget(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted tracking-widest uppercase mb-0.5">Quan Sát</p>
          <h1 className="text-2xl font-bold text-primary leading-snug">Chuyện gì vừa xảy ra?</h1>
          <p className="text-xs text-muted mt-1">
            {fmtFullDate(new Date())}{todayEvents.length > 0 ? ` · ${todayEvents.length} sự kiện hôm nay` : ''}
          </p>
          <div className="mt-1.5">
            <StorageModeBadge toast={toast} onSyncNow={onSyncNow} />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setThemeOpen(true)}
            aria-label="Đổi giao diện"
            className="w-11 h-11 rounded-full bg-surface border border-default text-secondary flex items-center justify-center hover:bg-app transition-all active:scale-95"
          >
            <Icon.theme />
          </button>
          <button
            onClick={onOpenManage}
            aria-label="Quản lý"
            className="w-11 h-11 rounded-full bg-surface border border-default text-secondary flex items-center justify-center hover:bg-app transition-all active:scale-95"
          >
            <Icon.settings />
          </button>
          <button
            onClick={onOpenAddEvent}
            aria-label="Ghi điều khác"
            className="w-11 h-11 rounded-full bg-ink text-on-ink flex items-center justify-center shadow-lg hover:bg-ink-hover transition-all active:scale-95"
          >
            <Icon.plus />
          </button>
        </div>
      </div>

      {quickGrid.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-4xl mb-3">🌱</p>
          <p className="text-sm">Chưa có gì hôm nay.<br />Một chạm để bắt đầu ghi lại cuộc sống.</p>
        </div>
      ) : (
        <EventGrid definitions={quickGrid} onQuickLog={handleQuickLog} onCustomize={handleCustomize} />
      )}

      <button
        onClick={onOpenAddEvent}
        className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl border-2 border-dashed border-default text-secondary text-sm font-medium hover:border-strong hover:bg-surface transition-all active:scale-95"
      >
        <Icon.plus className="w-4 h-4" /> Ghi điều khác
      </button>

      <div>
        <p className="text-xs text-muted tracking-widest uppercase mb-2.5">Hôm nay</p>
        {todayEvents.length === 0 ? (
          <div className="text-center py-10 text-muted">
            <p className="text-3xl mb-2">🌱</p>
            <p className="text-sm">Chưa có gì hôm nay.<br />Một chạm ở trên để bắt đầu.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleTodayEvents.map(event => (
              <TimelineRow key={event.id} event={event} onOpen={setOpenEvent} onDelete={onDeleteEvent} />
            ))}
            {todayEvents.length > TODAY_STREAM_LIMIT && (
              <button
                onClick={onGoToTimeline}
                className="w-full py-3 rounded-2xl border border-default bg-surface text-sm font-medium text-body hover:bg-app transition-all active:scale-95"
              >
                Xem tất cả trong Dòng thời gian →
              </button>
            )}
          </div>
        )}
      </div>

      {customizeTarget && (
        <CaptureInputSheet
          definition={customizeTarget}
          onClose={() => setCustomizeTarget(null)}
          onSubmit={handleCustomSubmit}
        />
      )}

      {openEvent && (
        <EventDetailModal
          event={openEvent}
          onClose={() => setOpenEvent(null)}
          onSave={(id, patch) => { onSaveEvent(id, patch); setOpenEvent(null); }}
          onDelete={(id) => { onDeleteEvent(id); setOpenEvent(null); }}
        />
      )}

      {themeOpen && (
        <Modal title="Giao diện" onClose={() => setThemeOpen(false)}>
          <ThemeSwitcherGrid theme={theme} onSetTheme={onSetTheme} />
        </Modal>
      )}
    </div>
  );
}
