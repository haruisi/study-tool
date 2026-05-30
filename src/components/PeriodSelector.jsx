const OPTIONS = [
  { value: 'week', label: '今週' },
  { value: 'month', label: '今月' },
  { value: 'past3months', label: '過去3ヶ月' },
];

export default function PeriodSelector({ value, onChange }) {
  return (
    <div className="period-selector" role="tablist" aria-label="期間切り替え">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          role="tab"
          aria-selected={value === opt.value}
          className={`period-btn ${value === opt.value ? 'active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
