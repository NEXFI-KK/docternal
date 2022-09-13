FROM node:16
WORKDIR /home/docternal/

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build
RUN npm prune --production

ENV NODE_ENV production

EXPOSE 8080
CMD [ "node", "build/index.js" ]
