import { mockFetch, renderWithProviders } from '@/test/render'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import en from './locales/en.json'
import ptBR from './locales/pt-BR.json'
import { LoginPage } from '@/pages/LoginPage'

function keys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? keys(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`],
  )
}

describe('i18n', () => {
  it('has the same keys in English and pt-BR', () => {
    expect(keys(ptBR).sort()).toEqual(keys(en).sort())
  })

  it('switches the interface to pt-BR and remembers the choice', async () => {
    mockFetch(() => ({}))
    renderWithProviders(<LoginPage />, '/login')
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()

    await userEvent.selectOptions(screen.getByLabelText('Language'), 'pt-BR')
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(localStorage.getItem('sf.lang')).toBe('pt-BR')
  })

  it('sends the current language to the API', async () => {
    const fetchMock = mockFetch(() => ({ message: 'x', errors: {} }), 422)
    renderWithProviders(<LoginPage />, '/login')
    await userEvent.selectOptions(screen.getByLabelText('Language'), 'pt-BR')
    await userEvent.type(screen.getByLabelText('E-mail'), 'a@b.co')
    await userEvent.type(screen.getByLabelText('Senha'), 'x')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(headers['Accept-Language']).toBe('pt-BR')
  })
})
