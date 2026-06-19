# Yasumi Frontend Environment

The frontend runs through Docker and dev containers. Treat containers as the source of truth for local development and verification.

## Runtime

- Node.js: `24.16.x`
- npm: `11.x`
- Dev/build base image: `node:24.16.0-bookworm-slim`
- Production runtime image: `nginx:1.27-alpine`

## Docker

Build and run the production-style static frontend:

```bash
docker build -f env/Dockerfile -t yexca/yasumi-project-frontend:0.1.0 .
docker run --rm -it -p 7650:7650 yexca/yasumi-project-frontend:0.1.0
```

Build and run the development server from the same Dockerfile:

```bash
docker build -f env/Dockerfile --target dev -t yexca/yasumi-project-frontend:0.1.0-dev .
docker run --rm -it -p 7650:7650 yexca/yasumi-project-frontend:0.1.0-dev
```

For full-stack release validation from this frontend directory, copy `.env.example` to `.env` if you need overrides, then run:

```bash
docker compose up -d --build
docker compose up -d frontend-dev
```

This Compose file builds the backend from `../yasumi-project-backend` and exposes the app on `http://127.0.0.1:7650`. API and PowerSync traffic are forwarded through the frontend container, so you only need the single frontend port on the host.

By default, the Compose frontend image name is `yexca/yasumi-project-frontend:0.1.0`, configurable through `.env`.

Run project checks inside the development container:

```bash
docker compose exec frontend-dev npm run typecheck
docker compose exec frontend-dev npm run lint
docker compose exec frontend-dev npm run test
docker compose exec frontend-dev npm run test:component
docker compose exec frontend-dev npm run build
docker compose exec frontend-dev npm run test:e2e
```

## Service Ports

- Frontend production container: `7650` inside the container, mapped to host `7650` by default
- Frontend dev container shell: no default HTTP port
- Frontend dev server and Playwright base URL: `4175`
- Backend API: internal to Compose on `7659`
- PowerSync service: internal to Compose on `8080`

## Dev Container

Use `.devcontainer/devcontainer.json` as the primary dev-container definition. The equivalent `env/.devcontainer/devcontainer.json` is kept next to the Dockerfile for environment documentation.
