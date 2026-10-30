# Design system

Campfire uses the repository-owned Sass color library at `frontend/src/styles/_campfire-colors.scss`. The palette is campfire-like: amber/yellow for sparks and highlights, orange/red for primary actions, and deep ember brown for text and dark surfaces. Components consume semantic CSS variables rather than raw colors so light and dark themes stay consistent.

The refreshed visual system adds semantic muted/glass surfaces, strong borders, success/info states, layered shadows and shared spacing/radius scales. Page heroes use a restrained ember glow, controls use consistent focus rings and primary actions use the flame gradient. `Be Vietnam Pro` is the product-wide sans-serif typeface at weights 400/500/600/700. It is bundled through `@fontsource/be-vietnam-pro`, served from the same origin with `font-display: swap`, and falls back to the native system stack when unavailable.

The product mark is the supplied campfire-and-friends artwork at `frontend/public/campfire-logo.jpeg`. The shell displays it as a clipped circular brand mark and the browser reuses it for the favicon and Apple touch icon; feature navigation keeps distinct semantic icons so destinations remain scannable.

`ThemeService` selects the saved light/dark preference, otherwise follows the operating-system preference on first load. The top bar exposes an accessible toggle and persists only the visual preference under `campfire-theme`; authentication data is never stored in browser storage.

- Mobile navigation is a safe-area-aware floating dock containing Trò chuyện, Kèo, Ma Sói and Nhóm; labels stay short enough for a 360px viewport. At 1080px it becomes a left navigation rail so wide event/game screens can use the remaining desktop space.
- Navigation icons are inline decorative SVGs with visible text labels. The shell includes a keyboard skip link, a named profile action and a brand tagline that collapses cleanly on narrow screens.
- Touch targets are at least 44px; visible focus and reduced motion are supported.
- Layouts must be checked at 360, 390 and 430px plus desktop.
- Every real data screen needs loading, empty, error, unauthorized and retry/reconnect states as relevant.
- User text is rendered as text, never trusted HTML.
- Group Chat exposes compact, labelled Emoji and Sticker controls above the composer. Emoji insert at the current text caret; stickers use the local six-item Campfire catalog, render as large accessible reactions and preserve pending/failed retry feedback.
