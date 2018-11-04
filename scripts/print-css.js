var shell = require('shelljs');
// do no import fonts from google.api
shell.sed('-i',  /@import\surl/, '/* @import url', './node_modules/semantic-ui-css/semantic.css');
shell.cp('-r', './node_modules/semantic-ui-css', './public/print-css/semantic-ui-css');
