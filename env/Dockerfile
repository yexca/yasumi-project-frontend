FROM node:24.16.0-bookworm-slim

WORKDIR /workspace

ENV CI=true
ENV npm_config_update_notifier=false

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

EXPOSE 5173

CMD ["sh", "-c", "sed -i \"s#__YASUMI_BACKEND_BASE_URL__#${VITE_BACKEND_BASE_URL:-http://127.0.0.1:7659}#g; s#__YASUMI_POWERSYNC_ENDPOINT__#${VITE_POWERSYNC_ENDPOINT:-http://127.0.0.1:8081}#g\" index.html && npm run dev"]
