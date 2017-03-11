#!/bin/sh
if echo "$TRAVIS_BRANCH" | grep -q "^[0-9]\{1,\}\.[0-9]\{1,\}\.0$"; then
    npm run chromeRelease;
else
    npm run chromeReleaseBeta;
fi