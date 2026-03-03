FROM node:24-alpine AS kjk_build

COPY kjk/package.json kjk/
COPY kjk/package-lock.json kjk/
COPY kjk/tsconfig.json kjk/
COPY kjk/vite.config.ts kjk/
COPY kjk/index.html kjk/
COPY kjk/public kjk/public
COPY kjk/src kjk/src

ENV PATH=/srv/kjk/node_modules/.bin:$PATH

WORKDIR /kjk

RUN npm ci --loglevel verbose
# RUN CI=true npm run test
RUN npm run build


FROM node:24-alpine

RUN mkdir -p /srv /deploy \
    && chown -R node:node /srv \
    && chown -R node:node /deploy

WORKDIR /srv/

ADD --chown=node:node ./package.json ./package-lock.json /srv/

USER node

ARG NODE_ENV

ADD --chown=node ./ /srv/

RUN npm ci \
    && npm run build \
    && npm prune --production

EXPOSE 8080

COPY --from=kjk_build --chown=node /kjk/build /srv/kjk/build
RUN gzip /srv/kjk/build/static/js/*.js
RUN gzip /srv/kjk/build/static/css/*.css

CMD ["npm", "run", "start"]
