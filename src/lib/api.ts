const API_BASE = '/api/v1'

// All API routes return { success: boolean, data?: T, error?: string, message?: string }
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export type ApiEnvelope<T> = ApiResponse<T> & Record<string, unknown>

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | undefined>
}

async function requestApi<T>(endpoint: string, options: FetchOptions = {}): Promise<ApiEnvelope<T>> {
  const { params, ...fetchOptions } = options

  let url = `${API_BASE}${endpoint}`

  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) url += `?${queryString}`
  }

  const body = fetchOptions.body
  const headers = new Headers(fetchOptions.headers)
  const isFormDataBody = typeof FormData !== 'undefined' && body instanceof FormData

  if (!isFormDataBody && body !== undefined && body !== null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  })

  if (!response.ok) {
    const contentType = response.headers.get('content-type') || ''
    const isJson = contentType.includes('application/json')
    const errorPayload = isJson
      ? await response.json().catch(() => null)
      : null

    if (response.status === 401 || response.status === 403) {
      throw new Error(
        errorPayload?.error ||
          errorPayload?.message ||
          'Sesi anda telah tamat atau tidak sah. Sila log masuk semula.',
      )
    }

    throw new Error(
      errorPayload?.error ||
        errorPayload?.message ||
        (isJson ? `HTTP ${response.status}` : 'Network error'),
    )
  }

  const json: ApiEnvelope<T> = await response.json()

  if (!json.success) {
    throw new Error(json.error || json.message || 'Request failed')
  }

  return json
}

export async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const json = await requestApi<T>(endpoint, options)

  // Unwrap the data envelope — callers receive the payload directly
  return json.data as T
}

export async function apiFetchEnvelope<T>(endpoint: string, options: FetchOptions = {}): Promise<ApiEnvelope<T>> {
  return requestApi<T>(endpoint, options)
}

export const api = {
  get: <T>(endpoint: string, params?: Record<string, string | number | undefined>) =>
    apiFetch<T>(endpoint, { method: 'GET', params }),

  getEnvelope: <T>(endpoint: string, params?: Record<string, string | number | undefined>) =>
    apiFetchEnvelope<T>(endpoint, { method: 'GET', params }),

  post: <T>(endpoint: string, body?: unknown) =>
    apiFetch<T>(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),

  postForm: <T>(endpoint: string, body: FormData) =>
    apiFetch<T>(endpoint, { method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown) =>
    apiFetch<T>(endpoint, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),

  delete: <T>(endpoint: string, params?: Record<string, string | number | undefined>) =>
    apiFetch<T>(endpoint, { method: 'DELETE', params }),
}

export type AuthSession = {
  role: 'staff' | 'admin' | 'developer'
  expiresAt: number
}
