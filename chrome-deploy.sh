#!/bin/bash
set -ev
cd extension
zip -r extension.zip ./*
cd ../
mv extension/extension.zip extension.zip
grunt