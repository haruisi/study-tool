import { useMemo } from 'react';
import { periodRange } from '../lib/dateUtils.js';
import {
  filterByPeriod,
  subjectTotals,
  heatmapGrid,
  weeklyTrend,
  summary,
} from '../lib/aggregate.js';
import SummaryCards from './SummaryCards.jsx';
import ChartCard from './ChartCard.jsx';
import SubjectBarChart from './SubjectBarChart.jsx';
import SubjectPieChart from './SubjectPieChart.jsx';
import StudyHeatmap from './StudyHeatmap.jsx';
import WeeklyTrendChart from './WeeklyTrendChart.jsx';

const PERIOD_LABEL = { week: '今週', month: '今月', past3months: '過去3ヶ月' };

export default function Dashboard({ records, period, now }) {
  const view = useMemo(() => {
    const range = periodRange(period, now);
    const inPeriod = filterByPeriod(records, range);
    return {
      range,
      inPeriod,
      totals: subjectTotals(inPeriod),
      grid: heatmapGrid(inPeriod, range),
      trend: weeklyTrend(inPeriod, range),
      stats: summary(inPeriod),
    };
  }, [records, period, now]);

  const label = PERIOD_LABEL[period];
  const noData = view.inPeriod.length === 0;

  return (
    <div className="dashboard">
      <SummaryCards stats={view.stats} />

      <div className="grid">
        <ChartCard
          title="科目別 学習時間"
          subtitle={`${label}・科目ごとの合計時間（分）`}
          isEmpty={view.totals.length === 0}
        >
          <SubjectBarChart data={view.totals} />
        </ChartCard>

        <ChartCard
          title="科目バランス"
          subtitle={`${label}・科目ごとの時間の割合`}
          isEmpty={view.totals.length === 0}
        >
          <SubjectPieChart data={view.totals} />
        </ChartCard>

        <ChartCard
          title="学習ヒートマップ"
          subtitle={`${label}・勉強した日と量`}
          isEmpty={noData}
        >
          <StudyHeatmap grid={view.grid} />
        </ChartCard>

        <ChartCard
          title="週次推移"
          subtitle={`${label}・科目ごとの週別合計時間の推移`}
          isEmpty={view.trend.subjects.length === 0}
        >
          <WeeklyTrendChart rows={view.trend.rows} subjects={view.trend.subjects} />
        </ChartCard>
      </div>
    </div>
  );
}
