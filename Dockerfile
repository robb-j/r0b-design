# Start with a node 10 image with package info
# Installs *all* npm packages and runs build script
FROM node:10-alpine as builder
WORKDIR /app
COPY ["package*.json", "/app/"]
ENV NODE_ENV development
RUN npm ci &> /dev/null
COPY [ "src", "/app/src" ]
COPY [ "cli", "/app/cli" ]
RUN mkdir dist
RUN node cli build --website
RUN ls /app/dist

# Swaps to nginx and copies the compiled html ready to be serverd
FROM nginx:1-alpine
COPY ["nginx.conf", "/etc/nginx/conf.d/default.conf"]
COPY --from=builder /app/dist /usr/share/nginx/html
