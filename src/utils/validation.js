export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
const isTime = (value) => typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)
export const toMinutes = (value) => {
  if (!isTime(value)) return Number.NaN
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}
// Returns an error message or '' for a list of {start,end} ranges.
export function validateRanges(ranges) {
  for (const r of ranges) {
    if (!r.start || !r.end) return 'Enter a start and end time for every slot.'
    if (!isTime(r.start) || !isTime(r.end)) return 'Enter a valid start and end time for every slot.'
    if (toMinutes(r.end) <= toMinutes(r.start)) return 'Each slot must end after it starts.'
  }
  const sorted = [...ranges].sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
  for (let i = 1; i < sorted.length; i++) if (toMinutes(sorted[i].start) < toMinutes(sorted[i - 1].end)) return 'Time slots cannot overlap.'
  return ''
}
