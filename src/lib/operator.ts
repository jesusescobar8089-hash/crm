export const PRIMARY_OPERATOR_ID = 'socioPrincipal'
export const PRIMARY_OPERATOR_LABEL = 'Socio principal'
export const PRIMARY_OPERATOR_EMAIL = 'jesusandres-1991@hotmail.com'

const OPERATOR_LABELS: Record<string, string> = {
  [PRIMARY_OPERATOR_ID]: PRIMARY_OPERATOR_LABEL,
  socioA: PRIMARY_OPERATOR_LABEL,
  socioB: PRIMARY_OPERATOR_LABEL,
  ambos: PRIMARY_OPERATOR_LABEL,
  sistema: 'Sistema',
  Sistema: 'Sistema',
}

export const OPERATOR_OPTIONS = [
  { value: PRIMARY_OPERATOR_ID, label: PRIMARY_OPERATOR_LABEL },
] as const

export function getOperatorLabel(value: string | null | undefined) {
  if (!value) return 'Sin responsable'
  return OPERATOR_LABELS[value] ?? value
}

export function getOperatorValue(value: string | null | undefined) {
  if (!value || value === 'socioA' || value === 'socioB' || value === 'ambos') {
    return PRIMARY_OPERATOR_ID
  }

  return value
}
