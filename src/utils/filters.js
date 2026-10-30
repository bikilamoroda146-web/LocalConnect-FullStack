import { categoryById } from '../data/categories'

export const defaultFilters = { q: '', category: '', location: '', min: '', max: '', rating: 0, sort: 'relevance' }

export function servicePrice(service) {
  const value = service?.price
  if (value === '' || value === null || value === undefined) return null
  const price = Number(value)
  return Number.isFinite(price) && price > 0 ? price : null
}

export function priceRangeError(filters) {
  const { min, max } = filters
  const hasMin = min !== ''
  const hasMax = max !== ''
  const minValue = hasMin ? Number(min) : null
  const maxValue = hasMax ? Number(max) : null

  if ((hasMin && (!Number.isFinite(minValue) || minValue < 0)) ||
    (hasMax && (!Number.isFinite(maxValue) || maxValue < 0))) {
    return 'Enter valid non-negative minimum and maximum prices.'
  }
  if (hasMin && hasMax && minValue > maxValue) return 'Minimum price must not exceed maximum price.'
  return ''
}

function providerMap(providers) {
  return new Map(providers.map((provider) => [provider.id, provider]))
}

function usableRating(provider) {
  const rating = Number(provider?.rating)
  const reviews = Number(provider?.reviews)
  return Number.isFinite(rating) && rating > 0 && rating <= 5 && Number.isFinite(reviews) && reviews > 0
}

export function filterServices(list, filters = defaultFilters, providers = []) {
  const f = { ...defaultFilters, ...filters }
  const providerById = providerMap(providers)
  const query = String(f.q ?? '').trim().toLowerCase()
  const terms = query ? query.split(/\s+/) : []
  const min = f.min === '' ? null : Number(f.min)
  const max = f.max === '' ? null : Number(f.max)

  const matches = list.filter((service) => {
    if (!service?.published) return false
    if (f.category && service.category !== f.category) return false
    if (f.location && service.area !== f.location) return false

    if (min !== null || max !== null) {
      const price = servicePrice(service)
      if (price === null || (min !== null && price < min) || (max !== null && price > max)) return false
    }

    const provider = providerById.get(service.providerId)
    const rating = usableRating(provider) ? Number(provider.rating) : null
    if (f.rating && (rating === null || rating < Number(f.rating))) return false

    if (terms.length) {
      const searchable = [
        service.title,
        service.desc,
        provider?.name,
        provider?.profession,
        categoryById(service.category)?.name,
        service.area,
      ].filter(Boolean).join(' ').toLowerCase()
      if (!terms.every((term) => searchable.includes(term))) return false
    }
    return true
  })

  const score = (service) => {
    if (!terms.length) return 0
    const provider = providerById.get(service.providerId)
    const title = String(service.title ?? '').toLowerCase()
    const description = String(service.desc ?? '').toLowerCase()
    const providerName = String(provider?.name ?? '').toLowerCase()
    const profession = String(provider?.profession ?? '').toLowerCase()
    const category = String(categoryById(service.category)?.name ?? '').toLowerCase()
    const location = String(service.area ?? '').toLowerCase()
    return terms.reduce((total, term) => total
      + (title.includes(term) ? 8 : 0)
      + (description.includes(term) ? 4 : 0)
      + (providerName.includes(term) ? 3 : 0)
      + (profession.includes(term) ? 2 : 0)
      + (category.includes(term) ? 2 : 0)
      + (location.includes(term) ? 1 : 0), 0)
  }
  const rating = (service) => {
    const provider = providerById.get(service.providerId)
    return usableRating(provider) ? Number(provider.rating) : null
  }
  const titleOrder = (a, b) => String(a.title ?? '').localeCompare(String(b.title ?? ''))
  const ratingDescending = (a, b) => {
    const aRating = rating(a), bRating = rating(b)
    if (aRating === null) return bRating === null ? titleOrder(a, b) : 1
    if (bRating === null) return -1
    return bRating - aRating || titleOrder(a, b)
  }

  const sorters = {
    relevance: (a, b) => terms.length
      ? score(b) - score(a) || ratingDescending(a, b)
      : ratingDescending(a, b),
    'price-asc': (a, b) => {
      const aPrice = servicePrice(a), bPrice = servicePrice(b)
      if (aPrice === null) return bPrice === null ? titleOrder(a, b) : 1
      if (bPrice === null) return -1
      return aPrice - bPrice || titleOrder(a, b)
    },
    'price-desc': (a, b) => {
      const aPrice = servicePrice(a), bPrice = servicePrice(b)
      if (aPrice === null) return bPrice === null ? titleOrder(a, b) : 1
      if (bPrice === null) return -1
      return bPrice - aPrice || titleOrder(a, b)
    },
    rating: ratingDescending,
  }
  return [...matches].sort(sorters[f.sort] ?? sorters.relevance)
}

export const activeFilterChips = (filters) => {
  const f = { ...defaultFilters, ...filters }
  const chips = []
  if (f.q.trim()) chips.push({ key: 'q', label: `“${f.q.trim()}”` })
  if (f.category) chips.push({ key: 'category', label: categoryById(f.category)?.name ?? f.category })
  if (f.location) chips.push({ key: 'location', label: f.location })
  if (f.min !== '') chips.push({ key: 'min', label: `Min ETB ${f.min}` })
  if (f.max !== '') chips.push({ key: 'max', label: `Max ETB ${f.max}` })
  if (f.rating) chips.push({ key: 'rating', label: `${f.rating}+ stars` })
  return chips
}
