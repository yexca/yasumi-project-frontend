FROM node:24.16.0-bookworm-slim AS dev

WORKDIR /workspace

ENV CI=true
ENV npm_config_update_notifier=false

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    wget \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 7650
CMD ["npm", "run", "dev"]

FROM dev AS build
RUN npm run build

FROM nginx:1.27-alpine AS runtime

ARG YASUMI_FRONTEND_CONTAINER_PORT=7650

COPY env/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist /usr/share/nginx/html
RUN cp /usr/share/nginx/html/index.html /usr/share/nginx/html/index.template.html

EXPOSE ${YASUMI_FRONTEND_CONTAINER_PORT}
CMD ["sh", "-c", "sed -i \"s/listen 80;/listen ${YASUMI_FRONTEND_CONTAINER_PORT:-7650};/\" /etc/nginx/conf.d/default.conf && sed \"s#__YASUMI_BACKEND_BASE_URL__#${VITE_BACKEND_BASE_URL:-http://127.0.0.1:7659}#g; s#__YASUMI_POWERSYNC_ENDPOINT__#${VITE_POWERSYNC_ENDPOINT:-http://127.0.0.1:8081}#g\" /usr/share/nginx/html/index.template.html > /usr/share/nginx/html/index.html && nginx -g 'daemon off;'"]
