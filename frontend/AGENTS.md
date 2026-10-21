# Frontend instructions

- Follow root `AGENTS.md` and `docs/design-system.md`.
- Use Angular standalone components, strict TypeScript, lazy feature routes, signals for local state and RxJS for streams.
- Keep `.ts`, `.html` and `.scss` separate. Use typed API services; render user text safely without `innerHTML`.
- Preserve cookie authentication and Angular XSRF handling; route guards are UX only.
- Implement mobile-first states for loading, empty, error, pending and reconnect; verify keyboard focus and widths 360/390/430px.
- Run `npm ci`, `npm run lint`, `npm test -- --watch=false`, `npm run build` and `npm run e2e` as applicable from `frontend/`.
