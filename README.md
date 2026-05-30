# 学習記録ダッシュボード

Google Calendar（`hi.haru08@icloud.com`）の勉強記録を読み取り、科目別に分析・可視化する Web アプリです。React + Recharts で実装しています。

## 機能（4つのビュー）

1. **科目別 棒グラフ** — 科目ごとの合計学習時間（分）
2. **科目バランス 円グラフ** — 科目ごとの時間の割合
3. **学習ヒートマップ** — 勉強した日・量を色の濃淡で表示
4. **週次推移 折れ線グラフ** — 科目ごとの週別合計時間の推移

- 期間切り替え（**今週／今月／過去3ヶ月**）で4ビューすべてが連動
- 科目の色は7科目（英語・数学・化学・物理・国語・地理・情報）で**固定統一**
- スマホでも見やすいレスポンシブ対応

## セットアップ

```bash
npm install
npm run dev      # 開発サーバ（http://localhost:5173）
npm run build    # 本番ビルド（dist/）
npm test         # パーサーのユニットテスト
```

初期状態では、実カレンダーから取得した**サンプルデータ**（`src/data/events.sample.json`）で動作します。

## Google Calendar 連携（任意）

実際のカレンダーに接続して最新データを表示するには、OAuth2 を設定します。

1. Google Cloud Console で **Calendar API** を有効化
2. OAuth 2.0 クライアント ID（ウェブアプリケーション）を作成し、承認済み JavaScript 生成元に開発/公開URL（例 `http://localhost:5173`）を追加
3. `.env.example` をコピーして `.env` を作成し、クライアントIDを設定

```bash
cp .env.example .env
# VITE_GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
```

設定後、画面右上の「Googleカレンダーに接続」ボタンからサインインすると、`calendar.readonly` スコープで直近約100日分のイベントを取得します。

## データ仕様と解析ルール

`src/lib/parseEvents.js` がイベントを勉強記録へ変換します。

| 項目 | ルール |
| --- | --- |
| 集計対象 | タイトルが「**勉強：**」で始まるイベント（全角「：」/半角「:」の両方を許容） |
| 除外対象 | タイトルに「**講義**」を含むイベント |
| 科目名 | 「勉強：」の直後〜「（」の直前の文字列 |
| 学習時間 | メモ欄の「**学習時間: XXX分**」を正規表現で抽出。無ければ開始〜終了時刻の差分を使用 |

### 実データへの対応

実際のカレンダーには、仕様どおりに整形されたイベント（例：`勉強：化学（重要問題集 1〜32）`／メモに `学習時間: 120分`）と、自由記述のイベント（例：`勉強：物理のエッセンス`、`勉強:重問2完了`）が混在します。そこで本アプリは次の補完を行います。

- メモ欄の HTML（`<p>` 等）を除去してプレーンテキスト化
- タイトルに「（）」が無い場合は、メモ欄の `科目:` フィールド、続いて**教材名のキーワード推定**（`src/config/subjects.js` の `KEYWORD_TO_SUBJECT`）で7科目へ正規化
- 7科目に当てはまらないものは「その他」に分類

教材名と科目の対応は `src/config/subjects.js` で編集できます（例：`鉄壁`→英語、`鎌田の理論化学`→化学、`物理のエッセンス`→物理）。

> 注：カレンダーの時刻は UTC で届きますが、「何日に勉強したか」は日本時間（Asia/Tokyo）基準で集計します。

## ディレクトリ構成

```
src/
  config/subjects.js        7科目の固定色・キーワード推定マップ
  lib/parseEvents.js        イベント → 勉強記録（仕様＋実データ対応）
  lib/aggregate.js          4ビュー用の集計
  lib/dateUtils.js          期間レンジ・JST日付処理
  services/googleCalendar.js  OAuth2 + Calendar API クライアント
  services/calendarSource.js  ライブ取得 / サンプルの切り替え
  data/events.sample.json   実カレンダーから取得したサンプル
  components/               PeriodSelector・各グラフ・Dashboard
```
