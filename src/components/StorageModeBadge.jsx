import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider.jsx';
import { syncQueue } from '../storage/syncQueue.js';
import { StorageInfoModal } from './StorageInfoModal.jsx';
import { LoginModal } from './LoginModal.jsx';

// Subtle, always-visible-but-quiet status line (spec v2.2 §7/§8: "do not
// put a large warning/banner on every screen"). Tapping it is the one and
// only entry point into login/account/cloud concepts — everything else
// about Capture stays exactly as v2.1.
export function StorageModeBadge({ toast }) {
  const { status, signOut } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [infoOpen, setInfoOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => syncQueue.subscribe(setPendingCount), []);

  const label = status === 'authenticated'
    ? (pendingCount > 0 ? '⏳ Đang chờ đồng bộ' : '☁️ Đã đồng bộ')
    : '📱 Lưu trên thiết bị';

  async function handleLogout() {
    setInfoOpen(false);
    await signOut();
    // Local data is untouched by design — logout only clears the cloud
    // session (spec §22).
    toast?.('Đã đăng xuất. Dữ liệu hiện vẫn được lưu trên thiết bị này.');
  }

  return (
    <>
      <button
        onClick={() => setInfoOpen(true)}
        className="text-[11px] text-muted hover:text-body transition-colors -ml-1 px-1 py-0.5"
      >
        {label}
      </button>

      {infoOpen && (
        <StorageInfoModal
          pendingCount={pendingCount}
          onClose={() => setInfoOpen(false)}
          onOpenLogin={() => { setInfoOpen(false); setLoginOpen(true); }}
          onLogout={handleLogout}
        />
      )}

      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
    </>
  );
}
