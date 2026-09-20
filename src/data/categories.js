// The seed categories from the implementation spec (§13, extended in v2.1
// §9.14-9.15 with 'external' and 'unusual' so weather/incidents/surprises
// have a home — mundane, private and external-world events are first-class,
// not edge cases bolted onto an activity list.
export const CATEGORIES = [
  { id: 'body', name: 'Cơ thể', emoji: '🧍' },
  { id: 'food', name: 'Ăn uống', emoji: '🍜' },
  { id: 'drink', name: 'Đồ uống', emoji: '☕' },
  { id: 'health', name: 'Sức khoẻ', emoji: '💊' },
  { id: 'sleep', name: 'Giấc ngủ', emoji: '😴' },
  { id: 'movement', name: 'Vận động', emoji: '🏃' },
  { id: 'work', name: 'Công việc', emoji: '💼' },
  { id: 'learning', name: 'Học tập', emoji: '📚' },
  { id: 'social', name: 'Xã hội', emoji: '🤝' },
  { id: 'emotion', name: 'Cảm xúc', emoji: '🙂' },
  { id: 'mind', name: 'Tâm trí', emoji: '🧠' },
  { id: 'digital', name: 'Thiết bị số', emoji: '📱' },
  { id: 'finance', name: 'Tài chính', emoji: '💰' },
  { id: 'travel', name: 'Di chuyển', emoji: '🚗' },
  { id: 'home', name: 'Nhà cửa', emoji: '🏠' },
  { id: 'entertainment', name: 'Giải trí', emoji: '🎬' },
  { id: 'pain_symptom', name: 'Triệu chứng', emoji: '🤕' },
  { id: 'achievement', name: 'Thành tựu', emoji: '🏆' },
  { id: 'external', name: 'Thế giới bên ngoài', emoji: '☀️' },
  { id: 'unusual', name: 'Bất thường', emoji: '🚨' },
  { id: 'other', name: 'Khác', emoji: '✨' },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

export function getCategory(id) {
  return CATEGORY_MAP[id] || CATEGORY_MAP.other;
}
