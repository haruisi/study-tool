import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { colorForSubject } from '../config/subjects.js';
import { formatMinutes } from '../lib/aggregate.js';

export default function SubjectBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="subject" tick={{ fontSize: 12 }} interval={0} />
        <YAxis
          tick={{ fontSize: 12 }}
          label={{ value: '分', angle: 0, position: 'top', offset: 10, fontSize: 12 }}
        />
        <Tooltip
          formatter={(value) => [formatMinutes(value), '学習時間']}
          labelFormatter={(l) => l}
        />
        <Bar dataKey="minutes" radius={[4, 4, 0, 0]} maxBarSize={64}>
          {data.map((d) => (
            <Cell key={d.subject} fill={colorForSubject(d.subject)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
