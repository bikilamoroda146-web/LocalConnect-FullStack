import Button from '../../components/common/Button'
export default function About() {
  const items = [
    ['What LocalConnect is', 'A frontend prototype of a two-sided marketplace. Customers discover local professionals and request bookings; providers manage services and requests; administrators review activity.'],
    ['What is simulated', 'Sign-in, bookings, favorites and availability all run in your browser using sample data and localStorage. There is no server, no shared data, no notifications and no payments.'],
    ['About verification and reviews', 'Verified marks and reviews come from sample data. Nothing is checked or verified by a real process. A production version needs a backend for authentication, identity checks and moderation.'],
  ]
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="text-3xl font-semibold sm:text-4xl">About this demo</h1>
      <div className="mt-8 space-y-8">{items.map(([h, t]) => <section key={h}><h2 className="text-xl font-semibold">{h}</h2><p className="mt-2 text-ink-soft">{t}</p></section>)}</div>
      <section className="mt-8"><h2 className="text-xl font-semibold">Demo accounts</h2>
        <ul className="mt-2 list-disc pl-5 text-ink-soft"><li>customer@demo.test</li><li>provider@demo.test</li><li>admin@demo.test</li></ul>
        <p className="mt-2 text-ink-soft">Use any password of 6 or more characters. Passwords are never stored.</p></section>
      <div className="mt-8 flex gap-3"><Button to="/login">Sign in</Button><Button to="/services" variant="secondary">Browse services</Button></div>
    </div>
  )
}
