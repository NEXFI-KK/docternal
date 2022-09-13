# Build container
FROM node:16

COPY . .

RUN npm ci
RUN npm run build
RUN npm prune --production

# Runtime container
FROM node:16

COPY --from=0 package*.json .
COPY --from=0 node_modules .
COPY --from=0 build .

EXPOSE 8080
CMD [ "node", "build/index.js" ]
