// Google Calendar のイベント配列を、集計しやすい「勉強記録」に変換する。
//
// 仕様（タスク定義）:
//   集計対象 : タイトルが「勉強：」で始まるイベント
//   除外対象 : タイトルに「講義」を含むイベント
//   科目名   : 「勉強：」の直後〜「（」の直前の文字列
//   学習時間 : メモ欄（description）の「学習時間: XXX分」を正規表現で抽出。
//             取得できなければ開始〜終了時刻の差分（分）を使う。
//
// 実データには仕様どおりの整形済みイベント（例:「勉強：化学（重要問題集 1〜32）」）と、
// 自由記述のイベント（例:「勉強：物理のエッセンス」「勉強:重問2完了」）が混在する。
// そのため以下を堅牢に処理する:
//   - 全角「：」/ 半角「:」の両方を許容
//   - description の HTML（<p> 等）を除去
//   - タイトルから科目が決まらない場合は description の「科目:」やキーワード推定で補完

import { SUBJECTS, OTHER_SUBJECT, KEYWORD_TO_SUBJECT } from '../config/subjects.js';
import { toDayKey } from './dateUtils.js';

// 「勉強：」または「勉強:」で始まるか（直後がコロン）。「勉強記録：」等は対象外。
const STUDY_PREFIX = /^勉強\s*[：:]\s*/;

// description から「学習時間: 120分」を抜く
const STUDY_MINUTES = /学習時間\s*[：:]\s*([0-9]+)\s*分/;
// description の「科目: 化学」を抜く
const SUBJECT_FIELD = /科目\s*[：:]\s*([^\s（(\n]+)/;
const UNDERSTANDING_FIELD = /理解度\s*[：:]\s*([^\s\n]+)/;
const CONCENTRATION_FIELD = /集中度\s*[：:]\s*([^\n]+)/;

// HTML タグを除去し、<br> や </p><p> を改行に変換してプレーンテキスト化
export function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\/\s*p\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\r\n/g, '\n')
    .trim();
}

// 文字列の中から既知のキーワードで科目を推定。見つからなければ null。
function inferSubjectByKeyword(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const [keyword, subject] of KEYWORD_TO_SUBJECT) {
    if (lower.includes(keyword.toLowerCase())) return subject;
  }
  return null;
}

// タイトル・description から科目（7科目 or その他）と教材名を決める
function resolveSubject(titleBody, descriptionText) {
  // titleBody = 「勉強：」を取り除いた残り
  let material = titleBody.trim();
  let subjectRaw = titleBody.trim();

  // 「（…）」/「(...)」があれば、その前を科目、中を教材とみなす
  const parenMatch = titleBody.match(/[（(]/);
  if (parenMatch) {
    const idx = parenMatch.index;
    subjectRaw = titleBody.slice(0, idx).trim();
    const inner = titleBody.slice(idx + 1).replace(/[）)]\s*$/, '').trim();
    material = inner || subjectRaw;
  }

  // 1) 科目名がそのまま7科目に一致
  if (SUBJECTS.includes(subjectRaw)) {
    return { subject: subjectRaw, material };
  }
  // 2) description の「科目:」フィールド
  const fieldMatch = descriptionText.match(SUBJECT_FIELD);
  if (fieldMatch && SUBJECTS.includes(fieldMatch[1])) {
    return { subject: fieldMatch[1], material };
  }
  // 3) タイトル本文・description からキーワード推定
  const inferred =
    inferSubjectByKeyword(subjectRaw) ||
    inferSubjectByKeyword(titleBody) ||
    inferSubjectByKeyword(descriptionText);
  if (inferred) {
    return { subject: inferred, material };
  }
  // 4) 不明 → その他
  return { subject: OTHER_SUBJECT, material };
}

// イベントの開始/終了から分を計算（dateTime が無い終日イベント等は 0）
function durationFromTimes(event) {
  const startIso = event.start?.dateTime;
  const endIso = event.end?.dateTime;
  if (!startIso || !endIso) return 0;
  const start = new Date(startIso);
  const end = new Date(endIso);
  const min = Math.round((end - start) / 60000);
  // 不正値（負・日跨ぎの極端値）は除外
  if (!Number.isFinite(min) || min <= 0 || min > 24 * 60) return 0;
  return min;
}

// 1イベント → 勉強記録 or null（対象外）
export function parseEvent(event) {
  const title = (event.summary || '').trim();
  if (!STUDY_PREFIX.test(title)) return null; // 「勉強：」で始まらない
  if (title.includes('講義')) return null; // 除外対象

  const titleBody = title.replace(STUDY_PREFIX, '');
  const descriptionText = stripHtml(event.description);

  const { subject, material } = resolveSubject(titleBody, descriptionText);

  // 学習時間: description 優先、無ければ時刻差分
  const minutesMatch = descriptionText.match(STUDY_MINUTES);
  let durationMin;
  let durationSource;
  if (minutesMatch) {
    durationMin = Number(minutesMatch[1]);
    durationSource = 'description';
  } else {
    durationMin = durationFromTimes(event);
    durationSource = 'duration';
  }
  if (!durationMin || durationMin <= 0) return null; // 時間不明は集計対象外

  const startIso = event.start?.dateTime || event.start?.date;
  const startDate = startIso ? new Date(startIso) : null;
  if (!startDate || Number.isNaN(startDate.getTime())) return null;

  const understanding = descriptionText.match(UNDERSTANDING_FIELD)?.[1] || null;
  const concentration = descriptionText.match(CONCENTRATION_FIELD)?.[1]?.trim() || null;

  return {
    id: event.id,
    title,
    subject,
    material,
    durationMin,
    durationSource,
    start: startDate,
    dayKey: toDayKey(startDate),
    understanding,
    concentration,
    htmlLink: event.htmlLink || null,
  };
}

// イベント配列 → 勉強記録配列（対象外は除外、日付昇順）
export function parseEvents(events = []) {
  return events
    .map(parseEvent)
    .filter(Boolean)
    .sort((a, b) => a.start - b.start);
}
