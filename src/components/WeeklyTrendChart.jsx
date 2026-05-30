import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { colorForSubject } from '../config/subjects.js';
import { formatMinutes } from '../lib/aggregate.js';

// 週次推移：科目ごとの週別合計時間の折れ線
export default function WeeklyTrendChart({ rows, subjects }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis
          tick={{ fontSize: 12 }}
          label={{ value: '分', position: 'top', offset: 10, fontSize: 12 }}
        />
        <Tooltip
          formatter={(value, name) => [formatMinutes(value), name]}
          labelFormatter={(l) => `${l} の週`}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {subjects.map((s) => (
          <Line
            key={s}
            type="monotone"
            dataKey={s}
            stroke={colorForSubject(s)}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
