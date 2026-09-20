import { useState } from 'react';
import { Icon } from './Icon.jsx';
import { Modal } from './Modal.jsx';
import { EmojiGlyph } from './EmojiGlyph.jsx';
import { EVENT_TYPE_LABELS } from '../domain/eventTypes.js';

// One row in Quản lý → Sự kiện. Only two things are directly tappable
// inline (favorite star — glanceable at a look, and the "⋯" menu); Sửa/
// Nhân bản/Xóa live in a labeled sheet instead of bare icons, because a
// row of 4-5 unlabeled icons is not self-explanatory (operator feedback:
// "bấm vào mà chả biết nó là gì"). No active/inactive toggle — if it's not
// wanted, delete it; history keeps its own name/emoji snapshot regardless.
export function EventDefinitionRow({ definition, onToggleFavorite, onEdit, onDuplicate, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-surface rounded-2xl px-4 py-3 border border-subtle shadow-sm flex items-center gap-3">
      <EmojiGlyph className="text-2xl leading-none shrink-0">{definition.emoji}</EmojiGlyph>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-primary truncate">{definition.name}</p>
        <p className="text-[11px] text-muted">{EVENT_TYPE_LABELS[definition.type]}{definition.unit ? ` · ${definition.unit}` : ''}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onToggleFavorite(definition)}
          aria-label={definition.favorite ? 'Bỏ yêu thích' : 'Đánh dấu yêu thích'}
          className={`w-11 h-11 flex items-center justify-center rounded-lg transition-colors ${
            definition.favorite ? 'text-amber-500' : 'text-faint hover:text-amber-400'}`}
        >
          <Icon.star filled={definition.favorite} className="w-5 h-5" />
        </button>
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Thêm tùy chọn"
          className="w-11 h-11 flex items-center justify-center rounded-lg text-muted hover:text-heading transition-colors"
        >
          <Icon.moreVertical />
        </button>
      </div>

      {menuOpen && (
        <Modal title={`${definition.emoji}  ${definition.name}`} onClose={() => setMenuOpen(false)}>
          <div className="space-y-1.5">
            <button
              onClick={() => { onEdit(definition); setMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-app text-left transition-colors"
            >
              <span className="w-9 h-9 rounded-full bg-surface-alt flex items-center justify-center shrink-0 text-body">
                <Icon.edit className="w-4 h-4" />
              </span>
              <span>
                <span className="block text-sm font-medium text-primary">Sửa</span>
                <span className="block text-xs text-muted">Đổi tên, emoji, nhóm hoặc kiểu ghi nhận</span>
              </span>
            </button>
            <button
              onClick={() => { onDuplicate(definition); setMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-app text-left transition-colors"
            >
              <span className="w-9 h-9 rounded-full bg-surface-alt flex items-center justify-center shrink-0 text-body">
                <Icon.copy className="w-4 h-4" />
              </span>
              <span>
                <span className="block text-sm font-medium text-primary">Nhân bản</span>
                <span className="block text-xs text-muted">Tạo sự kiện mới, sao chép cài đặt này</span>
              </span>
            </button>
            <button
              onClick={() => { onDelete(definition); setMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-rose-50 text-left transition-colors"
            >
              <span className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center shrink-0 text-rose-500">
                <Icon.trash className="w-4 h-4" />
              </span>
              <span>
                <span className="block text-sm font-medium text-rose-600">Xóa</span>
                <span className="block text-xs text-muted">Xóa khỏi danh sách — lịch sử đã ghi vẫn được giữ</span>
              </span>
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
