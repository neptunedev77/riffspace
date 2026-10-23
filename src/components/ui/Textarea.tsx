import { useId, type TextareaHTMLAttributes } from 'react'
import { cx } from '../../lib/cx.ts'
import styles from './Input.module.css'

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string
  hint?: string
  error?: string
}

/** Área de texto com o mesmo contrato do Input: rótulo, ajuda, erro e contador. */
export function Textarea({ label, hint, error, maxLength, value, className, rows = 4, ...rest }: TextareaProps) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const length = typeof value === 'string' ? value.length : undefined

  return (
    <div className={cx(styles.field, error && styles.invalid, className)}>
      <div className={styles.labelRow}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {maxLength !== undefined && length !== undefined && (
          <span className={styles.counter} aria-hidden="true">
            {length}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        id={id}
        className={cx(styles.input, styles.textarea)}
        value={value}
        maxLength={maxLength}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={cx(hintId, errorId) || undefined}
        {...rest}
      />
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  )
}
