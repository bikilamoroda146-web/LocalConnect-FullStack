import { Link } from 'react-router-dom'
export default function Logo({ light }) {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2 rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2" aria-label="LocalConnect home">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="7" fill={light ? '#fff' : '#2563EB'} />
        <path d="M9 17l5 5 9-11" stroke={light ? '#2563EB' : '#fff'} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className={`whitespace-nowrap text-lg font-bold tracking-tight ${light ? 'text-white' : 'text-navy'}`}>LocalConnect</span>
    </Link>
  )
}
