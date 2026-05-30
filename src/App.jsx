import { useEffect, useState, useCallback } from 'react';
import PeriodSelector from './components/PeriodSelector.jsx';
import Dashboard from './components/Dashboard.jsx';
import { parseEvents } from './lib/parseEvents.js';
import { loadEvents, liveAvailable } from './services/calendarSource.js';
import { signIn, signOut, isSignedIn } from './services/googleCalendar.js';

export default function App() {
  const [period, setPeriod] = useState('past3months');
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState(null);
  const [live, setLive] = useState(false); // 実カレンダー接続中か
  const now = new Date();

  const load = useCallback(async (useLive) => {
    setStatus('loading');
    setError(null);
    try {
      const events = await loadEvents({ useLive });
      setRecords(parseEvents(events));
      setLive(useLive && isSignedIn());
      setStatus('ready');
    } catch (e) {
      setError(e.message || String(e));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const handleConnect = async () => {
    try {
      await signIn();
      await load(true);
    } catch (e) {
      setError(e.message || String(e));
      setStatus('error');
    }
  };

  const handleDisconnect = () => {
    signOut();
    load(false);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          <h1>学習記録ダッシュボード</h1>
          <p className="app-source">
            {live ? 'Google Calendar（接続中）' : 'カレンダーデータ（毎日自動更新）'}
          </p>
        </div>
        <div className="app-actions">
          <PeriodSelector value={period} onChange={setPeriod} />
          {liveAvailable() &&
            (live ? (
              <button className="link-btn" onClick={handleDisconnect}>
                切断
              </button>
            ) : (
              <button className="link-btn" onClick={handleConnect}>
                Googleカレンダーに接続
              </button>
            ))}
        </div>
      </header>

      <main className="app-main">
        {status === 'loading' && <div className="state-msg">読み込み中…</div>}
        {status === 'error' && (
          <div className="state-msg error">
            データの取得に失敗しました：{error}
            <button className="link-btn" onClick={() => load(false)}>
              サンプルデータで再表示
            </button>
          </div>
        )}
        {status === 'ready' && (
          <Dashboard records={records} period={period} now={now} />
        )}
      </main>

      <footer className="app-footer">
        集計対象：タイトルが「勉強：」で始まるイベント（「講義」を含むものは除外）
      </footer>
    </div>
  );
}
