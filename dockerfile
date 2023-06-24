FROM node:18.16.1-buster-slim

WORKDIR /usr/src

COPY . .

RUN yarn install --production --pure-lockfile

CMD ["node", "/usr/src/index.js"]