const TOKEN_KEY = 'pl.token'
const BASE = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: Record<string, string[]> = {},
  ) {
    super(message)
  }
}

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

type Json = Record<string, unknown> | unknown[]

export async function api<T>(method: string, path: string, body?: Json): Promise<T> {
  const token = tokenStore.get()
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError(res.status, data.message ?? 'Erro inesperado', data.errors ?? {})
  }
  return data as T
}

/** First validation message returned by the API, if any. */
export function firstError(e: unknown): string {
  if (e instanceof ApiError) {
    const first = Object.values(e.errors)[0]?.[0]
    return first ?? e.message
  }
  return 'Erro inesperado'
}
