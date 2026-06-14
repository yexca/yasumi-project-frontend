# Yasumi Frontend Environment

The frontend is pinned to the Docker/dev-container runtime rather than a local machine setup.

## Runtime

- Node.js: `24.16.x`
- npm: `11.x`
- Base image: `node:24.16.0-bookworm-slim`

## Local Windows Runtime

Use the checked-in Node runtime instead of a machine-level Node install:

```powershell
.\env\npm.cmd install
.\env\npm.cmd run dev
.\env\npm.cmd run typecheck
```

## Docker

Build and run the development server:

```bash
docker build -f env/Dockerfile -t yasumi-frontend .
docker run --rm -it -p 5173:5173 yasumi-frontend
```

For full-stack release validation, run the backend repository's root Compose file from `../yasumi-project-backend`; it can build this frontend through `docker-compose.example.yml`.

## Service Ports

- Frontend dev server: `5173`
- Frontend preview/E2E support: `4175`
- Local backend API: `7659`
- Local PowerSync service: `8081`

## Dev Container

Use `.devcontainer/devcontainer.json` as the primary dev-container definition. The equivalent `env/.devcontainer/devcontainer.json` is kept next to the Dockerfile for environment documentation.
