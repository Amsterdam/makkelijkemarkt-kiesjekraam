### Bewerk de markten
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


### Kies je kraam
FROM node:16-alpine

# Setup certificates for ADP/Motiv
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

# Add `NPM_TOKEN` right before the first `npm install`

ARG NPM_TOKEN

# Do not create or update `package-lock.json` inside the container,
# and prevent npm from showing a warning about the lock file.

ARG NODE_ENV

# Performance optimization: skip build process during development.

RUN if test "$NODE_ENV" = 'development'; \
then \
    echo "//registry.npmjs.org/:_authToken=\"${NPM_TOKEN}\"" > .npmrc \
    && npm install \
    && rm .npmrc \
    && npm cache clean --force 2> /dev/null \
; fi

ADD --chown=node ./ /srv/

# After building the application, remove the `devDependencies`
# for when NODE_ENV is "production".

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
    org.label-schema.description="Pak je kraam" \
    org.label-schema.name="pakjekraam" \
    org.label-schema.schema-version="2.0" \
    org.label-schema.url="https://github.com/Amsterdam/fixxx-pakjekraam/" \
    org.label-schema.usage="https://github.com/Amsterdam/fixxx-pakjekraam/blob/master/README.md" \
    org.label-schema.vcs-ref="${VCS_REF}" \
    org.label-schema.vcs-url="https://github.com/Amsterdam/fixxx-pakjekraam" \
    org.label-schema.vendor="Amsterdam" \
    org.label-schema.version="16.4.2"

# Add lowercase proxy settings for compatibility,
# but use uppercase exports for shellcheck compatibility.
# https://unix.stackexchange.com/a/212972
ENV \
    HTTP_PROXY=$HTTP_PROXY \
    HTTPS_PROXY=$HTTPS_PROXY \
    NO_PROXY=$NO_PROXY \
    http_proxy=$HTTP_PROXY \
    https_proxy=$HTTPS_PROXY \
    no_proxy=$NO_PROXY \
    NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-cert-adp_rootca.pem

EXPOSE 8080

# Copy React build from Bewerk de markten
COPY --from=bdm_build /bdm/build /srv/bdm/build

CMD ["npm", "run", "start"]
