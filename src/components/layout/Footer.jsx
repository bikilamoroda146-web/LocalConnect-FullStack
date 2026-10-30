import { Link } from 'react-router-dom'
import Logo from './Logo'
import { categories } from '../../data/categories'

function FooterGroup({ title, links }) {
  return (
    <nav aria-label={title}>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-sm text-slate-300">
        {links.map(([label, to]) => (
          <li key={label}>
            <Link to={to} className="inline-flex min-h-6 items-center rounded-sm transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default function Footer() {
  const exploreLinks = [
    ['Browse all services', '/services'],
    ['About this demo', '/about'],
    ['How it works', '/#how-it-works'],
  ]
  const providerLinks = [
    ['Join as a provider', '/register?role=provider'],
    ['Provider dashboard', '/provider'],
  ]
  const categoryLinks = categories.map((category) => [
    category.name,
    `/services?category=${category.id}`,
  ])

  return (
    <footer className="mt-auto bg-navy text-slate-300">
      <div className="container-page grid gap-x-8 gap-y-10 py-10 sm:grid-cols-2 sm:py-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-300">
            A frontend demo of a local services marketplace. No real bookings, payments, or verification take place.
          </p>
        </div>
        <FooterGroup title="Explore" links={exploreLinks} />
        <FooterGroup title="Services" links={categoryLinks} />
        <FooterGroup title="For providers" links={providerLinks} />
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} LocalConnect demo. All sample names, prices, and reviews are illustrative.
      </div>
    </footer>
  )
}
