import type { PaginationMeta } from '@/types'

// --- Result types ---
export type SuccessResult<T> = { ok: true; data: T; meta?: PaginationMeta }
export type ErrorResult = { ok: false; message: string; status?: number }
export type ApiResult<T> = SuccessResult<T> | ErrorResult

interface RequestOptions {
  method?: string
  body?: Record<string, unknown> | FormData
  params?: Record<string, unknown>
}

const BASE_URL = 'http://127.0.0.1:8000'

function getToken(): string | null {
  return localStorage.getItem('auth_token')
}

function buildUrl(path: string, params?: Record<string, unknown>): string {
  const url = new URL(`${BASE_URL}${path}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value))
      }
    })
  }
  return url.toString()
}

// Menyamakan struktur response backend sebelum dikembalikan ke UI
function normalizeResponse<T>(raw: unknown): Omit<SuccessResult<T>, 'ok'> {
  const res = raw as { data: T; meta?: PaginationMeta }
  return {
    data: res.data,
    ...(res.meta ? { meta: res.meta } : {}),
  }
}

// Menggabungkan error validasi per-field menjadi satu pesan string
function normalizeError(raw: unknown, status: number): ErrorResult {
  const res = raw as { message?: string; errors?: Record<string, string[]> }
  if (res.errors) {
    const combined = Object.entries(res.errors)
      .map(([field, msgs]) => `${field}: ${msgs[0]}`)
      .join('; ')
    return { ok: false, message: combined, status }
  }
  return {
    ok: false,
    message: res.message ?? 'Terjadi kesalahan. Silakan coba lagi.',
    status,
  }
}

class ApiClient {
  private static instance: ApiClient

  // Singleton — hanya satu instance di seluruh aplikasi
  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient()
    }
    return ApiClient.instance
  }

  private async request<T>(
    path: string,
    { method = 'GET', body, params }: RequestOptions = {}
  ): Promise<ApiResult<T>> {
    const url = buildUrl(path, params)
    const headers: Record<string, string> = {}

    // Sisipkan token otomatis
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`

    // Tambahkan Content-Type hanya jika bukan FormData
    if (body && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json'
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body instanceof FormData
          ? body
          : body ? JSON.stringify(body) : undefined,
      })

      // Handle 401 global — redirect ke login
      if (response.status === 401) {
        localStorage.removeItem('auth_token')
        window.location.href = '/login'
        return { ok: false, message: 'Sesi habis. Silakan login kembali.', status: 401 }
      }

      const data = await response.json()

      if (!response.ok) {
        return normalizeError(data, response.status)
      }

      return { ok: true, ...normalizeResponse<T>(data) }
    } catch {
      return { ok: false, message: 'Tidak dapat terhubung ke server.' }
    }
  }

  get<T>(path: string, params?: Record<string, unknown>) {
    return this.request<T>(path, { method: 'GET', params })
  }

  post<T>(path: string, body?: Record<string, unknown> | FormData) {
    return this.request<T>(path, { method: 'POST', body })
  }

  put<T>(path: string, body?: Record<string, unknown>) {
    return this.request<T>(path, { method: 'PUT', body })
  }

  patch<T>(path: string, body?: Record<string, unknown>) {
    return this.request<T>(path, { method: 'PATCH', body })
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' })
  }
}

export const api = ApiClient.getInstance()
