FROM node:16-alpine
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm install --only=dev

RUN npm run build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/app.js"]
