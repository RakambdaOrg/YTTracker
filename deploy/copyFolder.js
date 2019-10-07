#!/usr/bin/env node
const fs = require('fs-extra');
const args = process.argv.slice(2);

fs.copySync(args[0], args[1]);