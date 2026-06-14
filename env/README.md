# Yasumi Frontend Environment

The frontend is pinned to the Docker/dev-container runtime rather than a local machine setup.

## Runtime

- Node.js: `24.16.x`
- npm: `11.x`
- Dev/build base image: `node:24.16.0-bookworm-slim`
- Production runtime image: `nginx:1.27-alpine`

## Local Windows Runtime

Use the checked-in Node runtime instead of a machine-level Node install:

```powershell
.\env\npm.cmd install
.\env\npm.cmd run dev
.\env\npm.cmd run typecheck
```

## Docker

Build and run the production-style static frontend:

```bash
docker build -f env/Dockerfile -t yasumi-frontend .
docker run --rm -it -p 7650:7650 yasumi-frontend
```

Build and run the development server from the same Dockerfile:

```bash
docker build -f env/Dockerfile --target dev -t yasumi-frontend-dev .
docker run --rm -it -p 7650:7650 yasumi-frontend-dev
```

For full-stack release validation from this frontend directory, copy `.env.example` to `.env` if you need overrides, then run:

```bash
docker compose up -d --build
```

This Compose file builds the backend from `../yasumi-project-backend` and exposes the app on `http://127.0.0.1:7650`. API and PowerSync traffic are forwarded through the frontend container, so you only need the single frontend port on the host.

## Service Ports

- Frontend production container: `7650` inside the container, mapped to host `7650` by default
- Frontend dev server: `7650`
- Frontend preview/E2E support: `4175`
- Backend API: internal to Compose on `7659`
- PowerSync service: internal to Compose on `8080`

## Dev Container

Use `.devcontainer/devcontainer.json` as the primary dev-container definition. The equivalent `env/.devcontainer/devcontainer.json` is kept next to the Dockerfile for environment documentation.
