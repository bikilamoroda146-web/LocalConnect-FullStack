export default function Tabs({ tabs, value, onChange, label = 'Sections' }) {
  return (
    <div role="group" aria-label={label} className="flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((t) => (
        <button key={t.id} type="button" aria-pressed={value === t.id} onClick={() => onChange(t.id)}
          className={`-mb-px flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-4 text-sm font-semibold transition-colors ${value === t.id ? 'border-brand text-brand-800' : 'border-transparent text-ink-muted hover:text-ink'}`}>
          {t.label}
          {t.count !== undefined && <span className="rounded bg-slate-100 px-1.5 text-xs text-ink-soft">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}
