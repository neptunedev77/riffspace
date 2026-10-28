import { mbidOf, type MusicSource } from './band.ts'

/** Álbum favorito. Na MusicBrainz corresponde a um "release group" do tipo álbum. */
export interface Album {
  id: string
  bandId: string
  title: string
  year?: number
  source: MusicSource
}

/**
 * Capa do álbum na Cover Art Archive (servida por eles, nunca copiada). É
 * derivada do MBID, por isso não se guardam URLs arbitrários no perfil.
 * Nem todos os álbuns têm capa: a UI usa arte gerada quando a imagem falha.
 */
export function albumCoverUrl(album: Album, size: 250 | 500 = 250): string | undefined {
  const mbid = mbidOf(album)
  return mbid ? `https://coverartarchive.org/release-group/${mbid}/front-${size}` : undefined
}
