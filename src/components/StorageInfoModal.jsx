import { useState } from 'react';
import { Modal } from './Modal.jsx';
import { useAuth } from '../auth/AuthProvider.jsx';

// The one place Supabase/cloud concepts surface in plain Vietnamese (spec
// v2.2 §9, §25) — reached by tapping the small storage badge, never forced
// in front of Capture. Shows different copy for guest vs authenticated.
export function StorageInfoModal({ pendingCount, onOpenLogin, onLogout, onSyncNow, onClose }) {
  const { status, user } = useAuth();
  const [syncState, setSyncState] = useState('idle'); // idle | syncing | done

  async function handleSyncNow() {
    if (!onSyncNow || syncState === 'syncing') return;
    setSyncState('syncing');
    await onSyncNow();
    setSyncState('done');
    setTimeout(() => setSyncState('idle'), 2000);
  }

  if (status === 'authenticated') {
    return (
      <Modal title="Lưu trữ" onClose={onClose}>
        <div className="space-y-4">
          <div className="bg-app rounded-2xl p-4 border border-subtle">
            <p className="text-sm font-medium text-primary mb-1">☁️ Dữ liệu đám mây</p>
            <p className="text-sm text-secondary leading-relaxed">
              Bạn đang đăng nhập với quyền quản trị viên ({user?.email}).
              Dữ liệu được lưu trên thiết bị này và đồng bộ với đám mây.
            </p>
          </div>
          <p className="text-xs text-muted">
            {pendingCount > 0
              ? `⏳ Đang chờ đồng bộ ${pendingCount} thay đổi...`
              : '☁️ Đã đồng bộ'}
          </p>
          {onSyncNow && (
            <button
              onClick={handleSyncNow}
              disabled={syncState === 'syncing'}
              className="w-full py-3 rounded-xl border border-default text-body text-sm font-medium hover:bg-app transition-all active:scale-95 disabled:opacity-50"
            >
              {syncState === 'syncing' ? 'Đang lấy dữ liệu mới nhất...' : syncState === 'done' ? '✓ Đã lấy dữ liệu mới nhất' : 'Đồng bộ ngay'}
            </button>
          )}
          <button
            onClick={onLogout}
            className="w-full py-3 rounded-xl border border-default text-body text-sm font-medium hover:bg-app transition-all active:scale-95"
          >
            Đăng xuất
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Lưu trữ" onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-app rounded-2xl p-4 border border-subtle">
          <p className="text-sm font-medium text-primary mb-1">📱 Dữ liệu trên thiết bị</p>
          <p className="text-sm text-secondary leading-relaxed">
            Bạn đang dùng Quan Sát không cần đăng nhập. Dữ liệu được lưu trên thiết bị này.
            Bạn có thể xuất dữ liệu thành JSON bất cứ lúc nào ở mục Quản lý → Dữ liệu.
          </p>
        </div>
        <p className="text-sm text-secondary leading-relaxed">
          Đăng nhập dành cho quản trị viên nếu bạn muốn lưu dữ liệu trên đám mây.
        </p>
        <div className="space-y-2">
          <button
            onClick={onOpenLogin}
            className="w-full py-3 rounded-xl bg-ink text-on-ink text-sm font-medium hover:bg-ink-hover transition-all active:scale-95"
          >
            Đăng nhập
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl border border-default text-body text-sm font-medium hover:bg-app transition-all active:scale-95"
          >
            Tiếp tục dùng trên thiết bị
          </button>
        </div>
      </div>
    </Modal>
  );
}
