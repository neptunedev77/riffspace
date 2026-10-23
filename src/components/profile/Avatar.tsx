import { useState } from 'react'
import type { AvatarSpec } from '../../domain/profile.ts'
import { GenerativeArt } from '../art/GenerativeArt.tsx'

interface AvatarProps {
  avatar: AvatarSpec
  /** Seed do sigilo gerado (o nickname). */
  seed: string
  label: string
  className?: string
}

/**
 * Avatar do perfil. Com URL tenta carregar a imagem; se falhar (URL quebrado,
 * bloqueado ou que não é uma imagem) mostra o sigilo gerado em vez de um ícone partido.
 */
export function Avatar({ avatar, seed, label, className }: AvatarProps) {
  // A chave por URL repõe o estado de erro quando o URL muda.
  if (avatar.kind === 'url') {
    return <UrlAvatar key={avatar.url} url={avatar.url} seed={seed} label={label} className={className} />
  }
  return <GenerativeArt variant="sigil" seed={seed} label={label} className={className} />
}

function UrlAvatar({ url, seed, label, className }: { url: string; seed: string; label: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <GenerativeArt variant="sigil" seed={seed} label={label} className={className} />
  return (
    <img
      src={url}
      alt={label}
      width={168}
      height={168}
      className={className}
      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
      referrerPolicy="no-referrer"
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}
