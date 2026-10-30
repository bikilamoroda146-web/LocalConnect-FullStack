export const formatPrice = (n) => `ETB ${Number(n).toLocaleString('en-US')}`
export const priceLabel = (s) => {
  const lead = s.unit === 'estimate' ? 'Estimate' : s.unit === 'from' ? 'From' : 'From'
  const suffix = s.unit === 'estimate' || s.unit === 'from' ? '' : ` ${s.unit}`
  return `${lead} ${formatPrice(s.price)}${suffix}`
}
export const formatDate = (iso) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
export const initials = (name) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
export const todayISO = () => new Date().toISOString().slice(0, 10)
export const TODAY = '2026-10-25'
