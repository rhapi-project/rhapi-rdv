var shell = require('shelljs');
shell.rm('-fr', './public/docs');
shell.mv('./_docs', './public/docs');
