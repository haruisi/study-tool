// 日付ユーティリティ。
// カレンダーの時刻は UTC（…Z）で届くが、「何日に勉強したか」は
// 利用者のローカル（日本時間）で集計したいので、JST 基準で日付キーを作る。

export const STUDY_TIME_ZONE = 'Asia/Tokyo';

const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: STUDY_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

// Date → 'YYYY-MM-DD'（JST基準）
export function toDayKey(date) {
  // en-CA ロケールは YYYY-MM-DD 形式を返す
  return dayKeyFormatter.format(date);
}

// 'YYYY-MM-DD'（JSTの暦日）→ その日の正午UTC寄りのDate。
// 暦計算（曜日・週・月）に使う安定した代表点。
export function dayKeyToDate(dayKey) {
  // JST 12:00 として解釈（DST非対象の地域なので安全）
  return new Date(`${dayKey}T12:00:00+09:00`);
}

// JSTの曜日（0=日 … 6=土）
export function jstWeekday(dayKey) {
  return dayKeyToDate(dayKey).getDay();
}

// 月曜始まりの週の月曜の dayKey を返す
export function startOfWeekKey(dayKey) {
  const d = dayKeyToDate(dayKey);
  const weekday = d.getDay(); // 0=日
  const diff = (weekday + 6) % 7; // 月曜までの戻り日数
  d.setDate(d.getDate() - diff);
  return toDayKey(d);
}

// dayKey に日数を加算した dayKey
export function addDays(dayKey, days) {
  const d = dayKeyToDate(dayKey);
  d.setDate(d.getDate() + days);
  return toDayKey(d);
}

// 今日（JST）の dayKey
export function todayKey(now = new Date()) {
  return toDayKey(now);
}

// 期間（今週／今月／過去3ヶ月）の [開始dayKey, 終了dayKey]（両端含む）を返す
export function periodRange(period, now = new Date()) {
  const today = todayKey(now);
  if (period === 'week') {
    const start = startOfWeekKey(today);
    const end = addDays(start, 6);
    return { start, end };
  }
  if (period === 'month') {
    const [y, m] = today.split('-').map(Number);
    const start = `${y}-${String(m).padStart(2, '0')}-01`;
    // 翌月1日の前日 = 月末
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const end = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { start, end };
  }
  // past3months: 今日を含む過去3ヶ月（約90日）
  const start = addDays(today, -89);
  return { start, end: today };
}

// dayKey が [start, end]（両端含む）の範囲内か
export function inRange(dayKey, start, end) {
  return dayKey >= start && dayKey <= end;
}

// 'YYYY-MM-DD' → 'M/D' の短い表示
export function shortDate(dayKey) {
  const [, m, d] = dayKey.split('-').map(Number);
  return `${m}/${d}`;
}

// ISO日時 → JSTの 'M/D HH:mm'
const dateTimeFormatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: STUDY_TIME_ZONE,
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function formatDateTime(date) {
  return dateTimeFormatter.format(date);
}
