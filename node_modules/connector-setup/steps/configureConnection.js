var urlJoin = require('url-join');
var request = require('request');
var fs = require('fs');
var path = require('path');
var thumbprint = require('thumbprint');

var pemToCert = function(pem) {
  var cert = /-----BEGIN CERTIFICATE-----([^-]*)-----END CERTIFICATE-----/g.exec(pem.toString());
  if (cert.length > 0) {
    return cert[1].replace(/[\n|\r\n]/g, '');
  }

  return null;
};

var getCurrentThumbprint = function (workingPath) {
  var cert = pemToCert(fs.readFileSync(path.join(workingPath, 'certs', 'cert.pem')).toString());
  return thumbprint.calculate(cert);
};

module.exports = function (program, workingPath, connectionInfo, currentConfig, ticket, auth0Url, cb) {
  if (currentConfig.LAST_SENT_THUMBPRINT          === getCurrentThumbprint(workingPath) && 
      urlJoin(currentConfig.SERVER_URL, '/wsfed') === connectionInfo.signInEndpoint ) return cb();

  var serverUrl = currentConfig.SERVER_URL || 'http://localhost:4000';

  var signInEndpoint = urlJoin(serverUrl, '/wsfed');
  var cert = pemToCert(fs.readFileSync(path.join(workingPath, 'certs', 'cert.pem')).toString());

  console.log(('Configuring connection to ' + connectionInfo.appName + '.').yellow);


  request.post({
    url: urlJoin(auth0Url, '/p/', ticket),
    json: {
      certs:          [cert],
      signInEndpoint: signInEndpoint
    }
  }, function (err, response, body) {
    if (err) return cb(err);
    if (response.statusCode !== 200) return cb(new Error(body));
    
    currentConfig.SERVER_URL = serverUrl;
    currentConfig.LAST_SENT_THUMBPRINT = getCurrentThumbprint(workingPath);

    console.log(('Connection to ' + connectionInfo.appName + ' configured.').green);
    cb();
  });
};