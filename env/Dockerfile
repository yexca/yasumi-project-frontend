FROM node:24.16.0-bookworm-slim AS dev

WORKDIR /workspace

ENV CI=true
ENV npm_config_update_notifier=false

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev"]

FROM dev AS build
RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY env/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist /usr/share/nginx/html
RUN cp /usr/share/nginx/html/index.html /usr/share/nginx/html/index.template.html

EXPOSE 80
CMD ["sh", "-c", "sed \"s#__YASUMI_BACKEND_BASE_URL__#${VITE_BACKEND_BASE_URL:-http://127.0.0.1:7659}#g; s#__YASUMI_POWERSYNC_ENDPOINT__#${VITE_POWERSYNC_ENDPOINT:-http://127.0.0.1:8081}#g\" /usr/share/nginx/html/index.template.html > /usr/share/nginx/html/index.html && nginx -g 'daemon off;'"]
