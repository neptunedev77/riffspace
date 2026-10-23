# RIFFSPACE

Perfil visual interativo para metalheads e guitarristas: identidade musical
(bandas, álbuns, subgéneros) e a rig de guitarra numa página pessoal.

> **Estado:** Etapa 1 — design system e perfil de demonstração estático com
> três temas funcionais. Ainda sem edição nem persistência.
> Ver [docs/PLANO_TECNICO.md](docs/PLANO_TECNICO.md).

## Requisitos

- Node.js ≥ 22 (desenvolvido com Node 24.21.0)
- npm (gestor de pacotes único do projeto; o lockfile é `package-lock.json`)

Não são necessárias contas externas nem chaves API.

## Instalação

```bash
npm install
```

## Scripts

| Comando              | O que faz                                              |
| -------------------- | ------------------------------------------------------ |
| `npm run dev`        | Servidor de desenvolvimento Vite (http://localhost:5173) |
| `npm run typecheck`  | Verificação TypeScript estrita (`tsc -b`)              |
| `npm run lint`       | Lint com oxlint (avisos falham o comando)              |
| `npm run test`       | Testes unitários com Vitest + Testing Library (jsdom)  |
| `npm run test:watch` | Vitest em modo watch                                   |
| `npm run build`      | Typecheck + build de produção para `dist/`             |
| `npm run preview`    | Serve o build de produção localmente                   |
| `npm run check`      | typecheck → lint → test → build, em sequência          |

## Estrutura (atual)

```text
src/
  app/                App (composição da página)
  components/
    art/              GenerativeArt (capas/sigilos SVG) e AmbientCanvas (partículas)
    bands/            bandas e álbuns favoritos
    layout/           TopBar e Footer
    profile/          hero do perfil
    rig/              cadeia de sinal e detalhes do equipamento
    ui/               Button, Chip, Badge, Surface, Input, SectionHeader, ThemeSwitcher
  data/               catálogo, rig e perfil de DEMONSTRAÇÃO
  domain/             tipos e funções puras (perfil, banda, álbum, gear, tema)
  hooks/              useTheme, usePrefersReducedMotion
  lib/                cx, arte generativa determinística (seed/PRNG)
  styles/             fonts, tokens, themes, base
  tests/              setup do Vitest e testes de integração
docs/PLANO_TECNICO.md
```

Os testes unitários vivem junto ao código (`*.test.ts[x]`).

## Temas

`Obsidian`, `Blood Moon` e `Frozen Abyss` são conjuntos de custom properties em
`src/styles/themes.css`, aplicados com `<html data-theme="…">`. Mudar de tema
altera cores, superfícies, brilhos, a arte generativa e as partículas (brasas
que sobem ou gelo que cai).

## Conteúdo e direitos

- O perfil "Nocturne" é uma persona fictícia, assinalada na UI como demonstração.
- Bandas, álbuns e equipamento aparecem apenas como texto.
- Todas as imagens são arte abstrata original gerada localmente; não há
  logótipos, fotografias nem capas de terceiros.
- Fontes servidas localmente via Fontsource (licença OFL-1.1): Inter, Big
  Shoulders Display e JetBrains Mono.

## Limitações

- O perfil não é editável; o botão "Editar perfil" está desativado e marcado como "Em breve" (Etapa 3).
- O tema escolhido não é guardado após refresh (persistência na Etapa 2).
- Nada é publicado online.
