#!/bin/sh

mkdir -p /maildir/cur /maildir/new /maildir/tmp
chown node:node /maildir /maildir/cur /maildir/new /maildir/tmp

dovecot -F -c /etc/dovecot/dovecot-devmailer.conf &

cd /home/node/devmailer
runuser -u node -g node -- ./devmailer.sh --port=2525 --maildir=/maildir &

wait -n
