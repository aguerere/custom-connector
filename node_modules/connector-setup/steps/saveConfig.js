var path = require('path');
var fs = require('fs');

module.exports = function (workingPath, currentConfig, callback) {
  var configFile = path.join(workingPath, 'config.json');
  fs.writeFileSync(configFile, JSON.stringify(currentConfig, null, 2));
  callback();
};