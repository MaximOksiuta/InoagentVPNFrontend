const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8080'

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  token?: string
  body?: unknown
}

export type BinaryResponse = {
  blob: Blob
  contentType: string | null
  disposition: string | null
}

type ErrorResponse = {
  message?: string
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    let payload: ErrorResponse | null = null

    try {
      payload = (await response.json()) as ErrorResponse
    } catch {
      payload = null
    }

    throw new ApiError(payload?.message ?? 'Ошибка запроса к API.', response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export async function apiBinaryRequest(path: string, options: RequestOptions = {}): Promise<BinaryResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    let payload: ErrorResponse | null = null

    try {
      payload = (await response.json()) as ErrorResponse
    } catch {
      payload = null
    }

    throw new ApiError(payload?.message ?? 'Ошибка запроса к API.', response.status)
  }

  return {
    blob: await response.blob(),
    contentType: response.headers.get('Content-Type'),
    disposition: response.headers.get('Content-Disposition'),
  }
}
