var fs       = require('fs');
var path     = require('path');
var passport = require('passport');
var wsfed    = require('wsfed');
var nconf    = require('nconf');
var hawk     = require('hawk');

var env    = require("./env");
var users  = require('./users');
var mailer = require('./mailer');
var utils  = require('./utils');

var issuer = nconf.get('WSFED_ISSUER');

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
      console.log('rendering login');
      return res.render('login', {
        title:  nconf.get('SITE_NAME'),
        messages: [],
        errors: []
      });
    });

  app.post('/wsfed', function (req, res, next) {
      //authenticate the user, on success call next middleware
      passport.authenticate('local', {
        session: false
      }, function (err, profile) {
         if (err) return res.send(500, err);
         if (!profile) {
          return res.render('login', {
            title:  nconf.get('SITE_NAME'),
            messages: [],
            errors: "The username or password you entered is incorrect."
          });
         }
         req.session.user = (req.user = profile);
         return next();
      })(req, res, next);
    }, respondWsFederation);

  app.get('/wsfed/FederationMetadata/2007-06/FederationMetadata.xml',
    wsfed.metadata({
      cert:   credentials.cert,
      issuer: issuer
    }));

  app.get('/forgot', function (req, res) {
    req.session.originalUrl = req.headers['referer'];
    res.render('forgot', {
      title:  nconf.get('SITE_NAME'),
      messages: [],
      errors: []
    });
  });

  app.get('/reset', function (req, res) {
    var credentialsFunc = function (id, callback) {
      var bewit_credentials = {
          key: credentials.key,
          algorithm: 'sha256'
      };

      return callback(null, bewit_credentials);
    };

    hawk.uri.authenticate(req, credentialsFunc, {}, function (err, bewit_credentials, attributes) {
      if (err) { return res.send(401); }
      return res.render('reset', {
        title: nconf.get('SITE_NAME'),
        email: req.query.email,
        original_url: req.query.original_url,
        messages: [],
        errors: []
      });
    });
  });

  app.post('/forgot', function (req, res) {
    console.log('send email to ' + req.body.email);
    var uri = utils.uri(req.body.email, env['BASE_URL'], encodeURIComponent(req.session.originalUrl), credentials.key);
    mailer.send(req.body.email, null, uri, 'invite', function(err) {
      if (err) { return res.send(500, err.message); }
      res.render('forgot', {
        title:  nconf.get('SITE_NAME'),
        messages: ['We\'ve just sent you an email to reset your password.'],
        errors: []
      });
    });
  });

  app.post('/users', function (req, res) {
    users.getUserByEmail(req.body.email, function(err, user) {
      if (err) { return res.send(500); }
      if(!user) { return res.send(404); }
      users.update(user.id, { password: req.body.password }, function(err, updatedUser) {
        if (err) { return res.send(500); }
        res.redirect(req.body.original_url);
      });
    });
  });

  app.get('/signup/:ticket?', function (req, res) {
    if (req.params.ticket) {
      users.getUserByRandomTicket(req.params.ticket, function(err, user) {
        if (err) { return res.send(500); }
        if(!user) { return res.send(404); }
        users.update(user.id, { active: true }, function(err, user) {
          res.redirect(req.query.original_url);
        });
      });
    }

    req.session.originalUrl = req.headers['referer'];
    res.render('signup', {
      title:  nconf.get('SITE_NAME'),
      messages: [],
      errors: []
    });
  });

  app.post('/signup', function (req, res) {
    users.create(req.body, function(err, user) {
      if (err) { return res.send(500, err); }
      mailer.send(user.emails[0].value, user.ticket, encodeURIComponent(req.session.originalUrl), 'activate', function(err) {
        res.redirect(req.session.originalUrl);
      });
    });
  });

  app.get('/logout', function (req, res) {
    
    if(!req.session.user) return res.send(200);
    
    console.log('user ' + req.session.user.displayName.green + ' logged out');
    req.logout();
    delete req.session;
    res.send('bye');
  });
};
