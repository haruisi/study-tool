import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { colorForSubject } from '../config/subjects.js';
import { formatMinutes } from '../lib/aggregate.js';

export default function SubjectPieChart({ data }) {
  const total = data.reduce((s, d) => s + d.minutes, 0);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="minutes"
          nameKey="subject"
          cx="50%"
          cy="50%"
          outerRadius="78%"
          innerRadius="45%"
          paddingAngle={1}
          label={({ subject, minutes }) =>
            total ? `${subject} ${Math.round((minutes / total) * 100)}%` : subject
          }
          labelLine={false}
        >
          {data.map((d) => (
            <Cell key={d.subject} fill={colorForSubject(d.subject)} />
          ))}
        </Pie>
        <Tooltip formatter={(value, name) => [formatMinutes(value), name]} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
