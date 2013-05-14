var xtend      = require('xtend');
var fs         = require('fs');
var configFile = process.env.CONFIG_FILE || '/etc/auth0-ui.config';
var toml       = require('toml');

// 'AUTH0_DOMAIN':               domain_url_server.replace('{tenant}', 'auth0-dev'),

var defaults = {
  'BASE_URL':                   'http://localhost:4000'
};

var env = module.exports = {}; 

try {
  var fromFile = toml.parse(fs.readFileSync(configFile).toString());
  xtend(env, defaults, fromFile, process.env);
} catch(er) {
  xtend(env, defaults, process.env);
}