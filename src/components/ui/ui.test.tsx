import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button.tsx'
import { Chip } from './Chip.tsx'
import { Input } from './Input.tsx'

describe('Button', () => {
  it('é type="button" por omissão e dispara onClick', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Guardar</Button>)
    const button = screen.getByRole('button', { name: 'Guardar' })
    expect(button).toHaveAttribute('type', 'button')
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('desativado não dispara onClick', () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Guardar
      </Button>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('Chip', () => {
  it('sem onToggle é texto estático, não um botão', () => {
    render(<Chip>Doom</Chip>)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText('Doom')).toBeInTheDocument()
  })

  it('com onToggle alterna aria-pressed', () => {
    function Toggle() {
      const [on, setOn] = useState(false)
      return (
        <Chip selected={on} onToggle={() => setOn(!on)}>
          Djent
        </Chip>
      )
    }
    render(<Toggle />)
    const chip = screen.getByRole('button', { name: 'Djent' })
    expect(chip).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('Input', () => {
  it('associa rótulo, ajuda e erro ao campo', () => {
    render(<Input label="Nickname" hint="Até 24 caracteres" error="Obrigatório" value="" onChange={() => {}} />)
    const input = screen.getByLabelText('Nickname')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Até 24 caracteres Obrigatório')
    expect(screen.getByText('Obrigatório')).toHaveAttribute('id', input.getAttribute('aria-describedby')?.split(' ')[1])
  })

  it('mostra o contador quando há maxLength', () => {
    render(<Input label="Tagline" maxLength={80} value="riff" onChange={() => {}} />)
    expect(screen.getByText('4/80')).toBeInTheDocument()
  })
})
