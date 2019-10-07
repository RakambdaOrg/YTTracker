#!/usr/bin/env node
let fs = require('fs-extra');
const args = process.argv.slice(2);

fs.ensureDirSync(args[0]);