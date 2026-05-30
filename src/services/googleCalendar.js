// Google Calendar API（ブラウザ側 OAuth2）クライアント。
//
// Google Identity Services (GIS) のトークンクライアントでアクセストークンを取得し、
// Calendar REST API v3 の events.list を叩いてイベントを取得する。
//
// 利用には Google Cloud で発行した OAuth クライアントIDが必要。
//   .env に VITE_GOOGLE_CLIENT_ID と（必要なら）VITE_CALENDAR_ID を設定する。
//   未設定の場合はバンドル済みサンプルデータで動作する（calendarSource.js 参照）。

const GIS_SRC = 'https://accounts.google.com/gsi/client';
const SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

export const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
export const CALENDAR_ID =
  import.meta.env.VITE_CALENDAR_ID || 'hi.haru08@icloud.com';

export function isLiveConfigured() {
  return Boolean(CLIENT_ID);
}

let gisLoaded = null;
function loadGis() {
  if (gisLoaded) return gisLoaded;
  gisLoaded = new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve();
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google Identity Services の読み込みに失敗しました'));
    document.head.appendChild(script);
  });
  return gisLoaded;
}

let accessToken = null;

// OAuth2 でアクセストークンを取得（ポップアップ同意）
export async function signIn() {
  if (!CLIENT_ID) throw new Error('VITE_GOOGLE_CLIENT_ID が未設定です');
  await loadGis();
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (resp) => {
        if (resp.error) return reject(new Error(resp.error));
        accessToken = resp.access_token;
        resolve(accessToken);
      },
    });
    client.requestAccessToken({ prompt: '' });
  });
}

export function isSignedIn() {
  return Boolean(accessToken);
}

export function signOut() {
  if (accessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(accessToken, () => {});
  }
  accessToken = null;
}

// 指定期間のイベントを全ページ取得して返す（生のイベント配列）
export async function fetchEvents({ timeMin, timeMax, calendarId = CALENDAR_ID }) {
  if (!accessToken) await signIn();

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

    const url = `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${params}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Calendar API エラー (${res.status}): ${body}`);
    }
    const data = await res.json();
    events.push(...(data.items || []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return events;
}
