FROM node:16

COPY package*.json ./

RUN npm ci --only=production
COPY . .

EXPOSE 8080
CMD [ "node", "build/index.js" ]