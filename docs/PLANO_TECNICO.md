# Plano técnico — RIFFSPACE

Documento curto de arquitetura e decisões. Atualizado no fim de cada etapa.

## Ambiente verificado (Etapa 0, 2026-10-23)

| Ferramenta | Versão                         |
| ---------- | ------------------------------ |
| SO         | Windows 11 Pro 10.0.26300      |
| Node.js    | 24.21.0                        |
| npm        | 11.19.0                        |
| pnpm       | não instalado                  |
| Git        | 2.55.0.windows.5               |

A pasta do projeto estava vazia e não era um repositório Git.

## Stack

| Área            | Escolha                          | Estado      |
| --------------- | -------------------------------- | ----------- |
| Aplicação       | React 19 + TypeScript 6 + Vite 8 | instalado   |
| Testes          | Vitest 5 + Testing Library + jsdom | instalado |
| Lint            | oxlint                           | instalado   |
| Estilos         | CSS com design tokens (custom properties) + CSS Modules | instalado (Etapa 1) |
| Ícones          | Lucide React                     | instalado (Etapa 1) |
| Fontes          | Fontsource local: Inter, Big Shoulders Display, JetBrains Mono | instalado (Etapa 1) |
| Animação        | CSS + Canvas 2D (Etapa 1); Motion só se a Etapa 6 o justificar | parcial |
| Estado          | Zustand (store única do perfil, persistência separada) | Etapa 2 |
| Validação       | Zod (schemas para localStorage e import JSON) | Etapa 2 |
| Formulários     | React Hook Form, apenas se o editor o justificar | Etapa 3 |
| Drag-and-drop   | dnd-kit (com botões mover ←/→ acessíveis como base) | Etapa 4 |
| Router          | React Router (vista de edição vs. vista pública) | Etapa 5 |
| E2E             | Playwright, se viável            | Etapa 7     |

## Decisões e justificações

1. **npm** como gestor único: já disponível, pnpm não está instalado.
   Lockfile: `package-lock.json`.
2. **oxlint em vez de ESLint.** O template oficial do Vite (create-vite 9)
   já vem com oxlint; é muito mais rápido, tem os plugins `react`,
   `typescript` e `oxc`, e evita a cadeia de dependências do ESLint. O script
   usa `--deny-warnings` para que avisos falhem o CI. Se faltarem regras
   (p. ex. type-aware), reavalia-se a adição do ESLint.
3. **TypeScript estrito explícito** (`strict` + `noUncheckedIndexedAccess`),
   para cumprir "evitar `any`" e forçar tratamento de acessos a arrays/mapas,
   relevante para dados lidos do `localStorage` e de JSON importado.
4. **CSS com design tokens em vez de Tailwind.** Os três temas (Obsidian,
   Blood Moon, Frozen Abyss) mapeiam-se de forma natural para conjuntos de
   custom properties trocados num atributo `data-theme`; efeitos de vidro,
   blur e iluminação ficam mais legíveis em CSS próprio. Decisão de baixo
   risco, revisível na Etapa 1.
5. **Dependências mínimas na Etapa 0**: só o necessário para arrancar,
   tipar, testar e fazer lint. Restantes bibliotecas entram na etapa que as
   usa.
6. **Template limpo**: removidos os assets e o CSS de demonstração do Vite;
   favicon substituído por um ícone SVG original.

## Arquitetura alvo

Segue a secção 2.13 da especificação, criada de forma incremental:

- `domain/` — tipos e invariantes (perfil, banda, álbum, gear, tema). Sem React.
- `lib/persistence`, `lib/validation`, `lib/export-import` — funções puras
  de serialização/validação/migração, testadas isoladamente.
- `data/` — catálogo e perfil de demonstração, marcados como demonstração.
- `features/` — editor de perfil, seletor de bandas, rig builder, partilha.
- `components/` — UI reutilizável e layout.

Regra: a UI nunca lê `localStorage` diretamente; passa sempre pela camada de
persistência, que valida com Zod e devolve um resultado seguro (dados ou
fallback com erro explicável).

## Riscos

| Risco | Mitigação |
| ----- | --------- |
| Efeitos visuais pesados (WebGL/partículas) prejudicarem desempenho e acessibilidade | Efeitos opcionais, lazy-loaded, desativados com `prefers-reduced-motion` |
| Direitos de imagem (capas, logótipos, fotos de artistas) | Sem imagens de terceiros; arte abstrata original e nomes em texto |
| Imagens grandes no `localStorage` (limite ~5 MB) | Avatar por URL ou estilos predefinidos; upload limitado e comprimido, se existir |
| Mudanças de schema perderem dados | Schema versionado + funções de migração testadas |
| Partilha parecer "publicada" sem backend | Apenas export/import JSON; nenhum botão "copiar link" sem URL real |
| Versões muito recentes (TS 6, Vite 8, Vitest 5) com incompatibilidades de plugins | Verificar compatibilidade antes de cada nova dependência |

## Decisões em aberto (para confirmar)

- Manter oxlint vs. adicionar ESLint.
- CSS próprio com tokens vs. Tailwind.
- Inicializar repositório Git agora (recomendado) — não foi feito sem confirmação.

## Etapa 1 — decisões

1. **Tokens em dois níveis.** `tokens.css` (tipografia, espaço, raios, blur,
   movimento) é independente do tema; `themes.css` redefine só as cores.
   Contraste: `--accent-text` existe à parte de `--accent` porque o carmesim
   de preenchimento não tem 4.5:1 como texto sobre fundo escuro.
2. **Arte generativa determinística** (`lib/art`): FNV-1a + mulberry32 geram
   capas (5 padrões) e o sigilo do avatar a partir de uma seed. As primitivas
   usam "tintas" semânticas mapeadas para tokens, por isso a arte muda com o
   tema. Resolve a restrição de direitos de imagem sem placeholders genéricos.
3. **Partículas em Canvas 2D**, não WebGL: ≤70 partículas, DPR limitado a 2,
   pausa fora do ecrã/separador escondido, um único frame estático com
   `prefers-reduced-motion`. Cor e direção vêm dos tokens do tema.
4. **Tema aplicado em `useLayoutEffect`**: garante que `data-theme` está
   definido antes dos efeitos passivos dos filhos (o canvas lê os tokens).
5. **Motion não instalado**: CSS transitions/keyframes chegaram para a Etapa 1.
6. **Controlos planeados**: "Editar perfil" está `disabled`, com badge
   "Em breve" e `aria-label` explícito, em vez de um botão decorativo.
7. **Fontes importadas por CSS** (`styles/fonts.css`): os `exports` de um dos
   pacotes Fontsource não declaram tipos para o import sem extensão.

### Verificação manual (browser integrado, dev server)

- 1440×900, 1280×800, 1024, 900, 768, 390, 360 e 320 px: `scrollWidth ===
  clientWidth` em todas (sem overflow horizontal da página). A cadeia de sinal
  tem scroll horizontal interno entre 640 e ~1150 px e passa a vertical abaixo
  de 640 px.
- Os três temas trocados por clique e por setas do teclado.
- Ordem de tabulação: skip link → logo → navegação → grupo de temas → nós da rig;
  foco visível com contorno `--focus`.
- Consola sem erros.
- `prefers-reduced-motion` **não foi emulado no browser** (o painel não o
  permite); está coberto por regras CSS e pela lógica do `AmbientCanvas`, a
  rever manualmente na Etapa 6.
