var fs       = require('fs');
var path     = require('path');
var passport = require('passport');
var wsfed    = require('wsfed');
var nconf    = require('nconf');
var hawk     = require('hawk');
var errors   = require('express-errors');

var users  = require('./lib/users');
var mailer = require('./lib/mailer');

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

var requireBewit = function (req, res, next) {
  if (!req.bewit) next(errors.Unathorized);
  return next();
};

var renderLogin = function (errors, messages) {
  return function (req, res) {
    console.log('rendering login');
    return res.render('login', {
      title:    nconf.get('SITE_NAME'),
      messages: messages,
      errors:   errors,
      signup:   nconf.get('ENABLE_SIGNUP')
    });
  };
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
    renderLogin());

  app.post('/wsfed', function (req, res, next) {
      //authenticate the user, on success call next middleware
      passport.authenticate('local', {
        session: false
      }, function (err, profile) {
         if (err) return next(err);
         if (!profile) {
          return renderLogin('The email or password you entered is incorrect.')(req, res);
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
      mailer.sendReset(user.email, req.session.original_url, function(err) {
        if (err) { return next(err); }
        res.render('forgot', {
          title:  nconf.get('SITE_NAME'),
          messages: ['We\'ve just sent you an email to reset your password.'],
          errors: []
        });
      });
    });
  });

  app.get('/reset', 
    requireBewit,
    function (req, res) {
      req.session.changing_password_for_email = req.bewit.email;
      return res.render('reset', {
        title:        nconf.get('SITE_NAME'),
        email:        req.bewit.email,
        original_url: req.bewit.original_url,
        messages:     [],
        errors:       []
      });
    });

  app.post('/reset', function (req, res, next) {
    if (req.body.email !== req.session.changing_password_for_email) return next(errors.Unathorized);
    users.getUserByEmail(req.session.changing_password_for_email, function(err, user) {
      if (err) { return next(err); }
      if(!user) { return next(errors.NotFound); }
      users.update(user.id, { password: req.body.password }, function(err) {
        if (err) { return next(err); }
        delete req.session.changing_password_for_email;
        res.redirect(req.body.original_url);
      });
    });
  });

  app.get('/signup', function (req, res, next) {
    if (!nconf.get('ENABLE_SIGNUP')) return next(errors.NotFound);
    req.session.original_url = req.headers['referer'];
    res.render('signup', {
      title:  nconf.get('SITE_NAME'),
      messages: [],
      errors: [],
      original_url: req.session.original_url
    });
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

      mailer.sendActivation(user.email, req.session.original_url, function(err) {
        if (err) { return next(err); }
        renderLogin('', 'We\'ve just sent you an email to activate your account.')(req, res);
      });
    });
  });

  app.get('/activate', 
    requireBewit,
    function(req, res, next) {
      users.getUserByEmail(req.bewit.email, function(err, user) {
        if (err) { return next(err); }
        if(!user) { return next(errors.NotFound); }
        users.update(user.id, { active: true }, function(err) {
          if (err) { return next(err); }
          res.redirect(req.bewit.original_url);
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
