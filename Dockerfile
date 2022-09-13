# Build container
FROM node:16
WORKDIR /home/docternal/

COPY . .

RUN npm ci
RUN npm run build
RUN npm prune --production

# Runtime container
FROM node:16
WORKDIR /home/docternal/

COPY --from=0 /home/docternal/package*.json ./
COPY --from=0 /home/docternal/node_modules ./node_modules
COPY --from=0 /home/docternal/build ./build

EXPOSE 8080
CMD [ "node", "build/index.js" ]
