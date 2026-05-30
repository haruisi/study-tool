// グラフ1枚を囲む共通カード。タイトル＋空データ時のプレースホルダを担当。

export default function ChartCard({ title, subtitle, isEmpty, emptyText, children }) {
  return (
    <section className="card">
      <header className="card-header">
        <h2>{title}</h2>
        {subtitle && <p className="card-subtitle">{subtitle}</p>}
      </header>
      <div className="card-body">
        {isEmpty ? (
          <div className="empty-state">{emptyText || 'この期間の記録はありません'}</div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
