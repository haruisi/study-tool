import { formatMinutes } from '../lib/aggregate.js';
import { colorForSubject } from '../config/subjects.js';

export default function SummaryCards({ stats }) {
  const items = [
    { label: '合計学習時間', value: formatMinutes(stats.totalMin) },
    { label: '勉強した日数', value: `${stats.studyDays}日` },
    { label: '1日あたり平均', value: formatMinutes(stats.avgPerDayMin) },
    { label: '学習回数', value: `${stats.sessions}回` },
    {
      label: '最も時間をかけた科目',
      value: stats.topSubject || '—',
      color: stats.topSubject ? colorForSubject(stats.topSubject) : undefined,
    },
  ];

  return (
    <div className="summary-cards">
      {items.map((it) => (
        <div className="summary-card" key={it.label}>
          <div className="summary-label">{it.label}</div>
          <div className="summary-value" style={it.color ? { color: it.color } : undefined}>
            {it.value}
          </div>
        </div>
      ))}
    </div>
  );
}
