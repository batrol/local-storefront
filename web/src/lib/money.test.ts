import { describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import { formatCents, parseToCents } from './money'

describe('money', () => {
  it('parses comma and dot decimals to cents', () => {
    expect(parseToCents('19,90')).toBe(1990)
    expect(parseToCents('19.9')).toBe(1990)
    expect(parseToCents('1.250,00')).toBe(125000)
    expect(parseToCents('7')).toBe(700)
  })

  it('rejects invalid amounts', () => {
    expect(parseToCents('')).toBeNull()
    expect(parseToCents('abc')).toBeNull()
    expect(parseToCents('1,234')).toBeNull()
  })

  it('formats cents as BRL using the current language', async () => {
    expect(formatCents(1990)).toMatch(/R\$\s?19\.90/)
    await i18n.changeLanguage('pt-BR')
    expect(formatCents(1990)).toMatch(/R\$\s?19,90/)
  })
})
