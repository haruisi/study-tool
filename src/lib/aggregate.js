// 勉強記録の集計ロジック（4つのビュー用のデータを作る）。

import { SUBJECTS } from '../config/subjects.js';
import { orderSubjects } from '../config/subjects.js';
import {
  inRange,
  startOfWeekKey,
  addDays,
  shortDate,
  jstWeekday,
} from './dateUtils.js';

// 期間 [start, end] 内の記録だけに絞る
export function filterByPeriod(records, range) {
  return records.filter((r) => inRange(r.dayKey, range.start, range.end));
}

// 科目別の合計時間（分）。記録のある科目のみ、固定順で返す。
// → 今週の棒グラフ / 今月の円グラフ 両方で使う。
export function subjectTotals(records) {
  const totals = new Map();
  for (const r of records) {
    totals.set(r.subject, (totals.get(r.subject) || 0) + r.durationMin);
  }
  const ordered = orderSubjects([...totals.keys()]);
  return ordered.map((subject) => ({ subject, minutes: totals.get(subject) }));
}

// 日別の合計時間（分）。dayKey → minutes。
export function dailyTotals(records) {
  const totals = new Map();
  for (const r of records) {
    totals.set(r.dayKey, (totals.get(r.dayKey) || 0) + r.durationMin);
  }
  return totals;
}

// ヒートマップ用グリッド。
// 期間を覆う「週（月曜始まり）×曜日」のマス目を作り、各日の合計分を持たせる。
export function heatmapGrid(records, range) {
  const totals = dailyTotals(records);
  const firstWeek = startOfWeekKey(range.start);

  const weeks = [];
  let cursor = firstWeek;
  // range.end を含む週まで
  while (cursor <= startOfWeekKey(range.end)) {
    const days = [];
    for (let i = 0; i < 7; i += 1) {
      const dayKey = addDays(cursor, i);
      const within = inRange(dayKey, range.start, range.end);
      days.push({
        dayKey,
        minutes: within ? totals.get(dayKey) || 0 : null, // 期間外は null（描画しない）
        label: shortDate(dayKey),
      });
    }
    weeks.push({ weekKey: cursor, days });
    cursor = addDays(cursor, 7);
  }

  const max = Math.max(0, ...[...totals.values()]);
  return { weeks, max };
}

// 週次推移：週ごと×科目ごとの合計時間。
// 折れ線グラフ用に [{ weekKey, label, 英語: 120, 化学: 60, ... }, ...] を返す。
export function weeklyTrend(records, range) {
  const firstWeek = startOfWeekKey(range.start);
  const lastWeek = startOfWeekKey(range.end);

  // 週の枠を先に作る
  const weekKeys = [];
  let cursor = firstWeek;
  while (cursor <= lastWeek) {
    weekKeys.push(cursor);
    cursor = addDays(cursor, 7);
  }

  // 週 → 科目 → 分
  const byWeek = new Map(weekKeys.map((w) => [w, new Map()]));
  const subjectsPresent = new Set();
  for (const r of records) {
    if (!inRange(r.dayKey, range.start, range.end)) continue;
    const wk = startOfWeekKey(r.dayKey);
    if (!byWeek.has(wk)) byWeek.set(wk, new Map());
    const m = byWeek.get(wk);
    m.set(r.subject, (m.get(r.subject) || 0) + r.durationMin);
    subjectsPresent.add(r.subject);
  }

  const subjects = orderSubjects([...subjectsPresent]);
  const rows = weekKeys.map((wk) => {
    const m = byWeek.get(wk) || new Map();
    const row = { weekKey: wk, label: shortDate(wk) };
    for (const s of subjects) row[s] = m.get(s) || 0;
    return row;
  });

  return { rows, subjects };
}

// 概要サマリー（合計時間・勉強日数・1日平均・最頻科目）
export function summary(records) {
  const totalMin = records.reduce((sum, r) => sum + r.durationMin, 0);
  const days = new Set(records.map((r) => r.dayKey));
  const totals = subjectTotals(records);
  const top = totals.reduce(
    (best, t) => (t.minutes > (best?.minutes || 0) ? t : best),
    null
  );
  return {
    totalMin,
    studyDays: days.size,
    avgPerDayMin: days.size ? Math.round(totalMin / days.size) : 0,
    topSubject: top?.subject || null,
    sessions: records.length,
  };
}

// 分 → 「Xh Ym」表記
export function formatMinutes(min) {
  if (!min) return '0分';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

export { SUBJECTS, jstWeekday };
