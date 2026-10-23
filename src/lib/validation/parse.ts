import type { z } from 'zod'
import type { Profile } from '../../domain/profile.ts'
import { profileSchema } from './schemas.ts'

export interface ValidationIssue {
  /** Caminho do campo, p. ex. "rig.2.brand"; vazio para a raiz. */
  path: string
  message: string
}

export type ParseResult<T> = { ok: true; value: T } | { ok: false; issues: ValidationIssue[] }

export function toIssues(error: z.ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.map(String).join('.'),
    message: issue.message,
  }))
}

/** Valida dados desconhecidos (localStorage, JSON importado) como Profile. */
export function parseProfile(input: unknown): ParseResult<Profile> {
  const result = profileSchema.safeParse(input)
  // A atribuição a Profile garante, em compile time, que o schema e a interface coincidem.
  if (result.success) {
    const value: Profile = result.data
    return { ok: true, value }
  }
  return { ok: false, issues: toIssues(result.error) }
}

/** Valida um campo isolado e devolve a primeira mensagem de erro, se houver. */
export function validateField(schema: z.ZodType, value: unknown): string | undefined {
  const result = schema.safeParse(value)
  return result.success ? undefined : result.error.issues[0]?.message
}
