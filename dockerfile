FROM node:18.16.1-buster-slim

WORKDIR /usr/src

RUN apt-get update && apt-get install -y python3 build-essential libsqlite3-dev

COPY . .

RUN yarn install --production --pure-lockfile

CMD ["node", "/usr/src/index.js"]