let csrfToken

async function requestJson(url, options = {}) {
  const response = await fetch(url, { ...options, credentials: 'include', headers: { 'Content-Type': 'application/json', ...options.headers } })
  let body = null
  try { body = await response.json() } catch {}
  if (!response.ok) {
    const error = new Error(body?.error?.message || 'Booking request failed.')
    error.status = response.status
    error.code = body?.error?.code
    throw error
  }
  return body
}

async function getCsrfToken() {
  const body = await requestJson('/api/v1/auth/csrf')
  csrfToken = body.data.token
  return csrfToken
}

export async function createBookingRequest(input) {
  const token = csrfToken || await getCsrfToken()
  try {
    const body = await requestJson('/api/v1/bookings', {
      method: 'POST',
      headers: { 'X-CSRF-Token': token },
      body: JSON.stringify(input),
    })
    return body.data.booking
  } catch (error) {
    if (error.status === 403 || error.code === 'CSRF_INVALID') {
      csrfToken = await getCsrfToken()
      const body = await requestJson('/api/v1/bookings', {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken },
        body: JSON.stringify(input),
      })
      return body.data.booking
    }
    throw error
  }
}

export async function fetchBookings() {
  const body = await requestJson('/api/v1/bookings')
  return body.data
}

export function normalizeBooking(booking) {
  const date = typeof booking.date === 'string' ? booking.date.slice(0, 10) : booking.date
  const time = typeof booking.time === 'string' ? booking.time.slice(11, 16) : booking.time
  return {
    ...booking,
    date,
    time,
    status: booking.status.toLowerCase(),
    created: booking.createdAt?.slice(0, 10),
    updated: booking.updatedAt?.slice(0, 10),
    isRemote: true,
  }
}
