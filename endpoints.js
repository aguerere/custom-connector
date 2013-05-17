var fs       = require('fs');
var path     = require('path');
var passport = require('passport');
var wsfed    = require('wsfed');
var nconf    = require('nconf');
var hawk     = require('hawk');
var errors   = require('express-errors');

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

var credentialsFunc = function (id, callback) {
  var bewit_credentials = {
    key: credentials.key,
    algorithm: 'sha256'
  };

  return callback(null, bewit_credentials);
};

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
        errors: [],
        signup: nconf.get('ENABLE_SIGNUP')
      });
    });

  app.post('/wsfed', function (req, res, next) {
      //authenticate the user, on success call next middleware
      passport.authenticate('local', {
        session: false
      }, function (err, profile) {
         if (err) return next(err);
         if (!profile) {
          return res.render('login', {
            title:  nconf.get('SITE_NAME'),
            messages: [],
            errors: "The email or password you entered is incorrect.",
            signup: nconf.get('ENABLE_SIGNUP')
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

  app.get('/forgot', function (req, res, next) {
    req.session.original_url = req.headers['referer'];
    res.render('forgot', {
      title:  nconf.get('SITE_NAME'),
      messages: [],
      errors: []
    });
  });

  app.post('/forgot', function (req, res, next) {
    users.getUserByEmail(req.body.email, function(err, user) {
      if (!user) {
        return res.render('forgot', {
          title:  nconf.get('SITE_NAME'),
          messages: [],
          errors: ['User does not exist.']
        });
      }

      console.log('send email to ' + req.body.email);
      mailer.send(user.email, credentials.key, encodeURIComponent(req.session.original_url), 'invite', function(err) {
        if (err) { next(err) }
        res.render('forgot', {
          title:  nconf.get('SITE_NAME'),
          messages: ['We\'ve just sent you an email to reset your password.'],
          errors: []
        });
      });
    });
  });

  app.get('/reset', function (req, res, next) {
    hawk.uri.authenticate(req, credentialsFunc, {}, function (err, bewit_credentials, attributes) {
      if (err) { return next(errors.Unathorized); }
      return res.render('reset', {
        title: nconf.get('SITE_NAME'),
        email: req.query.email,
        original_url: req.query.original_url,
        messages: [],
        errors: []
      });
    });
  });

  app.post('/reset', function (req, res, next) {
    users.getUserByEmail(req.body.email, function(err, user) {
      if (err) { return next(err); }
      if(!user) { return next(errors.NotFound); }
      users.update(user.id, { password: req.body.password }, function(err, updatedUser) {
        if (err) { return next(err); }
        res.redirect(req.body.original_url);
      });
    });
  });

  app.get('/signup', function (req, res, next) {
    if (nconf.get('ENABLE_SIGNUP')) {
      req.session.original_url = req.headers['referer'];
      return res.render('signup', {
        title:  nconf.get('SITE_NAME'),
        messages: [],
        errors: [],
        original_url: req.session.original_url
      });
    }
    next(errors.NotFound);
  });

  app.post('/signup', function (req, res, next) {
    users.create(req.body, function(err, user) {
      if (err) { 
        return res.render('signup', {
          title:  nconf.get('SITE_NAME'),
          messages: [],
          errors: [err]
        });
      }

      mailer.send(user.email, credentials.key, encodeURIComponent(req.session.original_url), 'activate', function(err) {
        if (err) { return next(err); }
        res.render('login', {
          title:  nconf.get('SITE_NAME'),
          messages: ['We\'ve just sent you an email to activate your account.'],
          errors: [],
          signup: nconf.get('ENABLE_SIGNUP')
        });
      });
    });
  });

  app.get('/activate', function(req, res, next) {
    hawk.uri.authenticate(req, credentialsFunc, {}, function (err, bewit_credentials, attributes) {
      if (err) { return next(errors.Unathorized); }
      users.getUserByEmail(req.query.email, function(err, user) {
        if (err) { return next(err); }
        if(!user) { return next(errors.NotFound); }
        users.update(user.id, { active: true }, function(err, user) {
          res.redirect(req.query.original_url);
        });
      });
    });
  });

  app.get('/logout', function (req, res) {
    if(!req.session.user) return res.send(200);
    
    console.log('user ' + req.session.user.displayName.green + ' logged out');
    req.logout();
    delete req.session;
    return res.send('bye');
  });

  errors.bind(app, { layout: false });
};
