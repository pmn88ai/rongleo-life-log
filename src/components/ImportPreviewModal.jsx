import { Modal } from './Modal.jsx';

export function ImportPreviewModal({ preview, onClose, onImport }) {
  const { eventDefinitions, events } = preview;
  return (
    <Modal title="Nhập dữ liệu" onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-app rounded-2xl p-4 border border-subtle space-y-2">
          <p className="text-xs text-secondary font-medium uppercase tracking-wider mb-1">Xem trước file</p>
          {[['Hoạt động', eventDefinitions.length], ['Sự kiện', events.length]].map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm">
              <span className="text-secondary">{k}</span>
              <span className="font-semibold text-primary">{v.toLocaleString('vi-VN')}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted text-center">Chọn cách nhập dữ liệu</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onImport('replace')}
            className="py-4 rounded-2xl border-2 border-rose-200 bg-rose-50 text-rose-600 text-sm font-medium hover:bg-rose-100 transition-all active:scale-95"
          >
            🔁 Ghi đè
            <p className="text-[10px] font-normal mt-1 text-rose-400">Xoá dữ liệu cũ</p>
          </button>
          <button
            onClick={() => onImport('merge')}
            className="py-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50 text-emerald-600 text-sm font-medium hover:bg-emerald-100 transition-all active:scale-95"
          >
            ➕ Gộp
            <p className="text-[10px] font-normal mt-1 text-emerald-400">Giữ dữ liệu cũ</p>
          </button>
        </div>
      </div>
    </Modal>
  );
}
