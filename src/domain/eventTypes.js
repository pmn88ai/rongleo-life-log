// The five internal event data/UX types. Users never pick these directly —
// each EventDefinition already carries its type.
export const EVENT_TYPES = {
  MOMENT: 'moment',
  COUNT: 'count',
  MEASUREMENT: 'measurement',
  DURATION: 'duration',
  RATING: 'rating',
};

export const EVENT_TYPE_LIST = [
  EVENT_TYPES.MOMENT,
  EVENT_TYPES.COUNT,
  EVENT_TYPES.MEASUREMENT,
  EVENT_TYPES.DURATION,
  EVENT_TYPES.RATING,
];

export const EVENT_TYPE_LABELS = {
  [EVENT_TYPES.MOMENT]: 'Sự kiện đơn giản',
  [EVENT_TYPES.COUNT]: 'Số lượng',
  [EVENT_TYPES.MEASUREMENT]: 'Số đo',
  [EVENT_TYPES.DURATION]: 'Thời lượng',
  [EVENT_TYPES.RATING]: 'Đánh giá (1-5)',
};

export const EVENT_TYPE_HINTS = {
  [EVENT_TYPES.MOMENT]: 'Một chạm để ghi nhận, không cần số liệu.',
  [EVENT_TYPES.COUNT]: 'Ghi số lượng mỗi lần, ví dụ ml, viên, điếu.',
  [EVENT_TYPES.MEASUREMENT]: 'Ghi một chỉ số đo được, ví dụ kg, °C.',
  [EVENT_TYPES.DURATION]: 'Ghi khoảng thời gian đã dùng, tính bằng phút.',
  [EVENT_TYPES.RATING]: 'Chấm điểm nhanh theo thang 1-5.',
};

// Preset quick-quantity chips for count-type logging. Volume-ish units (ml)
// get volume-scale presets; everything else (lần, viên, điếu, and whatever a
// custom event's unit turns out to be) gets small integer steps — showing
// "150 lần" for something like Uống thuốc/Hắt hơi would be absurd.
export const VOLUME_UNITS = ['ml', 'l'];
export const COUNT_QUICK_PRESETS_VOLUME = [150, 250, 350, 500, 750, 1000];
export const COUNT_QUICK_PRESETS_SMALL = [1, 2, 3, 5, 10];

export function isVolumeUnit(unit) {
  return VOLUME_UNITS.includes((unit || '').toLowerCase());
}

// Preset quick-duration chips, in minutes.
export const DURATION_QUICK_PRESETS = [15, 30, 60];

export const RATING_SCALE = [1, 2, 3, 4, 5];

export const RATING_EMOJI = {
  1: '😞',
  2: '🙁',
  3: '😐',
  4: '🙂',
  5: '😄',
};

export function isQuantifiable(type) {
  return type === EVENT_TYPES.COUNT || type === EVENT_TYPES.DURATION;
}
