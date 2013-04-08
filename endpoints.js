var fs       = require('fs');
var path     = require('path');
var passport = require('passport');
var wsfed    = require('wsfed');
var nconf    = require('nconf');

var issuer   = nconf.get('WSFED_ISSUER');

var credentials = {
  cert: fs.readFileSync(path.join(__dirname, '/certs/cert.pem')),
  key:  fs.readFileSync(path.join(__dirname, '/certs/cert.key'))
};

var respondWsFederation = wsfed.auth({
  issuer:      issuer,
  cert:        credentials.cert,
  key:         credentials.key,
  getPostURL:  function (wtrealm, wreply, req, callback) {
    var realmPostURLs = nconf.get(wtrealm);
    if (realmPostURLs) {
      realmPostURLs = realmPostURLs.split(',');
      if (wreply && ~realmPostURLs.indexOf(wreply)) {
        return callback(null, wreply);
      }
      if(!wreply){
        return callback(null, realmPostURLs[0]);
      }
    }
    callback();
  }
});

exports.install = function (app) {
  app.get('/wsfed', 
    function (req, res, next) {
      if (req.session.user && req.query.wprompt !== 'consent') {
        req.user = req.session.user;
        return respondWsFederation(req, res);
      }
      next();
    },
    function (req, res) {
      var messages = (req.session.messages || []).join('<br />');

      delete req.session.messages;
      console.log('rendering login');
      return res.render('login', {
        title:  nconf.get('SITE_NAME'),
        errors: messages
      });
    });

  app.post('/wsfed', function (req, res, next) {
      //authenticate the user, on success call next middleware
      passport.authenticate('local', { 
        failureRedirect: req.url,
        failureMessage: "The username or password you entered is incorrect.",
        session: false
      })(req, res, next);
    }, function (req, res, next) {
      console.log('user ' + req.user.displayName.green + ' authenticated');
      req.session.user = req.user;
      next();
    }, respondWsFederation);

  app.get('/wsfed/FederationMetadata/2007-06/FederationMetadata.xml',
    wsfed.metadata({
      cert:   credentials.cert,
      issuer: issuer
    }));

  app.get('/logout', function (req, res) {
    console.log('user ' + req.session.user.displayName.green + ' logged out');
    req.logout();
    delete req.session;
    res.send('bye');
  });
};
