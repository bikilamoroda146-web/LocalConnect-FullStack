import { ChevronLeft, ChevronRight } from 'lucide-react'
export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null
  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-2">
      <button onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Previous page" className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white disabled:opacity-40"><ChevronLeft size={18} /></button>
      <span className="px-2 text-sm text-ink-soft">Page {page} of {pages}</span>
      <button onClick={() => onChange(page + 1)} disabled={page === pages} aria-label="Next page" className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white disabled:opacity-40"><ChevronRight size={18} /></button>
    </nav>
  )
}
