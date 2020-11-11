#!/bin/sh
npm install -g typescript@3.6.4 claudia
npm i --silent
npm dedupe -q --no-package-lock
#npm run build
#npm run dev:create
npm run dev:update
#npm run create
#npm run update