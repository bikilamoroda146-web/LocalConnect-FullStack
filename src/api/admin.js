import { getCsrfToken, requestJson } from './auth'

export async function fetchPendingProviders() {
  const body = await requestJson('/api/v1/admin/providers/pending')
  return body.data
}

export async function decideProvider(providerId, decision) {
  const token = await getCsrfToken()
  const body = await requestJson(`/api/v1/admin/providers/${providerId}/${decision}`, { method: 'POST', headers: { 'X-CSRF-Token': token } })
  return body.data
}


export async function fetchAdminUsers() {
  const body = await requestJson('/api/v1/admin/users')
  return body.data
}

export async function updateAdminUserStatus(userId, status) {
  const token = await getCsrfToken()
  const body = await requestJson(`/api/v1/admin/users/${encodeURIComponent(userId)}/status`, {
    method: 'PATCH',
    headers: { 'X-CSRF-Token': token },
    body: JSON.stringify({ status: status.toUpperCase() }),
  })
  return body.data
}
