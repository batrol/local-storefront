import { mockFetch, renderWithProviders } from '@/test/render'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { LoginPage } from './LoginPage'

const shop = { id: 1, name: 'Loja', slug: 'loja', phone: null }
const user = { id: 1, name: 'Ana', email: 'ana@example.com', shop }

function ui() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/painel" element={<p>Painel</p>} />
    </Routes>
  )
}

describe('LoginPage', () => {
  it('shows validation errors without calling the API', async () => {
    const fetchMock = mockFetch(() => ({}))
    renderWithProviders(ui(), '/login')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('E-mail inválido')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('logs in, stores the token and goes to the panel', async () => {
    mockFetch(() => ({ token: 'tok', user: { data: user } }))
    renderWithProviders(ui(), '/login')
    await userEvent.type(screen.getByLabelText('E-mail'), 'ana@example.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'segredo123')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    await waitFor(() => expect(screen.getByText('Painel')).toBeInTheDocument())
    expect(localStorage.getItem('pl.token')).toBe('tok')
  })

  it('shows the API error on bad credentials', async () => {
    mockFetch(() => ({ message: 'Credenciais inválidas', errors: { email: ['Credenciais inválidas'] } }), 422)
    renderWithProviders(ui(), '/login')
    await userEvent.type(screen.getByLabelText('E-mail'), 'ana@example.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'errada')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciais inválidas')
  })
})
