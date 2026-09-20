import { useState } from 'react';
import { Modal } from './Modal.jsx';
import { useAuth } from '../auth/AuthProvider.jsx';

// Deliberately plain: email + password, no "create account", no social
// login, no Supabase/RLS/JWT language anywhere (spec v2.2 §10, §27). This
// is an admin sign-in, not a product registration flow.
export function LoginModal({ onClose }) {
  const { signIn, isCloudConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setSubmitting(true);
    setError(null);
    const result = await signIn(email.trim(), password);
    setSubmitting(false);
    if (result.ok) onClose();
    else setError(result.error);
  }

  return (
    <Modal title="Đăng nhập quản trị viên" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-secondary leading-relaxed">
          Đăng nhập dành cho quản trị viên để lưu và đồng bộ dữ liệu trên đám mây.
          Nếu bạn không đăng nhập, ứng dụng vẫn hoạt động bình thường — dữ liệu chỉ lưu trên thiết bị này.
        </p>

        {!isCloudConfigured ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl px-4 py-3">
            Ứng dụng chưa được cấu hình đám mây. Bạn vẫn có thể dùng bình thường ở chế độ lưu trên thiết bị.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-secondary uppercase tracking-wider">Tài khoản</label>
              <input
                autoFocus type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="email@vidu.com"
                className="w-full mt-1.5 border border-default rounded-xl px-4 py-3 bg-surface text-sm focus:outline-none focus:border-focus"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-secondary uppercase tracking-wider">Mật khẩu</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full mt-1.5 border border-default rounded-xl px-4 py-3 bg-surface text-sm focus:outline-none focus:border-focus"
              />
            </div>
            {error && <p className="text-sm text-rose-500">{error}</p>}
            <button
              type="submit"
              disabled={!email.trim() || !password || submitting}
              className="w-full bg-ink text-on-ink font-medium py-3 rounded-xl hover:bg-ink-hover transition-all active:scale-95 disabled:opacity-30"
            >
              {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        )}

        <button
          onClick={onClose}
          className="w-full text-center text-sm text-muted hover:text-body py-2"
        >
          ← Tiếp tục không đăng nhập
        </button>
      </div>
    </Modal>
  );
}
