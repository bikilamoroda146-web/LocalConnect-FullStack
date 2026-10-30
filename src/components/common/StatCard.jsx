export default function StatCard({ icon: Icon, label, value, note }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink-soft">{label}</p>
        {Icon && <Icon size={20} className="text-brand" aria-hidden="true" />}
      </div>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      {note && <p className="mt-1 text-sm text-ink-muted">{note}</p>}
    </div>
  )
}
