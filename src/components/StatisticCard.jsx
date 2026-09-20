import { EVENT_TYPES } from '../domain/eventTypes.js';
import { RATING_EMOJI } from '../domain/eventTypes.js';

function Stat({ label, value }) {
  if (value == null || value === '') return null;
  return (
    <div className="bg-app rounded-xl px-3 py-2.5">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="text-base font-semibold text-primary mt-0.5">{value}</p>
    </div>
  );
}

const TREND_LABEL = { up: '↑ tăng', down: '↓ giảm', flat: '→ ổn định' };

export function StatisticCard({ definition, stats }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.type === EVENT_TYPES.MOMENT && (
        <>
          <Stat label="Tổng số lần" value={stats.total} />
          <Stat label="Trung bình/ngày" value={stats.avgPerDay} />
          <Stat label="Lần gần nhất" value={stats.lastAt ? new Date(stats.lastAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'} />
          <Stat label="Khoảng cách TB" value={stats.avgGapHours != null ? `${stats.avgGapHours} giờ` : '—'} />
        </>
      )}
      {stats.type === EVENT_TYPES.COUNT && (
        <>
          <Stat label="Tổng" value={`${stats.total} ${stats.unit || ''}`} />
          <Stat label="Trung bình/ngày" value={`${stats.avgPerDay} ${stats.unit || ''}`} />
          <Stat label="Số lần" value={stats.count} />
          <Stat label="Trung bình/lần" value={`${stats.avgPerOccurrence} ${stats.unit || ''}`} />
        </>
      )}
      {stats.type === EVENT_TYPES.DURATION && (
        <>
          <Stat label="Tổng thời gian" value={`${stats.totalMinutes} phút`} />
          <Stat label="Trung bình/lần" value={`${stats.avgPerSession} phút`} />
          <Stat label="Số lần" value={stats.sessionCount} />
        </>
      )}
      {stats.type === EVENT_TYPES.MEASUREMENT && (
        <>
          <Stat label="Gần nhất" value={stats.latest != null ? `${stats.latest} ${stats.unit || ''}` : '—'} />
          <Stat label="Thấp nhất" value={stats.min != null ? `${stats.min} ${stats.unit || ''}` : '—'} />
          <Stat label="Cao nhất" value={stats.max != null ? `${stats.max} ${stats.unit || ''}` : '—'} />
          <Stat label="Trung bình" value={stats.average != null ? `${stats.average} ${stats.unit || ''}` : '—'} />
          <Stat label="Xu hướng" value={TREND_LABEL[stats.trend]} />
        </>
      )}
      {stats.type === EVENT_TYPES.RATING && (
        <>
          <Stat label="Trung bình" value={stats.average != null ? `${stats.average}/5` : '—'} />
          <Stat label="Cao nhất" value={stats.highest != null ? `${RATING_EMOJI[stats.highest]} ${stats.highest}` : '—'} />
          <Stat label="Thấp nhất" value={stats.lowest != null ? `${RATING_EMOJI[stats.lowest]} ${stats.lowest}` : '—'} />
          {stats.distribution && (
            <div className="col-span-2 bg-app rounded-xl px-3 py-2.5">
              <p className="text-[11px] text-muted mb-1.5">Phân bố</p>
              <div className="flex items-end gap-1.5 h-12">
                {[1, 2, 3, 4, 5].map(v => {
                  const count = stats.distribution[v] || 0;
                  const max = Math.max(...Object.values(stats.distribution), 1);
                  return (
                    <div key={v} className="flex-1 flex flex-col items-center gap-0.5">
                      <div className="w-full bg-surface-alt2 rounded-t" style={{ height: `${Math.max((count / max) * 32, count > 0 ? 4 : 1)}px` }} />
                      <span className="text-[9px] text-muted">{RATING_EMOJI[v]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
