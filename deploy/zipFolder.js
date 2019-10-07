// require modules
const fs = require('fs-extra');
const archiver = require('archiver');
const args = process.argv.slice(2);

// create a file to stream archive data to.
const output = fs.createWriteStream(args[0]);
const archive = archiver('zip', {
	zlib: { level: 9 }
});

archive.pipe(output);
// archive.file('file1.txt', { name: 'file4.txt' });
// archive.directory('subdir/', 'new-subdir');
archive.directory(args[1], false);
archive.finalize();