import { useEffect, useMemo, useRef, useState } from 'react';
import { FullScreenOverlay, Modal } from '../components/Modal.jsx';
import { Icon } from '../components/Icon.jsx';
import { EventDefinitionRow } from '../components/EventDefinitionRow.jsx';
import { CustomEventForm } from '../components/CustomEventForm.jsx';
import { ImportPreviewModal } from '../components/ImportPreviewModal.jsx';
import { StorageInfoModal } from '../components/StorageInfoModal.jsx';
import { LoginModal } from '../components/LoginModal.jsx';
import { ThemeSwitcherGrid } from '../components/ThemeSwitcher.jsx';
import { CATEGORIES } from '../data/categories.js';
import { parseImportPayload } from '../storage/exportImport.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import { syncQueue } from '../storage/syncQueue.js';

const TABS = [
  { id: 'events', label: 'Sự kiện' },
  { id: 'data', label: 'Dữ liệu' },
];

export function ManagePage({
  definitions, state, onClose, onOpenAdd,
  onToggleFavorite, onUpdateDefinition, onDuplicateDefinition, onDeleteDefinition,
  onExport, onImport, onResetAllData, theme, onSetTheme, toast,
}) {
  const [tab, setTab] = useState('events');
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [storageInfoOpen, setStorageInfoOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const fileRef = useRef(null);
  const { status, signOut } = useAuth();
  const [pendingSync, setPendingSync] = useState(0);

  // No hide/deactivate concept, and no cap either — Capture's grid shows
  // every definition that exists (operator: "tao muốn không giới hạn"), so
  // this screen and Capture always describe the exact same set. "Tất cả"
  // excludes anything already listed under "Yêu thích" so nothing renders
  // twice on the page (that duplication was the actual "19 vs 11" report —
  // both counts were already correct, favorited rows were just printed once
  // under Yêu Thích AND again under their category).
  const favorites = useMemo(() => definitions.filter(d => d.favorite), [definitions]);
  const nonFavorites = useMemo(() => definitions.filter(d => !d.favorite), [definitions]);
  const byCategory = useMemo(() => {
    const map = new Map();
    for (const d of nonFavorites) {
      if (!map.has(d.category)) map.set(d.category, []);
      map.get(d.category).push(d);
    }
    return map;
  }, [nonFavorites]);

  useEffect(() => syncQueue.subscribe(setPendingSync), []);

  async function handleLogout() {
    setStorageInfoOpen(false);
    await signOut();
    toast('Đã đăng xuất. Dữ liệu hiện vẫn được lưu trên thiết bị này.');
  }

  function handleDelete(definition) {
    setDeleteTarget(definition);
  }
  function confirmDelete() {
    onDeleteDefinition(deleteTarget.id);
    setDeleteTarget(null);
  }

  async function processFile(file) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast('File quá lớn (tối đa 10MB)', { type: 'error' }); return; }
    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      setImportPreview(parseImportPayload(raw));
    } catch (e) {
      toast('File không hợp lệ: ' + e.message, { type: 'error' });
    }
  }

  function handleFileChange(e) { processFile(e.target.files[0]); e.target.value = ''; }
  function handleDrop(e) { e.preventDefault(); setDragOver(false); processFile(e.dataTransfer.files[0]); }

  function handleImport(mode) {
    onImport(importPreview, mode);
    setImportPreview(null);
    toast(mode === 'replace' ? 'Đã ghi đè dữ liệu thành công' : 'Đã gộp dữ liệu thành công');
  }

  function confirmReset() {
    onResetAllData();
    setResetConfirmOpen(false);
    toast('Đã đặt lại dữ liệu — quay về bộ khởi đầu mặc định.');
  }

  return (
    <FullScreenOverlay
      title="Quản lý"
      onClose={onClose}
      headerRight={tab === 'events' && (
        <button
          onClick={onOpenAdd}
          aria-label="Thêm sự kiện"
          className="w-11 h-11 flex items-center justify-center rounded-full text-secondary hover:text-primary hover:bg-app transition-colors"
        >
          <Icon.plus />
        </button>
      )}
    >
      <div className="flex gap-2 mb-5">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
              tab === t.id ? 'bg-ink text-on-ink border-ink' : 'bg-surface border-default text-secondary'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'events' && (
        <div className="space-y-6">
          <p className="text-xs text-muted leading-relaxed -mt-1">
            Tổng cộng <span className="font-medium text-secondary">{definitions.length} sự kiện</span> — đúng bằng số ô trên Capture,
            không giới hạn. Không dùng nữa thì xóa hẳn, lịch sử đã ghi vẫn được giữ.
            Muốn thêm loại mới? Bấm <span className="font-medium text-secondary">➕</span> ở trên.
          </p>
          {favorites.length > 0 && (
            <div>
              <p className="text-xs text-muted tracking-widest uppercase mb-2.5">
                ⭐ Yêu thích <span className="normal-case text-faint">({favorites.length})</span>
              </p>
              <div className="space-y-2">
                {favorites.map(d => (
                  <EventDefinitionRow
                    key={d.id} definition={d}
                    onToggleFavorite={onToggleFavorite}
                    onEdit={setEditTarget} onDuplicate={onDuplicateDefinition} onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs text-muted tracking-widest uppercase mb-2.5">
              Khác <span className="normal-case text-faint">({nonFavorites.length})</span>
            </p>
            <div className="space-y-5">
              {CATEGORIES.map(cat => {
                const items = byCategory.get(cat.id) || [];
                if (items.length === 0) return null;
                return (
                  <div key={cat.id}>
                    <p className="text-xs font-medium text-secondary mb-2">{cat.emoji} {cat.name}</p>
                    <div className="space-y-2">
                      {items.map(d => (
                        <EventDefinitionRow
                          key={d.id} definition={d}
                          onToggleFavorite={onToggleFavorite}
                          onEdit={setEditTarget} onDuplicate={onDuplicateDefinition} onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
              {definitions.length === 0 && (
                <p className="text-sm text-muted text-center py-8">Chưa có sự kiện nào.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'data' && (
        <div className="space-y-3">
          <p className="text-xs text-muted tracking-widest uppercase mb-1">Giao diện</p>
          <div className="mb-4">
            <ThemeSwitcherGrid theme={theme} onSetTheme={onSetTheme} />
          </div>

          <p className="text-xs text-muted tracking-widest uppercase mb-1">Sao lưu dữ liệu</p>
          <button
            onClick={() => { onExport(); toast('Đã xuất file backup'); }}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-ink hover:bg-ink-hover text-on-ink font-medium text-sm transition-all active:scale-95 shadow-sm"
          >
            <Icon.download /> Xuất dữ liệu (.json)
          </button>

          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`w-full flex flex-col items-center justify-center gap-2 py-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all
              ${dragOver ? 'border-focus bg-surface-alt text-heading' : 'border-default bg-surface text-secondary hover:border-strong'}`}
          >
            <Icon.upload />
            <span className="text-sm font-medium">Nhập dữ liệu</span>
            <span className="text-xs text-muted text-center px-4">Kéo & thả hoặc nhấn để chọn file .json (hỗ trợ cả file Quan Sát cũ)</span>
          </div>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={handleFileChange} />

          <button
            onClick={() => setStorageInfoOpen(true)}
            className="w-full flex items-center justify-between gap-2 text-left px-4 py-3 rounded-2xl border border-default bg-surface hover:bg-app transition-colors mt-2"
          >
            <span className="text-sm text-body">
              {status === 'authenticated'
                ? (pendingSync > 0 ? '⏳ Đang chờ đồng bộ' : '☁️ Đã đồng bộ — Quản trị viên')
                : '📱 Lưu trên thiết bị — chưa đăng nhập'}
            </span>
            <Icon.chevronRight className="w-4 h-4 text-muted shrink-0" />
          </button>

          <div className="pt-4 border-t border-default mt-4">
            <div className="flex justify-between text-sm py-1.5">
              <span className="text-secondary">Loại sự kiện</span>
              <span className="font-medium text-primary">{state.eventDefinitions.length}</span>
            </div>
            <div className="flex justify-between text-sm py-1.5">
              <span className="text-secondary">Sự kiện</span>
              <span className="font-medium text-primary">{state.events.length.toLocaleString('vi-VN')}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-default mt-4">
            <p className="text-xs text-rose-500 tracking-widest uppercase mb-1">Vùng nguy hiểm</p>
            <p className="text-xs text-muted leading-relaxed mb-2">
              Xóa hết sự kiện đã ghi và các loại tự thêm trên thiết bị này, quay về bộ khởi đầu mặc định.
              Chỉ ảnh hưởng thiết bị bạn đang dùng — không liên quan đến người dùng khác sau khi triển khai.
            </p>
            <button
              onClick={() => setResetConfirmOpen(true)}
              className="w-full py-3 rounded-2xl border border-rose-200 text-rose-500 text-sm font-medium hover:bg-rose-50 transition-all active:scale-95"
            >
              Xóa toàn bộ dữ liệu trên thiết bị này
            </button>
          </div>
        </div>
      )}

      {editTarget && (
        <CustomEventForm
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={(data) => {
            onUpdateDefinition(editTarget.id, data);
            setEditTarget(null);
          }}
        />
      )}

      {deleteTarget && (
        <Modal title="Xóa sự kiện" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-4">
            <p className="text-sm text-body">
              Xóa "<strong>{deleteTarget.name}</strong>"? Lịch sử đã ghi vẫn được giữ lại, chỉ loại sự kiện này bị xóa khỏi danh sách.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="py-3 rounded-xl border border-default text-body text-sm font-medium"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="py-3 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-all active:scale-95"
              >
                Xóa
              </button>
            </div>
          </div>
        </Modal>
      )}

      {resetConfirmOpen && (
        <Modal title="Xóa toàn bộ dữ liệu" onClose={() => setResetConfirmOpen(false)}>
          <div className="space-y-4">
            <p className="text-sm text-body">
              Xóa hết <strong>{state.events.length} sự kiện</strong> đã ghi và <strong>{state.eventDefinitions.length} loại sự kiện</strong> trên thiết bị này?
              Không thể hoàn tác. Nên xuất file backup trước nếu chưa chắc.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="py-3 rounded-xl border border-default text-body text-sm font-medium"
              >
                Hủy
              </button>
              <button
                onClick={confirmReset}
                className="py-3 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-all active:scale-95"
              >
                Xóa hết
              </button>
            </div>
          </div>
        </Modal>
      )}

      {importPreview && (
        <ImportPreviewModal preview={importPreview} onClose={() => setImportPreview(null)} onImport={handleImport} />
      )}

      {storageInfoOpen && (
        <StorageInfoModal
          pendingCount={pendingSync}
          onClose={() => setStorageInfoOpen(false)}
          onOpenLogin={() => { setStorageInfoOpen(false); setLoginOpen(true); }}
          onLogout={handleLogout}
        />
      )}
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
    </FullScreenOverlay>
  );
}
