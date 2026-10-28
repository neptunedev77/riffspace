import { ID_PATTERN, LIMITS } from '../domain/limits.ts'

const PREFIX_PATTERN = /^[a-z][a-z0-9]{0,11}$/

function randomPart(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback para contextos não seguros (http em rede local), onde randomUUID não existe.
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Cria um ID estável e único, p. ex. "gear-3f1c…". O prefixo identifica o
 * tipo de entidade e facilita a leitura de dados exportados.
 */
export function createId(prefix: string, random: () => string = randomPart): string {
  if (!PREFIX_PATTERN.test(prefix)) {
    throw new Error(`Invalid ID prefix: "${prefix}"`)
  }
  const id = `${prefix}-${random().toLowerCase()}`
  if (!isValidId(id)) {
    throw new Error(`Generated ID is invalid: "${id}"`)
  }
  return id
}

export function isValidId(value: unknown): value is string {
  return typeof value === 'string' && value.length <= LIMITS.id.max && ID_PATTERN.test(value)
}
