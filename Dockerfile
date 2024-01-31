FROM node:20-alpine as bdm_build

COPY bdm/package.json bdm/
COPY bdm/package-lock.json bdm/
COPY bdm/config bdm/config
COPY bdm/public bdm/public
COPY bdm/src bdm/src

ENV PATH /srv/bdm/node_modules/.bin:$PATH

WORKDIR /bdm

RUN npm ci --loglevel verbose
RUN npm run build


FROM node:20-alpine as kjk_build

COPY kjk/package.json kjk/
COPY kjk/package-lock.json kjk/
COPY kjk/config kjk/config
COPY kjk/public kjk/public
COPY kjk/src kjk/src

ENV PATH /srv/kjk/node_modules/.bin:$PATH

WORKDIR /kjk

RUN npm ci --loglevel verbose
# RUN CI=true npm run test
RUN npm run build


FROM node:20-alpine

RUN apk add ca-certificates
COPY certificates/adp_rootca.crt /usr/local/share/ca-certificates/adp_rootca.crt
RUN chmod 644 /usr/local/share/ca-certificates/adp_rootca.crt \
  && update-ca-certificates --fresh

RUN mkdir -p /srv /deploy \
    && chown -R node:node /srv \
    && chown -R node:node /deploy

WORKDIR /srv/

ADD --chown=node:node ./package.json ./package-lock.json /srv/

USER node

ARG NPM_TOKEN

ARG NODE_ENV


ADD --chown=node ./ /srv/

RUN echo "//registry.npmjs.org/:_authToken=\"${NPM_TOKEN}\"" >> .npmrc \
    && npm install \
    && rm .npmrc \
    && npm cache clean --force 2> /dev/null \
    && npm run build \
    && npm prune

ENV \
    HTTP_PROXY=$HTTP_PROXY \
    HTTPS_PROXY=$HTTPS_PROXY \
    NO_PROXY=$NO_PROXY \
    http_proxy=$HTTP_PROXY \
    https_proxy=$HTTPS_PROXY \
    no_proxy=$NO_PROXY \
    NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-cert-adp_rootca.pem

EXPOSE 8080

COPY --from=bdm_build --chown=node /bdm/build /srv/bdm/build
COPY --from=kjk_build --chown=node /kjk/build /srv/kjk/build
RUN gzip /srv/kjk/build/static/js/*.js
RUN gzip /srv/kjk/build/static/css/*.css

CMD ["npm", "run", "start"]
