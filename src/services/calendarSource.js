// データソースの切り替え。
//   - OAuth クライアントIDが設定済み & サインイン済み → 実際の Google Calendar から取得
//   - それ以外 → バンドル済みデータ（events.json）
//
// events.json は GitHub Actions の定期実行（scripts/fetchCalendar.mjs）で
// 毎日カレンダーから自動更新される。手動取得や CI 前の初期値も同ファイル。
// どちらも「生のイベント配列」を返し、parseEvents.js で勉強記録へ変換する。

import bundledEvents from '../data/events.json';
import { isLiveConfigured, fetchEvents } from './googleCalendar.js';

// 過去3ヶ月強をカバーする取得範囲（live API 用）
function defaultRange(now = new Date()) {
  const timeMax = new Date(now.getTime() + 24 * 3600 * 1000); // 明日まで
  const timeMin = new Date(now.getTime() - 100 * 24 * 3600 * 1000); // 約100日前
  return { timeMin: timeMin.toISOString(), timeMax: timeMax.toISOString() };
}

// 生イベント配列を返す。useLive=true かつ設定済みなら API、そうでなければサンプル。
export async function loadEvents({ useLive = false } = {}) {
  if (useLive && isLiveConfigured()) {
    const { timeMin, timeMax } = defaultRange();
    return fetchEvents({ timeMin, timeMax });
  }
  return bundledEvents;
}

export function liveAvailable() {
  return isLiveConfigured();
}
