# RIFFSPACE

An interactive visual profile for metalheads and guitarists. Build a musical
identity — favourite bands, albums and subgenres — and showcase your guitar rig
as a signal chain, on a page that feels like a personal piece of art rather than
a dashboard.

> **Status:** early development. Musical identity editing and local persistence
> work end to end; the rig builder, public view and JSON export are next.

## Features

- **Demo profile** — a complete, clearly labelled demonstration profile with
  ranked bands, favourite albums and a guitar rig.
- **Profile editor** — a drawer with live preview: the page behind it updates as
  you type, and nothing is saved until you press _Save_. Edit nickname, display
  name, tagline, bio, location and avatar (generated sigil or image URL with a
  graceful fallback). Start from the demo or from a blank profile.
- **Musical identity** — search the local catalogue by name (accent- and
  case-insensitive) and filter by subgenre; rank favourite bands with
  accessible move up/down controls; pick favourite albums and subgenres; add,
  edit and delete custom bands and albums that are not in the catalogue.
- **Three themes** — _Obsidian_, _Blood Moon_ and _Frozen Abyss_. Switching
  themes changes colours, surfaces, glows, generated artwork and the ambient
  particle effect.
- **Interactive signal chain** — guitar → pedals → amp → cabinet. Select any
  piece of gear to inspect its details. The chain is a visual representation
  only; it does not validate electrical or audio compatibility.
- **Original generative artwork** — album covers, band art and the avatar
  sigil are deterministic SVGs generated from a seed. No third-party logos,
  photos or cover art are used.
- **Local persistence** — the profile and its preferences are saved in the
  browser with a versioned, validated schema. Corrupted or incompatible data
  never blocks start-up: the original is backed up and the demo profile loads
  instead, with a clear notice.
- **Accessible by default** — semantic HTML, keyboard navigation, visible
  focus, a skip link and `prefers-reduced-motion` support.
- **Responsive** — designed for desktop and verified down to 320 px wide.

## Tech stack

| Area          | Choice                                                    |
| ------------- | --------------------------------------------------------- |
| UI            | React 19, TypeScript 6 (strict), Vite 8                   |
| Styling       | CSS custom properties (design tokens) and CSS Modules     |
| Icons         | Lucide React                                              |
| Fonts         | Self-hosted via Fontsource (Inter, Big Shoulders Display, JetBrains Mono — OFL-1.1) |
| Effects       | CSS transitions and a lightweight Canvas 2D particle layer |
| State         | Zustand (vanilla store, injected through React context)   |
| Validation    | Zod                                                       |
| Persistence   | `localStorage` with a versioned document envelope         |
| Testing       | Vitest, Testing Library, jsdom                            |
| Linting       | oxlint                                                    |

No external accounts, API keys or network services are required.

## Getting started

### Prerequisites

- Node.js 22 or later
- npm (the project's only package manager; `package-lock.json` is committed)

### Install and run

```bash
npm install
npm run dev
```

The dev server runs at <http://localhost:5173>.

## Scripts

| Command              | Description                                          |
| -------------------- | ---------------------------------------------------- |
| `npm run dev`        | Start the Vite development server                    |
| `npm run typecheck`  | Type-check the project with `tsc -b`                 |
| `npm run lint`       | Lint with oxlint (warnings fail the run)             |
| `npm run test`       | Run the test suite once                              |
| `npm run test:watch` | Run tests in watch mode                              |
| `npm run build`      | Type-check and create a production build in `dist/`  |
| `npm run preview`    | Serve the production build locally                   |
| `npm run check`      | Run typecheck, lint, tests and build in sequence     |

## Project structure

```text
src/
  app/            Application root and page composition
  components/
    art/          Generative SVG artwork and the ambient particle canvas
    bands/        Favourite bands and albums
    layout/       Top bar and footer
    profile/      Profile hero
    rig/          Signal chain and gear details
    ui/           Reusable primitives (Button, Chip, Badge, Surface, Input, …)
  data/           Local demo catalogue, rig and profile; blank profile factory
  domain/         Types and pure domain logic (profile, band, album, gear, theme)
  features/
    band-selector/   Search, selection and custom-entry logic plus its editor tabs
    profile-editor/  Editor drawer, identity tab and validation-to-tab mapping
  hooks/          Shared React hooks
  lib/
    art/          Deterministic generative artwork (seeded PRNG)
    persistence/  Storage adapter, versioned document, migrations, repository
    validation/   Zod schemas, parsing and invariant normalisation
  state/          Profile store and its React provider
  styles/         Fonts, design tokens, themes and global styles
  tests/          Test setup, fixtures and integration tests
```

`domain/` and `lib/` have no React dependency. The UI never touches
`localStorage` directly: it goes through the store, which uses the repository.

Unit tests live next to the code they cover (`*.test.ts` / `*.test.tsx`).

## Theming

Themes are sets of CSS custom properties defined in `src/styles/themes.css` and
applied through `<html data-theme="…">`. Theme-independent tokens (typography,
spacing, radii, blur, motion) live in `src/styles/tokens.css`. Colour tokens are
chosen to keep body text at a contrast ratio of at least 4.5:1.

## Data model and persistence

The profile type lives in `src/domain/profile.ts`; field limits and formats are
defined once in `src/domain/limits.ts` and enforced by the Zod schemas in
`src/lib/validation/schemas.ts`.

### Stored document

The profile is saved under the `riffspace:state` key as a versioned envelope:

```json
{ "app": "riffspace", "schemaVersion": 1, "savedAt": "2026-10-23T12:00:00.000Z", "profile": { "…": "…" } }
```

### Invariants

- All IDs are lowercase slugs (`[a-z0-9][a-z0-9_-]*`, max 64 chars); rig item IDs are unique.
- Text fields are trimmed and length-limited (e.g. nickname 3–24, tagline 120, bio 500).
- Nicknames use lowercase letters, digits, `.`, `_` and `-`, and cannot start or end with a separator.
- Favourite bands and albums contain no duplicates and only reference existing
  catalogue or custom entries; list order is the user's ranking.
- Custom albums always belong to an existing band; custom bands never reuse a catalogue ID.
- Image and avatar URLs must use `http:` or `https:`.
- Unknown keys are dropped when parsing.

### Loading rules

| Stored data                     | Behaviour                                                        |
| ------------------------------- | ---------------------------------------------------------------- |
| Nothing saved                   | Demo profile; nothing is written until the user changes something |
| Valid document                  | Loaded as-is                                                     |
| Broken references or duplicates | Repaired (dangling IDs removed) and loaded, with an info notice  |
| Older schema version            | Migrated step by step through the registry in `document.ts`      |
| Newer schema version            | Not loaded or overwritten on start-up; backed up, demo shown, warning |
| Corrupted JSON / invalid shape  | Backed up to `riffspace:backup`, demo shown, warning             |
| `localStorage` unavailable      | In-memory fallback with a warning that changes will not persist  |

**Reset demo data** (in the footer) asks for confirmation, then deletes
`riffspace:state` and restores the original demo profile. The backup key is
kept. Changes made in another tab are picked up automatically.

## Content and licensing

- The demo profile belongs to a fictional persona and is always labelled as a
  demonstration in the UI.
- Band, album and gear names appear as plain text references only.
- All imagery is abstract artwork generated locally at runtime.
- The bundled catalogue is a small demo sample and is not intended to be
  complete.

### Editing model

The editor works on a **draft** held in the store. Intermediate states (for
example a half-typed nickname) are allowed in the draft and shown in the
preview, but only `saveDraft` validates, normalises and persists. Saving an
edited demo profile turns it into the user's own profile (`isDemo: false`).
Closing the editor with unsaved changes asks for confirmation, and the browser
warns before leaving the page.

## Current limitations

- Gear cannot be edited yet (rig builder is the next step).
- Band reordering uses move up/down buttons; drag-and-drop is not implemented.
- Data is stored only in the current browser. Nothing is published online;
  there is no backend and no public profile URL.
- Only the most recent unreadable document is kept as a backup.

## Roadmap

- Rig builder with add, edit, remove and reorder
- Public view and validated JSON export/import
- Visual polish, motion and an accessibility audit
- CI pipeline and deployment configuration
