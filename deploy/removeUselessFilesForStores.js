#!/usr/bin/env node
const fs = require('fs-extra');
const glob = require("glob");

glob("temp/**/*.map", function (er, files) {
	for(let fileIndex in files){
		if(files.hasOwnProperty(fileIndex)){
			fs.removeSync(files[fileIndex]);
			console.log('Deleting ' + files[fileIndex])
		}
	}
});

fs.removeSync('temp/css/bootstrap/bootstrap.css');
fs.removeSync('temp/css/bootstrap/bootstrap-grid.css');
fs.removeSync('temp/css/bootstrap/bootstrap-grid.min.css');
fs.removeSync('temp/css/bootstrap/bootstrap-reboot.css');
fs.removeSync('temp/css/bootstrap/bootstrap-reboot.min.css');

fs.removeSync('temp/js/lib/amcharts/examples');
fs.removeSync('temp/js/lib/amcharts/plugins');
fs.removeSync('temp/js/lib/amcharts/CHANGELOG.md');
fs.removeSync('temp/js/lib/amcharts/LICENSE');
fs.removeSync('temp/js/lib/amcharts/LICENSE-3RD-PARTY.md');
fs.removeSync('temp/js/lib/amcharts/README.md');

fs.removeSync('temp/js/lib/bootstrap/bootstrap.js');
fs.removeSync('temp/js/lib/bootstrap/bootstrap.bundle.js');
fs.removeSync('temp/js/lib/bootstrap/bootstrap.bundle.min.js');

fs.removeSync('temp/js/lib/jquery/jquery.js');
fs.removeSync('temp/js/lib/jquery/jquery-slim.js');
fs.removeSync('temp/js/lib/jquery/jquery-slim.min.js');
