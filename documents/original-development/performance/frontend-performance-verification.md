# Frontend Performance Verification

Date: 2026-06-15

## Scope

Optimized the production bundle against `../dev_documents/frontend_performance_optimization/01-vite-bundle-optimization-guide.md` while preserving the Today-first workflow and Docker deployability.

## Bundle Measurements

Before:

- Main JS: `dist/assets/index-DUXuUD7Z.js`, 612.40 kB, gzip 184.33 kB.
- CSS: `dist/assets/index-CmI887Kw.css`, 35.48 kB, gzip 6.77 kB.
- Warning: yes, Vite reported a chunk larger than 500 kB.

After:

- Initial JS: `dist/assets/index-CskU_xi9.js`, 385.69 kB, gzip 120.73 kB.
- Initial CSS: `dist/assets/index-b2KB4GjF.css`, 25.49 kB, gzip 5.21 kB.
- Largest async chunk: `dist/assets/Field-CTItwTQ4.js`, 127.28 kB, gzip 40.21 kB.
- Warning: no.

## Notes

- Route pages other than Today and the offline-critical Inbox path now load as async chunks.
- Quick Add and item flow dialogs load when opened instead of during initial shell render.
- Auth, sync, and weather API code loads on demand so Zod-backed DTO parsing is not part of the default Today shell path.
- `env/Dockerfile` already builds the app and serves `dist/` through Nginx with the existing SPA fallback, so no Dockerfile change was required.

## Verification Commands

- `./env/npm.cmd run typecheck`
- `./env/npm.cmd run lint`
- `./env/npm.cmd run test`
- `./env/npm.cmd run test:component`
- `./env/npm.cmd run typecheck:app`
- `./env/npm.cmd run build`
- `./env/npm.cmd run test:e2e`
- `docker build -f env/Dockerfile -t yasumi-frontend-build-check .`

`./env/npm.cmd run format` still reports pre-existing formatting issues in `README.md` and `src/features/auth/AuthPage.module.css`; changed files were formatted with Prettier.
