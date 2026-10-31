import { AuthProvider } from '@/auth/AuthContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'

export function renderWithProviders(ui: ReactElement, route = '/') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

export function mockFetch(handler: (url: string, init?: RequestInit) => unknown, status = 200) {
  const fn = vi.fn(async (url: string, init?: RequestInit) => {
    const body = handler(url, init)
    return { ok: status < 400, status, json: async () => body } as Response
  })
  vi.stubGlobal('fetch', fn)
  return fn
}
