export default function PageHeader({ title, text, action }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>{text && <p className="mt-1 text-ink-soft">{text}</p>}</div>
      {action}
    </div>
  )
}
