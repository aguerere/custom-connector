var path        = require('path');
var fs          = require('fs');
var hawk        = require('hawk');

var credentials = {
  key:  fs.readFileSync(path.join(__dirname, '../../certs/cert.key'))
};

var credentialsFunc = function (id, callback) {
  var bewit_credentials = {
    key:       credentials.key,
    algorithm: 'sha256'
  };
  return callback(null, bewit_credentials);
};

module.exports = function (req, res, next) {
  if (!req.query.bewit) return next();
  hawk.uri.authenticate(req, credentialsFunc, {}, function (err, credentials, attributes) {
    if (err) { return res.send(401); }

    attributes = JSON.parse(attributes.ext);
    
    req.bewit = attributes;
    
    console.log('attributes', attributes);

    next();
  });
};