import Logo from '../../components/layout/Logo'
export default function AuthShell({ title, text, children, footer }) {
  return (
    <div className="container-page flex justify-center py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <div className="card p-6 sm:p-8">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-1 text-sm text-ink-soft">{text}</p>
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-4 text-center text-sm text-ink-soft">{footer}</p>
        <p className="mt-6 text-center text-xs text-ink-muted">Authentication is handled securely by the LocalConnect backend.</p>
      </div>
    </div>
  )
}
