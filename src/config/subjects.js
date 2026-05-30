// 科目の固定設定。
// 7科目（英語・数学・化学・物理・国語・地理・情報）には固定色を割り当て、
// グラフ・ヒートマップ・凡例すべてで色を統一する。

export const SUBJECTS = ['英語', '数学', '化学', '物理', '国語', '地理', '情報'];

// その他（7科目に当てはまらないもの）のラベル
export const OTHER_SUBJECT = 'その他';

// 科目ごとの固定色。どのビューでも同じ色を使う。
export const SUBJECT_COLORS = {
  英語: '#2563eb', // blue
  数学: '#dc2626', // red
  化学: '#16a34a', // green
  物理: '#9333ea', // purple
  国語: '#ea580c', // orange
  地理: '#0891b2', // cyan
  情報: '#ca8a04', // amber
  [OTHER_SUBJECT]: '#94a3b8', // slate（その他）
};

export function colorForSubject(subject) {
  return SUBJECT_COLORS[subject] || SUBJECT_COLORS[OTHER_SUBJECT];
}

// 表示順（凡例・グラフの並び）。その他は最後。
export function orderSubjects(subjects) {
  const known = SUBJECTS.filter((s) => subjects.includes(s));
  const rest = subjects
    .filter((s) => !SUBJECTS.includes(s) && s !== OTHER_SUBJECT)
    .sort((a, b) => a.localeCompare(b, 'ja'));
  const other = subjects.includes(OTHER_SUBJECT) ? [OTHER_SUBJECT] : [];
  return [...known, ...rest, ...other];
}

// タイトルに「（」が無い自由記述のイベント向けの、教材名 → 科目の推定マップ。
// 「勉強：物理のエッセンス」のような実データを7科目へ正規化するために使う。
// キーワードを順に部分一致で評価する（上から優先）。
export const KEYWORD_TO_SUBJECT = [
  // 英語
  ['鉄壁', '英語'],
  ['英単語', '英語'],
  ['ターゲット', '英語'],
  ['シス単', '英語'],
  ['ネクステ', '英語'],
  ['vintage', '英語'],
  ['英文法', '英語'],
  ['長文', '英語'],
  ['english', '英語'],
  // 物理
  ['物理のエッセンス', '物理'],
  ['名門の森', '物理'],
  ['名問の森', '物理'],
  ['良問の風', '物理'],
  ['物理', '物理'],
  ['力学', '物理'],
  ['電磁気', '物理'],
  // 化学
  ['鎌田', '化学'],
  ['理論化学', '化学'],
  ['重要問題集', '化学'],
  ['重問', '化学'],
  ['化学', '化学'],
  // 数学
  ['青チャート', '数学'],
  ['フォーカスゴールド', '数学'],
  ['focusgold', '数学'],
  ['数学', '数学'],
  ['数1', '数学'],
  ['数2', '数学'],
  ['数3', '数学'],
  ['数a', '数学'],
  ['数b', '数学'],
  ['数c', '数学'],
  ['良問500', '数学'],
  // 国語
  ['古文', '国語'],
  ['漢文', '国語'],
  ['現代文', '国語'],
  ['国語', '国語'],
  // 地理
  ['地理', '地理'],
  // 情報
  ['情報', '情報'],
];
