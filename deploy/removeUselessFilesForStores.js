#!/usr/bin/env node
const fs = require('fs-extra');
const globSync = require('glob');

const files = globSync('temp/**/*.map');
for (let fileIndex in files) {
	if (files.hasOwnProperty(fileIndex)) {
		fs.removeSync(files[fileIndex]);
		console.log('Deleting ' + files[fileIndex]);
	}
}

fs.removeSync('temp/lib/bootstrap/css/bootstrap.css');
fs.removeSync('temp/lib/bootstrap/css/bootstrap-grid.css');
fs.removeSync('temp/lib/bootstrap/css/bootstrap-grid.min.css');
fs.removeSync('temp/lib/bootstrap/css/bootstrap-reboot.css');
fs.removeSync('temp/lib/bootstrap/css/bootstrap-reboot.min.css');

fs.removeSync('temp/lib/bootstrap/js/bootstrap.js');
fs.removeSync('temp/lib/bootstrap/js/bootstrap.bundle.js');
fs.removeSync('temp/lib/bootstrap/js/bootstrap.bundle.min.js');

fs.removeSync('temp/lib/popper.js/esm');
fs.removeSync('temp/lib/popper.js/umd/popper.js');
fs.removeSync('temp/lib/popper.js/umd/popper.js.flow');
fs.removeSync('temp/lib/popper.js/umd/popper-utils.js');
fs.removeSync('temp/lib/popper.js/umd/popper-utils.min.js');
fs.removeSync('temp/lib/popper.js/popper.js');
fs.removeSync('temp/lib/popper.js/popper.min.js');
fs.removeSync('temp/lib/popper.js/popper-utils.js');
fs.removeSync('temp/lib/popper.js/popper-utils.min.js');

fs.removeSync('temp/lib/jquery/jquery.js');
fs.removeSync('temp/lib/jquery/jquery.slim.js');
fs.removeSync('temp/lib/jquery/jquery.slim.min.js');

fs.removeSync('temp/lib/amcharts4/.internal');
fs.removeSync('temp/lib/amcharts4/examples');
fs.removeSync('temp/lib/amcharts4/plugins');
fs.removeSync('temp/lib/amcharts4/CHANGELOG.md');
fs.removeSync('temp/lib/amcharts4/LICENSE');
fs.removeSync('temp/lib/amcharts4/LICENSE-3RD-PARTY.md');
fs.removeSync('temp/lib/amcharts4/README.md');

fs.removeSync('temp/lib/dropbox/dropbox.d.ts');
fs.removeSync('temp/lib/dropbox/dropbox-sdk.d.ts');
fs.removeSync('temp/lib/dropbox/dropbox-sdk.js');
fs.removeSync('temp/lib/dropbox/dropbox-sdk.min.d.ts');
fs.removeSync('temp/lib/dropbox/dropbox_team.d.ts');
fs.removeSync('temp/lib/dropbox/dropbox_types.d.ts');
fs.removeSync('temp/lib/dropbox/DropboxTeam-sdk.js');
fs.removeSync('temp/lib/dropbox/DropboxTeam-sdk.min.js');
fs.removeSync('temp/lib/dropbox/DropboxTeam-sdk.min.d.ts');
