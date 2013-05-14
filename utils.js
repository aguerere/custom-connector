var utils = module.exports;
var hawk = require('hawk');

utils.uid = function(length) {
  var validChars = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var id = "";
  for (var i = 0; i < length; i++){
    id += validChars[Math.floor(Math.random()*validChars.length)];
  }
  return id;
};

utils.uri = function(email, base_url, original_url, key) {
	var credentials = {
	    id: this.uid(16),
	    key: key,
	    algorithm: 'sha256'
	}

	// Generate bewit
	var duration = 60 * 5; // 5 Minutes
	var bewit = hawk.uri.getBewit(base_url + '/reset?email='+ email +'&original_url=' + original_url, { credentials: credentials, ttlSec: duration });
	var uri = base_url + '/reset?email='+ email +'&original_url='+ original_url +'&bewit=' + bewit;

	return uri;
};