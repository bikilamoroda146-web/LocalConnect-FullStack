import { getCsrfToken } from './auth'

function queryString(params) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  })
  const query = search.toString()
  return query ? `?${query}` : ''
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, { ...options, credentials: 'include', headers: { 'Content-Type': 'application/json', ...options.headers } })
  let body = null
  try {
    body = await response.json()
  } catch {
    // The error below remains useful when the server returns a non-JSON response.
  }

  if (!response.ok) {
    const error = new Error(body?.error?.message || 'Could not load services.')
    error.status = response.status
    error.code = body?.error?.code
    throw error
  }

  return body
}

export async function createServiceRequest(service) {
  const csrfToken = await getCsrfToken()
  const body = await requestJson('/api/v1/services', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify({
      title: service.title,
      category: service.category,
      description: service.desc,
      price: service.price,
      priceUnit: service.unit,
      area: service.area,
      includes: service.includes ?? [],
      imageKey: /^https?:/i.test(service.image ?? '') ? service.image : null,
      published: true,
    }),
  })
  return normalizeService(body.data.service)
}

export async function fetchServices(params = {}) {
  return requestJson(`/api/v1/services${queryString(params)}`)
}

export async function fetchServiceById(id) {
  if (!id) throw new Error('A service ID is required.')
  const body = await requestJson(`/api/v1/services/${encodeURIComponent(id)}`)
  return normalizeService(body.data)
}

function browserImageReference(value) {
  if (typeof value !== 'string') return undefined
  return /^(https?:|data:|indexeddb:)/i.test(value) ? value : undefined
}

export function normalizeService(service) {
  const provider = service.provider
  return {
    ...service,
    published: service.published ?? true,
    desc: service.description,
    unit: service.priceUnit,
    image: browserImageReference(service.imageKey),
    provider: provider
      ? {
          ...provider,
          rating: service.averageRating,
          reviews: service.reviewCount,
          hue: provider.hue ?? 160,
        }
      : undefined,
  }
}
