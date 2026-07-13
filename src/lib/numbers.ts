export function numberInputValue(value: number) {
  return Number.isFinite(value) && value !== 0 ? String(value) : ''
}

export function parseNumberInput(value: string) {
  if (value.trim() === '') return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}
