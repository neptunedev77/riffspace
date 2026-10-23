import { useId, type InputHTMLAttributes } from 'react'
import { cx } from '../../lib/cx.ts'
import styles from './Input.module.css'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  hint?: string
  error?: string
}

/** Campo de texto com rótulo, ajuda, erro e contador quando há maxLength. */
export function Input({ label, hint, error, maxLength, value, className, ...rest }: InputProps) {
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
      <input
        id={id}
        className={styles.input}
        value={value}
        maxLength={maxLength}
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
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
