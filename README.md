# RIFFSPACE

An interactive visual profile for metalheads and guitarists. Your musical
identity — favourite bands, albums and subgenres — a featured track with its
real waveform, your guitar rig as a signal chain and your links, all on a
single collectible card: clean, monospaced chrome around a heavy display
typeface.

> **Status:** early development. The profile card, the dedicated editor
> (identity, appearance, featured track, socials, music, rig and settings),
> English/Portuguese interface and local persistence work end to end; the
> public view and JSON export/import are next.

## Features

- **Profile card** — the home page is the profile itself and fits the screen:
  the page never scrolls, only the card's content area does. Lowercase mono
  labels, a status bar with stats, theme and serial number, a subtle 3D tilt
  and sheen that follow the pointer, and three faces:
  - _identity_ — bio, subgenres and highlights (top band, favourite album,
    featured gear) that jump to the other faces;
  - _music_ — ranked favourite bands and an album shelf;
  - _rig_ — the interactive signal chain (guitar → pedals → amp → cabinet) with
    gear details. It is a visual representation only; it does not validate
    electrical or audio compatibility.
- **Featured track** — pick one song from the public iTunes catalogue. The
  card shows its cover, a waveform computed from the real 30-second preview,
  play/pause, seeking and an _apple music_ link. The audio is only loaded when
  you press play.
- **Dedicated editor** at `/edit` — the only place where the profile is
  customised. A full page with section navigation (profile, appearance, track,
  socials, bands, albums, genres, rig, settings) and a live preview of the card
  next to the form. Nothing is saved until _save_; leaving with unsaved changes
  (button, link or the browser's back) asks for confirmation. Start from the
  demo profile or from a blank one.
- **Two languages** — the interface is in English by default; Portuguese
  (Portugal) can be chosen in _settings_. The choice applies immediately
  (including validation messages) and is remembered in this browser, separately
  from the profile.
- **Identity** — nickname, display name, tagline, bio, location and avatar
  (generated sigil or image URL with a graceful fallback).
- **Socials** — up to 8 links (Instagram, Spotify, YouTube, Bandcamp,
  SoundCloud, TikTok, X, Facebook, Twitch or any website). `@handles` are
  expanded where the platform supports it, every link is checked against the
  platform's domain, and links open in a new tab with `noopener noreferrer`.
  Icons are deliberately generic (no brand logos) and always paired with the
  platform name.
- **Musical identity** — accent- and case-insensitive search over the local
  catalogue with a subgenre filter; ranked favourites with accessible move
  controls; favourite albums and subgenres; custom bands and albums for anything
  the catalogue does not have.
- **Rig builder** — add, edit, remove and reorder gear of any type with brand,
  model, nickname, notes, tags, favourite flag and an optional image URL.
  Ordering happens within each chain stage, so every move shows in the chain.
- **Three themes** — _Obsidian_, _Blood Moon_ and _Frozen Abyss_ change colours,
  surfaces, glows, generated artwork and the ambient particles (embers rise,
  ice falls). The theme is chosen in the editor's _appearance_ section, previewed
  live and saved with the rest of the profile.
- **Original generative artwork** — covers, band art, the card banner and the
  avatar sigil are deterministic SVGs. No third-party logos, photos or covers
  (the featured track's cover is the only exception, served by Apple — see
  _Content and licensing_).
- **Local persistence** — versioned, validated and migrated. Corrupted or
  incompatible data never blocks start-up.
- **Accessible and responsive** — semantic landmarks, WAI-ARIA tabs, keyboard
  support throughout, visible focus, `prefers-reduced-motion` (no tilt, no
  particles animation) and layouts verified from 320 px to 1440 px. The card
  adapts to its own width with container queries, so the same component works
  full-size and as the editor preview.

## Tech stack

| Area          | Choice                                                    |
| ------------- | --------------------------------------------------------- |
| UI            | React 19, TypeScript 6 (strict), Vite 8                   |
| Routing       | React Router 8 (data router; navigation blocking for unsaved drafts) |
| Styling       | CSS custom properties (design tokens), CSS Modules, container queries |
| Icons         | Lucide React                                              |
| Fonts         | Self-hosted via Fontsource (Inter, Big Shoulders Display, JetBrains Mono — OFL-1.1) |
| Effects       | CSS transforms/transitions and a lightweight Canvas 2D particle layer |
| State         | Zustand (vanilla store, injected through React context)   |
| Validation    | Zod                                                       |
| Persistence   | `localStorage` with a versioned document envelope         |
| i18n          | Small typed dictionaries (en, pt) with interpolation and plurals — no library |
| Music data    | iTunes Search API (public, no key) and the Web Audio API for the waveform |
| Testing       | Vitest, Testing Library, jsdom                            |
| Linting       | oxlint                                                    |

No external accounts or API keys are required. The only network service is
the optional featured-track search (iTunes Search API); everything else works
offline, and if the catalogue cannot be reached the editor says so and leaves
the profile unchanged.

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

## Routes

| Path      | Page                                             |
| --------- | ------------------------------------------------ |
| `/`       | Profile card                                     |
| `/edit`   | Profile editor with live preview                 |
| `*`       | Not found page with a link back to the profile   |

The app uses browser history routing. Any static host must serve `index.html`
for unknown paths (SPA fallback) so that `/edit` works on reload.

## Project structure

```text
src/
  app/            Routes and the shared layout (theme, skip link, notices)
  pages/          ProfilePage, EditorPage, NotFoundPage
  components/
    art/          Generative SVG artwork, the waveform and the ambient particle canvas
    card/         ProfileCard, its faces, track player, social links and the tilt hook
    layout/       Storage notices
    profile/      Avatar with image fallback
    rig/          Gear icon and image with placeholder
    ui/           Primitives (Button, LinkButton, Chip, Badge, Input, Tabs, ConfirmDialog, …)
  data/           Local demo catalogue, rig and profile; blank profile factory
  domain/         Types and pure logic (profile, band, album, gear, social, track, theme)
  features/
    appearance/      Theme picker (editor section)
    band-selector/   Search, selection and custom-entry logic plus its editor tabs
    profile-editor/  Identity and settings sections, validation-to-section mapping, form styles
    rig-builder/     Gear CRUD, ordering and grouping logic plus the rig tab
    socials/         Social link logic plus the socials tab
    track/           Featured-track search and picker (editor section)
  hooks/          Shared React hooks (media queries, theme, reduced motion)
  i18n/           Locales, en/pt dictionaries, translate helpers and the provider
  lib/
    art/          Deterministic generative artwork (seeded PRNG)
    persistence/  Storage adapter, versioned document, migrations, repository, settings
    track/        iTunes Search client and waveform peak extraction
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
{ "app": "riffspace", "schemaVersion": 2, "savedAt": "2026-10-23T12:00:00.000Z", "profile": { "…": "…" } }
```

| Version | Change                                   |
| ------- | ---------------------------------------- |
| 1       | Initial schema                           |
| 2       | Adds `socials` (migrated as an empty list) |

### Invariants

- All IDs are lowercase slugs (`[a-z0-9][a-z0-9_-]*`, max 64 chars); rig item IDs are unique.
- Text fields are trimmed and length-limited (e.g. nickname 3–24, tagline 120, bio 500).
- Nicknames use lowercase letters, digits, `.`, `_` and `-`, and cannot start or end with a separator.
- Favourite bands and albums contain no duplicates and only reference existing
  catalogue or custom entries; list order is the user's ranking.
- Custom albums always belong to an existing band; custom bands never reuse a catalogue ID.
- Image and avatar URLs must use `http:` or `https:`.
- Social links are `http(s)`, belong to their platform's domain (subdomains
  included) and are unique by URL.
- The optional featured track only accepts `https` links on Apple's domains
  (`apple.com` for the preview and page, `mzstatic.com` for the cover) and
  16–256 waveform peaks between 0 and 1.
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

**Reset demo data** (editor → _settings_) asks for confirmation, then deletes
`riffspace:state` and restores the original demo profile. The backup key is
kept. Changes made in another tab are picked up automatically.

### Editing model

The editor works on a **draft** held in the store. Intermediate states (for
example a half-typed nickname) are allowed in the draft and shown in the
preview, but only `saveDraft` validates, normalises and persists. The draft is
discarded whenever the user leaves the editor. Saving an edited demo profile
turns it into the user's own profile (`isDemo: false`) and removes the demo's
illustrative social links.

### Settings

App preferences live under `riffspace:settings` (currently `{ "locale": "en" | "pt" }`).
They belong to the browser, not to the profile: they are not part of the
versioned document and invalid values fall back to English.

## Internationalisation

All interface text lives in `src/i18n/messages/en.ts` (the source of the keys)
and `src/i18n/messages/pt.ts`, which TypeScript forces to have exactly the same
keys; a test also checks that both use the same `{variables}`. Components use
`useI18n()`; code outside React (validation messages, domain operations) uses
`translate()`, which reads the active locale at call time, so switching
language also changes validation messages. Demo data (bio, gear notes) is
English content, not interface text, and is not translated.

## Featured track and the iTunes Search API

The editor's _track_ section searches
`https://itunes.apple.com/search?media=music&entity=song` — a public endpoint
that needs no key and allows cross-origin requests. Picking a song downloads its
official 30-second preview, decodes it with an `OfflineAudioContext` and stores
120 normalised RMS peaks with the song's metadata. Only metadata, Apple's URLs
and the peaks are stored; the audio itself is never saved or re-hosted. If the
search or the audio analysis fails, the editor shows the error and nothing is
added. The demo profile's track (Gojira — _Flying Whales_) was processed the
same way and ships with precomputed peaks.

## Content and licensing

- The demo profile belongs to a fictional persona and is always labelled as a
  demonstration in the UI. Its social links are illustrative and are rendered
  as non-clickable labels.
- Band, album and gear names appear as plain text references only.
- All imagery is abstract artwork generated locally at runtime; social icons
  are generic glyphs, not brand logos.
- **Apple / iTunes attribution:** featured-track search results, 30-second
  previews and cover art are provided by Apple through the iTunes Search API
  and are streamed from Apple's servers. Every player links back to the
  track on Apple Music. RIFFSPACE is not affiliated with or endorsed by Apple.
- The bundled catalogue is a small demo sample and is not intended to be
  complete.

## Current limitations

- Band, gear and social reordering use accessible move up/down buttons;
  drag-and-drop is not implemented.
- Gear is reordered within its chain stage; to move it to another stage, change its type.
- On screens narrower than 1100 px the editor shows the form and the preview
  one at a time, with a toggle.
- On very short screens the card keeps its header and status bar visible and
  gives the remaining height to the scrollable faces.
- Data is stored only in the current browser. Nothing is published online;
  there is no backend and no public profile URL.
- Only the most recent unreadable document is kept as a backup.
- Featured-track search and previews need a network connection and depend on
  Apple's public API, which has no service guarantee or published rate limit.
- On very short phone screens (around 320×568) the track player leaves little
  room for the card's faces; a compact player is planned.

## Roadmap

- Public view and validated JSON export/import
- Visual polish, motion and an accessibility audit
- CI pipeline and deployment configuration (including the SPA fallback)
