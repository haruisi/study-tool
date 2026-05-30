// Google Calendar から勉強記録イベントを取得し、src/data/events.json に書き出す。
//
// GitHub Actions の定期実行（cron）から呼ばれる想定。
// 認証は「サービスアカウント」を使う（対話的ログイン不要・トークン期限切れの心配なし）。
//   - 事前にカレンダーをサービスアカウントのメールアドレスに共有しておく必要がある。
//   - 秘密鍵JSONは環境変数 GOOGLE_SERVICE_ACCOUNT_KEY（GitHub Secret）から渡す。
//
// 依存ライブラリは使わず、Node 標準の crypto / fetch のみで実装。

import crypto from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, '..', 'src', 'data', 'events.json');

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const CALENDAR_ID = process.env.CALENDAR_ID || 'hi.haru08@icloud.com';
// 取得期間（過去約120日〜明日）。「過去3ヶ月」ビューを十分カバーする。
const LOOKBACK_DAYS = 120;

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}

// サービスアカウントの秘密鍵で JWT を署名し、アクセストークンを取得
async function getAccessToken(key) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(
    JSON.stringify({
      iss: key.client_email,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    })
  );
  const signingInput = `${header}.${claim}`;
  const signature = crypto
    .createSign('RSA-SHA256')
    .update(signingInput)
    .sign(key.private_key)
    .toString('base64url');
  const assertion = `${signingInput}.${signature}`;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!res.ok) {
    throw new Error(`トークン取得失敗 (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return data.access_token;
}

// 指定期間の「勉強」イベントを全ページ取得
async function fetchAllEvents(token) {
  const now = new Date();
  const timeMin = new Date(now.getTime() - LOOKBACK_DAYS * 86400000).toISOString();
  const timeMax = new Date(now.getTime() + 86400000).toISOString();

  const events = [];
  let pageToken;
  do {
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '250',
      q: '勉強',
    });
    if (pageToken) params.set('pageToken', pageToken);

    const url = `${CALENDAR_API}/calendars/${encodeURIComponent(CALENDAR_ID)}/events?${params}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      throw new Error(`イベント取得失敗 (${res.status}): ${await res.text()}`);
    }
    const data = await res.json();
    events.push(...(data.items || []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return events;
}

// パーサーが使うフィールドだけに絞る（ファイルを小さく保つ）
function trim(event) {
  return {
    id: event.id,
    summary: event.summary,
    description: event.description,
    start: event.start,
    end: event.end,
    htmlLink: event.htmlLink,
  };
}

async function main() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    // Secret 未設定なら、既存データを保持したままスキップ（ワークフローは赤くしない）
    console.warn(
      'GOOGLE_SERVICE_ACCOUNT_KEY が未設定のため、データ取得をスキップしました。' +
        '既存の events.json をそのまま使用します。'
    );
    return;
  }

  let key;
  try {
    key = JSON.parse(raw);
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY が有効なJSONではありません');
  }

  const token = await getAccessToken(key);
  const events = (await fetchAllEvents(token)).map(trim);

  writeFileSync(OUTPUT, JSON.stringify(events, null, 2) + '\n');
  console.log(`取得: ${events.length} 件 → ${OUTPUT}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
