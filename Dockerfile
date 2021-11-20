FROM node:16-alpine3.14 AS builder

USER node:node

RUN mkdir /home/node/devmailer

COPY --chown=node:node ./ /home/node/devmailer/

RUN cd /home/node/devmailer \
 && yarn install --frozen-lockfile \
 && rm -rf /home/node/.cache \
 && yarn build



FROM node:16-alpine3.14

RUN apk add dovecot runuser \
 && rm -r /etc/ssl/dovecot

USER node:node

RUN mkdir /home/node/devmailer

COPY --chown=node:node ./devmailer.sh ./package.json ./yarn.lock /home/node/devmailer/

RUN cd /home/node/devmailer \
 && yarn install --frozen-lockfile --production \
 && rm -rf /home/node/.cache

COPY --from=builder --chown=node:node /home/node/devmailer/build/ /home/node/devmailer/build/
COPY docker/ /

WORKDIR /home/node/devmailer

USER root:root

ENTRYPOINT [ ]

CMD [ "/docker-main.sh" ]
