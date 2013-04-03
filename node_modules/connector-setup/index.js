require('colors');

var auth0Url = 'https://login-dev.auth0.com:3000';

var program = require('commander');
var async = require('async');
var request = require('request');
var urlJoin = require('url-join');
var path = require('path');

//steps
var certificate = require('./steps/certificate');
var configureConnection = require('./steps/configureConnection');
var saveConfig = require('./steps/saveConfig');

program
  .version(require('./package.json').version)
  .parse(process.argv);

//iJF1dvIa
exports.run = function (workingPath, callback) {
  var provisioningTicket, info; 
  var currentConfig = {};

  async.series([
    function (cb) {
      try {
        currentConfig = require(path.join(workingPath, 'config.json'));
        provisioningTicket = currentConfig.PROVISIONING_TICKET;
        return cb();
      } catch(err) {
        program.prompt('Please enter the ticket number: ', function (pt) {
          provisioningTicket = pt;
          cb();
        });
      }
    },
    function (cb) {
      request.get({
        url: urlJoin(auth0Url, '/p/', provisioningTicket, '/info')
      }, function (err, response, body) {
        if (err) return cb(err);
        if (response.statusCode == 404) return cb (new Error('wrong ticket'));
        info = JSON.parse(body);
        cb();
      });
    },
    function (cb) {

      currentConfig['PROVISIONING_TICKET'] = provisioningTicket;
      currentConfig['SESSION_SECRET'] = 'a1b2c3d4567',
      currentConfig['WSFED_ISSUER'] = info.connectionDomain;
      currentConfig['SITE_NAME'] = info.connectionDomain;
      currentConfig['REALMS'] = {};
      currentConfig['REALMS'][info.realm.name] = info.realm.postTokenUrl;

      saveConfig(workingPath, currentConfig, cb); 
    },
    function (cb) {
      certificate(workingPath, info, cb);
    },
    function (cb) {
      configureConnection(program, workingPath, 
                          info, currentConfig, 
                          provisioningTicket, auth0Url, cb);
    },
    function (cb) {
      saveConfig(workingPath, currentConfig, cb); 
    }
  ], function (err) {
    if (err) return callback(err);
    callback(null, currentConfig);
  });
};