// Single source of truth for allowed status transitions.
export const STATUS = {
  pending: { label: 'Pending', tone: 'amber' },
  confirmed: { label: 'Confirmed', tone: 'green' },
  completed: { label: 'Completed', tone: 'blue' },
  cancelled: { label: 'Cancelled', tone: 'slate' },
  rejected: { label: 'Declined', tone: 'red' },
}
const TRANSITIONS = {
  pending: { customer: ['cancelled'], provider: ['confirmed', 'rejected'] },
  confirmed: { customer: ['cancelled'], provider: ['completed', 'cancelled'] },
  completed: { customer: [], provider: [] },
  cancelled: { customer: [], provider: [] },
  rejected: { customer: [], provider: [] },
}
export const allowedNext = (status, actor) => TRANSITIONS[status]?.[actor] ?? []
export const canTransition = (from, to, actor) => allowedNext(from, actor).includes(to)
export const isUpcoming = (b, today) => b.status === 'confirmed' && b.date >= today
export const canReschedule = (b, today) => (b.status === 'pending' || b.status === 'confirmed') && b.date > today
