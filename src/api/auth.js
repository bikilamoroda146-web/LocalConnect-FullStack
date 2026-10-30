let csrfToken

export async function requestJson(url, options = {}) {
  const response = await fetch(url, { ...options, credentials: 'include', headers: { 'Content-Type': 'application/json', ...options.headers } })
  let body = null
  try { body = await response.json() } catch {}
  if (!response.ok) {
    const error = new Error(body?.error?.message || 'Authentication request failed.')
    error.status = response.status
    error.code = body?.error?.code
    throw error
  }
  return body
}

export async function getCsrfToken() {
  const body = await requestJson('/api/v1/auth/csrf')
  csrfToken = body.data.token
  return csrfToken
}

export async function registerAccount({ name, email, password, role }) {
  const body = await requestJson('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role: role.toUpperCase() }),
  })
  return body.data
}

export async function loginAccount(email, password) {
  const body = await requestJson('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  return body.data
}

export async function fetchCurrentUser() {
  const body = await requestJson('/api/v1/auth/me')
  return body.data.user
}

export async function logoutAccount() {
  const token = csrfToken || await getCsrfToken()
  const body = await requestJson('/api/v1/auth/logout', { method: 'POST', headers: { 'X-CSRF-Token': token } })
  return body.data
}
