FROM public.ecr.aws/docker/library/node:18-alpine AS build

WORKDIR /app

RUN npm config set registry http://registry.npmmirror.com/ && \
    npm config set strict-ssl false

COPY package.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund

COPY . .

ENV REACT_APP_BACKEND_URL=""
RUN npm run build

FROM public.ecr.aws/docker/library/nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
