FROM node:18-alpine AS build

WORKDIR /app

COPY package.json ./
RUN npm config set registry https://registry.npmmirror.com/ && \
    npm install --legacy-peer-deps --no-audit --no-fund

COPY . .

ENV REACT_APP_BACKEND_URL=""
RUN npm run build && ls -la /app/build/

FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
