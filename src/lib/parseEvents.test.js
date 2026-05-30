import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEvent, parseEvents, stripHtml } from './parseEvents.js';
import sample from '../data/events.sample.json' with { type: 'json' };

function ev(summary, description, startIso, endIso) {
  return {
    id: Math.random().toString(36).slice(2),
    summary,
    description,
    start: { dateTime: startIso },
    end: { dateTime: endIso },
  };
}

test('stripHtml は <p> や <br> を除去して改行にする', () => {
  assert.equal(stripHtml('<p>あ<br>い</p>'), 'あ\nい');
  assert.equal(stripHtml('<p>科目: 化学</p>'), '科目: 化学');
});

test('仕様どおりのイベント：科目はタイトルの括弧前、学習時間は description から', () => {
  const r = parseEvent(
    ev(
      '勉強：化学（重要問題集　1〜32）',
      '<p>科目: 化学\n学習時間: 120分</p>',
      '2026-05-03T04:00:00Z',
      '2026-05-03T06:00:00Z'
    )
  );
  assert.equal(r.subject, '化学');
  assert.equal(r.durationMin, 120);
  assert.equal(r.durationSource, 'description');
});

test('学習時間が無ければ開始〜終了の差分を使う', () => {
  const r = parseEvent(
    ev('勉強：物理のエッセンス', '<p>運動方程式</p>', '2026-03-30T00:30:00Z', '2026-03-30T01:25:00Z')
  );
  assert.equal(r.subject, '物理'); // キーワード推定
  assert.equal(r.durationMin, 55);
  assert.equal(r.durationSource, 'duration');
});

test('半角コロン「勉強:」も対象、キーワードで化学に分類', () => {
  const r = parseEvent(ev('勉強:重問2完了', undefined, '2026-04-02T15:30:00Z', '2026-04-02T16:30:00Z'));
  assert.equal(r.subject, '化学');
  assert.equal(r.durationMin, 60);
});

test('「勉強：」で始まらないイベントは対象外', () => {
  assert.equal(parseEvent(ev('物理', '<p>x</p>', '2026-05-19T02:30:00Z', '2026-05-19T03:15:00Z')), null);
  assert.equal(
    parseEvent(ev('勉強記録：鉄壁', '<p>x</p>', '2026-03-29T12:15:00Z', '2026-03-29T12:55:00Z')),
    null
  );
});

test('「講義」を含むタイトルは除外', () => {
  assert.equal(
    parseEvent(ev('勉強：講義の復習', '<p>x</p>', '2026-05-01T01:00:00Z', '2026-05-01T02:00:00Z')),
    null
  );
});

test('サンプルデータ：対象外2件を除いた件数が解析される', () => {
  const records = parseEvents(sample);
  // 25件中、勉強記録：/ 物理（勉強なし）の2件を除外 → 23件
  assert.equal(records.length, 23);
  // すべて durationMin > 0
  assert.ok(records.every((r) => r.durationMin > 0));
});
