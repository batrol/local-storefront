export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** "19,90", "19.90" or "1.250,00" -> cents. Returns null when not a valid amount. */
export function parseToCents(input: string): number | null {
  const raw = input.trim()
  // With a comma, dots are thousands separators; without one, a dot is the decimal mark.
  const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null
  return Math.round(parseFloat(normalized) * 100)
}
