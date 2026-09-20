import { Modal } from './Modal.jsx';

// Shown exactly once, right after a fresh login resolves (spec v2.2 §20
// merge / §21 restore) — never on every app start with an already-active
// session. Both flows share one shell; which body renders depends on
// `plan.kind`, decided by the pure planCloudSync() in domain/cloudSync.js.
export function LocalCloudMigrationModal({ plan, onMerge, onCloudOnly, onRestore, onStartEmpty, onCancel }) {
  if (plan.kind === 'restore') {
    return (
      <Modal title="Khôi phục dữ liệu" onClose={onStartEmpty}>
        <div className="space-y-4">
          <p className="text-sm text-body">
            Tài khoản đám mây của bạn đang có{' '}
            <strong>{plan.cloudCounts.events.toLocaleString('vi-VN')} sự kiện</strong> và{' '}
            <strong>{plan.cloudCounts.definitions} loại sự kiện</strong>.
            Thiết bị này hiện chưa có dữ liệu.
          </p>
          <div className="space-y-2">
            <button
              onClick={onRestore}
              className="w-full py-3 rounded-xl bg-ink text-on-ink text-sm font-medium hover:bg-ink-hover transition-all active:scale-95"
            >
              Khôi phục về thiết bị này
            </button>
            <button
              onClick={onStartEmpty}
              className="w-full py-3 rounded-xl border border-default text-body text-sm font-medium hover:bg-app transition-all active:scale-95"
            >
              Bắt đầu trống
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Đồng bộ dữ liệu" onClose={onCancel}>
      <div className="space-y-4">
        <p className="text-sm text-body">Bạn đang có trên thiết bị này:</p>
        <div className="bg-app rounded-2xl p-4 border border-subtle space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-secondary">Sự kiện</span><span className="font-semibold text-primary">{plan.localCounts.events.toLocaleString('vi-VN')}</span></div>
          <div className="flex justify-between"><span className="text-secondary">Loại sự kiện tuỳ chỉnh</span><span className="font-semibold text-primary">{plan.localCounts.customDefinitions}</span></div>
        </div>
        <p className="text-sm text-body">Tài khoản đám mây hiện có:</p>
        <div className="bg-app rounded-2xl p-4 border border-subtle space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-secondary">Sự kiện</span><span className="font-semibold text-primary">{plan.cloudCounts.events.toLocaleString('vi-VN')}</span></div>
        </div>
        <p className="text-xs text-muted">Bạn muốn làm gì?</p>
        <div className="space-y-2">
          <button
            onClick={onMerge}
            className="w-full py-3 rounded-xl bg-ink text-on-ink text-sm font-medium hover:bg-ink-hover transition-all active:scale-95"
          >
            Gộp dữ liệu
          </button>
          <button
            onClick={onCloudOnly}
            className="w-full py-3 rounded-xl border border-default text-body text-sm font-medium hover:bg-app transition-all active:scale-95"
          >
            Chỉ dùng dữ liệu đám mây
          </button>
          <button
            onClick={onCancel}
            className="w-full py-2 text-sm text-muted hover:text-body"
          >
            Hủy
          </button>
        </div>
        <p className="text-[11px] text-muted leading-relaxed">
          Chọn "Chỉ dùng dữ liệu đám mây" sẽ tự động tải một bản sao lưu dữ liệu trên thiết bị này về máy trước,
          không có gì bị xóa mà không sao lưu.
        </p>
      </div>
    </Modal>
  );
}
