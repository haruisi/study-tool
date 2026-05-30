import { formatMinutes } from '../lib/aggregate.js';

const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日'];

// 量に応じた色（薄い→濃い緑）。0は薄いグレー。落ち着いたトーン。
function cellColor(minutes, max) {
  if (minutes === null) return 'transparent'; // 期間外
  if (!minutes) return '#eef2f7';
  const ratio = max > 0 ? minutes / max : 0;
  // 4段階
  if (ratio <= 0.25) return '#d6e8df';
  if (ratio <= 0.5) return '#a8d3bd';
  if (ratio <= 0.75) return '#6cae8f';
  return '#3f8f6b';
}

export default function StudyHeatmap({ grid }) {
  const { weeks, max } = grid;

  return (
    <div className="heatmap">
      <div className="heatmap-weekdays">
        {WEEKDAYS.map((w) => (
          <div key={w} className="heatmap-weekday">
            {w}
          </div>
        ))}
      </div>
      <div className="heatmap-grid">
        {weeks.map((week) => (
          <div key={week.weekKey} className="heatmap-col">
            {week.days.map((day) => (
              <div
                key={day.dayKey}
                className="heatmap-cell"
                style={{ backgroundColor: cellColor(day.minutes, max) }}
                title={
                  day.minutes === null
                    ? ''
                    : `${day.dayKey}：${day.minutes ? formatMinutes(day.minutes) : '記録なし'}`
                }
              />
            ))}
          </div>
        ))}
      </div>
      <div className="heatmap-legend">
        <span>少ない</span>
        <span className="legend-swatch" style={{ backgroundColor: '#eef2f7' }} />
        <span className="legend-swatch" style={{ backgroundColor: '#d6e8df' }} />
        <span className="legend-swatch" style={{ backgroundColor: '#a8d3bd' }} />
        <span className="legend-swatch" style={{ backgroundColor: '#6cae8f' }} />
        <span className="legend-swatch" style={{ backgroundColor: '#3f8f6b' }} />
        <span>多い</span>
      </div>
    </div>
  );
}
