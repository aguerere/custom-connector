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

utils.uri = function(email, base_url, original_url, key, type) {
	var credentials = {
    id: this.uid(16),
    key: key,
    algorithm: 'sha256'
	}

	// Generate bewit
	var duration = 60 * 5;
	var temp_uri = base_url + '/reset?email='+ email +'&original_url=' + original_url;

	if (type === 'activate') {
		temp_uri = base_url + '/activate?email='+ email +'&original_url=' + original_url;
	};

	var bewit = hawk.uri.getBewit(temp_uri, { credentials: credentials, ttlSec: duration });
	var uri = temp_uri +'&bewit=' + bewit;

	return uri;
};