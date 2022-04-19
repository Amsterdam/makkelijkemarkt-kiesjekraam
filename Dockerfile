FROM node:16-alpine as bdm_build

COPY bdm/package.json bdm/
COPY bdm/package-lock.json bdm/
COPY bdm/public bdm/public
COPY bdm/src bdm/src

ENV PATH /srv/bdm/node_modules/.bin:$PATH

WORKDIR /bdm

RUN npm ci --loglevel verbose
RUN CI=true npm run test
RUN npm run build

FROM node:16-alpine

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

RUN if test "$NODE_ENV" = 'development'; \
then \
    echo "//registry.npmjs.org/:_authToken=\"${NPM_TOKEN}\"" > .npmrc \
    && npm install \
    && rm .npmrc \
    && npm cache clean --force 2> /dev/null \
; fi

ADD --chown=node ./ /srv/

RUN if test "$NODE_ENV" != 'development'; \
then \
    echo "//registry.npmjs.org/:_authToken=\"${NPM_TOKEN}"\" >> .npmrc \
    && NODE_ENV=development npm install \
    && rm .npmrc \
    && npm cache clean --force 2> /dev/null \
    && npm run build \
    && npm prune \
; fi

ARG BUILD_DATE
ARG VCS_REF

LABEL \
    org.label-schema.build-date="${BUILD_DATE}" \
    org.label-schema.description="KiesJeKraam" \
    org.label-schema.name="kiesjekraam" \
    org.label-schema.schema-version="2.0" \
    org.label-schema.url="https://git.data.amsterdam.nl:salmagundi/makkelijkemarkt/makkelijkemarkt-kiesjekraam" \
    org.label-schema.usage="https://git.data.amsterdam.nl:salmagundi/makkelijkemarkt/makkelijkemarkt-kiesjekraam" \
    org.label-schema.vcs-ref="${VCS_REF}" \
    org.label-schema.vcs-url="https://git.data.amsterdam.nl:salmagundi/makkelijkemarkt/makkelijkemarkt-kiesjekraam.git" \
    org.label-schema.vendor="Amsterdam" \
    org.label-schema.version="16.4.2"

ENV \
    HTTP_PROXY=$HTTP_PROXY \
    HTTPS_PROXY=$HTTPS_PROXY \
    NO_PROXY=$NO_PROXY \
    http_proxy=$HTTP_PROXY \
    https_proxy=$HTTPS_PROXY \
    no_proxy=$NO_PROXY \
    NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-cert-adp_rootca.pem

EXPOSE 8080

COPY --from=bdm_build /bdm/build /srv/bdm/build

CMD ["npm", "run", "start"]
