#!/bin/sh

VERSION=$(node -p 'require("./package.json").version')
docker build --pull -t leptonite/devmailer -t leptonite/devmailer:"${VERSION}" .
