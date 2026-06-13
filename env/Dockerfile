FROM node:24.16.0-bookworm-slim

WORKDIR /workspace

ENV CI=true
ENV npm_config_update_notifier=false

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
