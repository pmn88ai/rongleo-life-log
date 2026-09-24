import { useEffect, useRef, useState } from 'react';
import { BottomNav } from '../components/BottomNav.jsx';
import { ToastHost, useToast } from '../components/Toast.jsx';
import { Onboarding } from '../components/Onboarding.jsx';
import { CapturePage } from '../pages/CapturePage.jsx';
import { TimelinePage } from '../pages/TimelinePage.jsx';
import { CalendarPage } from '../pages/CalendarPage.jsx';
import { StatisticsPage } from '../pages/StatisticsPage.jsx';
import { AddEventPage } from '../pages/AddEventPage.jsx';
import { ManagePage } from '../pages/ManagePage.jsx';
import { LocalCloudMigrationModal } from '../components/LocalCloudMigrationModal.jsx';
import { loadState, saveState, STORAGE_KEY } from '../storage/storage.js';
import { downloadExport, mergeStates, replaceState } from '../storage/exportImport.js';
import { createDefinitionFromLibrary, createCustomDefinition, updateEvent } from '../domain/eventService.js';
import { getStarterDefinitions } from '../data/seed.js';
import { eventRepository } from '../storage/eventRepository.js';
import { cloudRepository } from '../storage/cloudRepository.js';
import { syncQueue } from '../storage/syncQueue.js';
import { planCloudSync, mergeLocalAndCloud, mergeCloudDown, stripDeleted } from '../domain/cloudSync.js';
import { AuthProvider, useAuth } from '../auth/AuthProvider.jsx';
import { uid } from '../utils/id.js';

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

function AppShell() {
  const [state, setState] = useState(() => loadState());
  const [page, setPage] = useState('capture');
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [manageAddOpen, setManageAddOpen] = useState(false);
  const [migrationPlan, setMigrationPlan] = useState(null);
  const { toasts, push: toast, dismiss } = useToast();
  const { status, session, justSignedIn, clearJustSignedIn } = useAuth();
  const userId = status === 'authenticated' ? session?.user?.id : null;

  useEffect(() => { saveState(state); }, [state]);

  // 3 chế độ giao diện (CLAUDE.md UI preferences): Sáng / Tối / Sang trọng.
  // `data-theme` on <html> drives the CSS variables in index.css; 'light'
  // is the :root default so setting it explicitly is a no-op visually but
  // keeps the DOM state unambiguous.
  const theme = state.settings?.theme || 'light';
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.content = getComputedStyle(document.documentElement).getPropertyValue('--color-app').trim() || '#fafaf9';
    }
  }, [theme]);
  function handleSetTheme(next) {
    setState(s => ({ ...s, settings: { ...s.settings, theme: next } }));
  }

  // App state is only read from localStorage once, on mount — with no
  // cross-tab sync, a second tab/window of the app (or the same tab left
  // open across a long session) silently drifts from whatever the most
  // recently active tab last saved, showing stale definitions/events that
  // look "inconsistent" even though there's only ever one source of truth
  // on disk. Re-sync whenever another tab writes to our key (storage event,
  // fired in every OTHER tab, never the one that wrote) or this tab regains
  // focus (covers cases where the storage event doesn't fire reliably).
  useEffect(() => {
    function syncFromDisk() {
      const fresh = loadState();
      setState(prev => (JSON.stringify(fresh) === JSON.stringify(prev) ? prev : fresh));
    }
    function handleStorage(e) {
      if (e.key === null || e.key === STORAGE_KEY) syncFromDisk();
    }
    function handleVisibility() {
      if (document.visibilityState === 'visible') syncFromDisk();
    }
    window.addEventListener('storage', handleStorage);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', syncFromDisk);
    return () => {
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', syncFromDisk);
    };
  }, []);

  useEffect(() => {
    if (state.migratedFromLegacy) {
      toast('Đã chuyển dữ liệu từ phiên bản cũ sang Quan Sát mới ✓', { duration: 6000 });
      setState(s => { const { migratedFromLegacy, ...rest } = s; return rest; });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Right after a FRESH login (not a session merely restored on reload —
  // see justSignedIn in AuthProvider) compare local vs cloud and offer the
  // merge/restore screen exactly once (spec v2.2 §20/§21).
  useEffect(() => {
    if (!justSignedIn || !userId) return;
    let cancelled = false;
    cloudRepository.fetchAll(userId).then(rawCloud => {
      if (cancelled) return;
      // stripDeleted here too (not just inside planCloudSync) so the `cloud`
      // object attached to migrationPlan — which handleMigrationCloudOnly/
      // handleMigrationRestore later replace local state with wholesale —
      // never contains a tombstoned row either.
      const cloud = stripDeleted(rawCloud);
      const plan = planCloudSync(state, rawCloud);
      if (plan.kind !== 'none') setMigrationPlan({ ...plan, cloud });
      clearJustSignedIn();
    }).catch(err => {
      console.error('Không thể tải dữ liệu đám mây:', err);
      toast('Không thể kết nối đám mây. Dữ liệu trên thiết bị vẫn dùng bình thường.', { type: 'error' });
      clearJustSignedIn();
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justSignedIn, userId]);

  // Local-first background sync (spec §16): never awaited by a capture
  // action, just kicked off whenever there's something pending and a
  // logged-in user, and again whenever connectivity returns.
  useEffect(() => {
    if (userId) syncQueue.flush(userId);
  }, [userId, state]);
  useEffect(() => {
    function onOnline() { if (userId) syncQueue.flush(userId); }
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [userId]);

  // Ongoing CLOUD → LOCAL pull, separate from the one-time login merge
  // above. Without this, a second signed-in device only ever reflects
  // whatever cloud looked like at ITS OWN first login — anything
  // created/edited on another device afterwards never arrives, which is
  // exactly the "máy tính không đồng bộ với điện thoại" report this fixes.
  // Runs once as soon as a session resolves to authenticated (covers a
  // RESTORED session on reload, which justSignedIn deliberately skips —
  // that case is handled by the effect above instead), then again on
  // focus/visibility and periodically while the tab stays open. Known gap:
  // still can't propagate deletes made on another device (see cloudSync.js).
  const pulledForUserRef = useRef(null);
  async function pullFromCloud() {
    if (!userId) return;
    try {
      const cloud = await cloudRepository.fetchAll(userId);
      setState(s => {
        const merged = mergeCloudDown(s, cloud);
        return { ...s, eventDefinitions: merged.eventDefinitions, events: merged.events };
      });
    } catch (err) {
      console.error('Không thể đồng bộ dữ liệu mới từ đám mây:', err);
    }
  }
  useEffect(() => {
    if (!userId || justSignedIn || migrationPlan) return;
    if (pulledForUserRef.current === userId) return;
    pulledForUserRef.current = userId;
    pullFromCloud();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, justSignedIn, migrationPlan]);
  useEffect(() => {
    if (!userId) return;
    function onFocusOrVisible() {
      if (document.visibilityState === 'hidden') return;
      pullFromCloud();
    }
    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') pullFromCloud();
    }, 60000);
    return () => {
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const { eventDefinitions: definitions, events } = state;

  function setDefinitions(updater) {
    setState(s => ({ ...s, eventDefinitions: typeof updater === 'function' ? updater(s.eventDefinitions) : updater }));
  }
  function setEvents(updater) {
    setState(s => ({ ...s, events: typeof updater === 'function' ? updater(s.events) : updater }));
  }

  function handleAddEvent(event) {
    setEvents(prev => [event, ...prev]);
    eventRepository.createEvent(event, userId);
  }
  function handleUndoEvent(id) {
    setEvents(prev => prev.filter(e => e.id !== id));
    eventRepository.deleteEvent(id, userId);
  }
  function handleSaveEvent(id, patch) {
    let updated = null;
    setEvents(prev => prev.map(e => {
      if (e.id !== id) return e;
      updated = updateEvent(e, patch);
      return updated;
    }));
    if (updated) eventRepository.updateEvent(updated, userId);
  }
  function handleDeleteEvent(id) {
    setEvents(prev => prev.filter(e => e.id !== id));
    eventRepository.deleteEvent(id, userId);
    toast('Đã xóa sự kiện');
  }

  function handleActivateLibraryEntry(entry) {
    const existing = definitions.find(d => d.id === entry.id);
    if (existing) return existing;
    const created = createDefinitionFromLibrary(entry);
    setDefinitions(prev => [...prev, created]);
    eventRepository.createDefinition(created, userId);
    return created;
  }

  function handleCreateCustomDefinition(data) {
    const created = createCustomDefinition(data);
    setDefinitions(prev => [...prev, created]);
    eventRepository.createDefinition(created, userId);
    return created;
  }

  function handleUpdateDefinition(id, patch) {
    let updated = null;
    setDefinitions(prev => prev.map(d => {
      if (d.id !== id) return d;
      updated = { ...d, ...patch };
      return updated;
    }));
    if (updated) eventRepository.updateDefinition(updated, userId);
  }
  function handleToggleFavorite(definition) {
    const updated = { ...definition, favorite: !definition.favorite };
    setDefinitions(prev => prev.map(d => (d.id === definition.id ? updated : d)));
    eventRepository.updateDefinition(updated, userId);
  }
  function handleDuplicateDefinition(definition) {
    const dup = { ...definition, id: `custom_${uid()}`, name: `${definition.name} (bản sao)`, favorite: false, createdAt: new Date().toISOString() };
    setDefinitions(prev => [...prev, dup]);
    eventRepository.createDefinition(dup, userId);
  }
  function handleDeleteDefinition(id) {
    setDefinitions(prev => prev.filter(d => d.id !== id));
    eventRepository.deleteDefinition(id, userId);
  }

  function handleExport() {
    downloadExport(state);
  }
  function handleImport(preview, mode) {
    setState(s => (mode === 'replace' ? replaceState(s, preview) : mergeStates(s, preview)));
  }

  // Self-service "clear my own test data" (operator: xóa dữ liệu test hết
  // đi để tao push github và deploy). Best-effort mirrors the wipe to cloud
  // too (if signed in) so a reset here doesn't leave orphaned rows behind —
  // this only ever touches THIS browser's data; anyone else opening the
  // deployed app gets a fresh install regardless (bootstrapState()).
  function handleResetAllData() {
    definitions.forEach(d => eventRepository.deleteDefinition(d.id, userId));
    events.forEach(e => eventRepository.deleteEvent(e.id, userId));
    const freshDefs = getStarterDefinitions();
    freshDefs.forEach(d => eventRepository.createDefinition(d, userId));
    setState(s => ({ ...s, eventDefinitions: freshDefs, events: [] }));
  }

  // --- login → merge/restore resolution (spec §20/§21) ---
  function syncAllToCloud(defs, evts) {
    if (!userId) return;
    cloudRepository.upsertManyDefinitions(defs, userId).catch(err => console.error('Đồng bộ loại sự kiện thất bại:', err));
    cloudRepository.upsertManyEvents(evts, userId).catch(err => console.error('Đồng bộ sự kiện thất bại:', err));
  }
  function handleMigrationMerge() {
    const merged = mergeLocalAndCloud(state, migrationPlan.cloud);
    setState(s => ({ ...s, eventDefinitions: merged.eventDefinitions, events: merged.events }));
    syncAllToCloud(merged.eventDefinitions, merged.events);
    toast('Đã gộp dữ liệu thiết bị và đám mây.');
    setMigrationPlan(null);
  }
  function handleMigrationCloudOnly() {
    downloadExport(state); // safety backup before discarding the local view
    setState(s => ({ ...s, eventDefinitions: migrationPlan.cloud.definitions, events: migrationPlan.cloud.events }));
    toast('Đã chuyển sang dùng dữ liệu đám mây. Bản sao lưu thiết bị đã được tải về.');
    setMigrationPlan(null);
  }
  function handleMigrationRestore() {
    setState(s => ({ ...s, eventDefinitions: migrationPlan.cloud.definitions, events: migrationPlan.cloud.events }));
    toast('Đã khôi phục dữ liệu từ đám mây.');
    setMigrationPlan(null);
  }
  function handleMigrationStartEmpty() {
    setMigrationPlan(null);
  }
  function handleMigrationCancel() {
    setMigrationPlan(null);
  }

  const showOnboarding = !state.settings?.onboardingSeen;
  function finishOnboarding() {
    setState(s => ({ ...s, settings: { ...s.settings, onboardingSeen: true } }));
  }

  return (
    <div className="min-h-screen bg-app font-sans">
      <ToastHost toasts={toasts} dismiss={dismiss} />

      {showOnboarding && <Onboarding onDone={finishOnboarding} />}

      <BottomNav page={page} onNavigate={setPage} />

      <main className="sm:ml-56 pb-24 sm:pb-8 min-h-screen">
        <div className="max-w-xl mx-auto px-4 pt-8">
          {page === 'capture' && (
            <CapturePage
              definitions={definitions}
              events={events}
              onAddEvent={handleAddEvent}
              onUndoEvent={handleUndoEvent}
              onSaveEvent={handleSaveEvent}
              onDeleteEvent={handleDeleteEvent}
              onOpenAddEvent={() => setAddEventOpen(true)}
              onOpenManage={() => setManageOpen(true)}
              onGoToTimeline={() => setPage('timeline')}
              theme={theme}
              onSetTheme={handleSetTheme}
              onSyncNow={pullFromCloud}
              toast={toast}
            />
          )}
          {page === 'timeline' && (
            <TimelinePage definitions={definitions} events={events} onSaveEvent={handleSaveEvent} onDeleteEvent={handleDeleteEvent} />
          )}
          {page === 'calendar' && (
            <CalendarPage definitions={definitions} events={events} onSaveEvent={handleSaveEvent} onDeleteEvent={handleDeleteEvent} />
          )}
          {page === 'stats' && (
            <StatisticsPage definitions={definitions} events={events} />
          )}
        </div>
      </main>

      {addEventOpen && (
        <AddEventPage
          definitions={definitions}
          events={events}
          onClose={() => setAddEventOpen(false)}
          onActivateLibraryEntry={handleActivateLibraryEntry}
          onCreateCustomDefinition={handleCreateCustomDefinition}
          onAddEvent={handleAddEvent}
          onUndoEvent={handleUndoEvent}
          toast={toast}
        />
      )}

      {manageOpen && (
        <ManagePage
          definitions={definitions}
          state={state}
          onClose={() => setManageOpen(false)}
          onOpenAdd={() => setManageAddOpen(true)}
          onToggleFavorite={handleToggleFavorite}
          onUpdateDefinition={handleUpdateDefinition}
          onDuplicateDefinition={handleDuplicateDefinition}
          onDeleteDefinition={handleDeleteDefinition}
          onExport={handleExport}
          onImport={handleImport}
          onResetAllData={handleResetAllData}
          theme={theme}
          onSetTheme={handleSetTheme}
          onSyncNow={pullFromCloud}
          toast={toast}
        />
      )}

      {manageAddOpen && (
        <AddEventPage
          definitions={definitions}
          events={events}
          onClose={() => setManageAddOpen(false)}
          onActivateLibraryEntry={handleActivateLibraryEntry}
          onCreateCustomDefinition={handleCreateCustomDefinition}
          onAddEvent={handleAddEvent}
          onUndoEvent={handleUndoEvent}
          toast={toast}
          autoLog={false}
          title="Thêm sự kiện"
        />
      )}

      {migrationPlan && (
        <LocalCloudMigrationModal
          plan={migrationPlan}
          onMerge={handleMigrationMerge}
          onCloudOnly={handleMigrationCloudOnly}
          onRestore={handleMigrationRestore}
          onStartEmpty={handleMigrationStartEmpty}
          onCancel={handleMigrationCancel}
        />
      )}
    </div>
  );
}
