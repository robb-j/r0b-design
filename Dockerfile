# Start with a node 10 image with package info
# Installs *all* npm packages and runs build script
FROM node:10-alpine as builder
WORKDIR /app
COPY ["package*.json", "/app/"]
RUN npm ci
COPY [ ".", "/app/" ]
RUN npm run build > /dev/null

# Swaps to nginx and copies the compiled html ready to be serverd
# Uses a configurable nginx which can pass envionment variables to JavaScript
FROM nginx:1-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
