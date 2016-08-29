#!/bin/sh
echo $TRAVIS_BRANCH
if [ "$TRAVIS_BRANCH" = "master" ] ; then
    npm run release
else
    npm run releaseTest
fi