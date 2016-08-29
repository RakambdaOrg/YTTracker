#!/bin/sh
echo "$TRAVIS_BRANCH";
if echo "$TRAVIS_BRANCH" | grep -q "^[0-9]\{1,\}[0-9]\{1,\}[0-9]$"; then
    npm run release;
else
    npm run releaseTest;
fi