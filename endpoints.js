var fs       = require('fs');
var path     = require('path');
var passport = require('passport');
var wsfed    = require('wsfed');
var nconf    = require('nconf');

var users = require('./users');
var mailer = require('./mailer');

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

  app.get('/forgot/:ticket?', function (req, res) {
    if (req.params.ticket) {
      users.getUserByRandomTicket(req.params.ticket, function(err, user){
        if (err) { return res.send(500); }
        if(!user) { return res.send(404); }
        return res.render('ticket', {
          title: nconf.get('SITE_NAME'),
          ticket: req.params.ticket,
          originalUrl: req.query.original_url,
          messages: [],
          errors: []
        });
      })
    }

    req.session.originalUrl = req.headers['referer'];
    res.render('forgot', {
      title:  nconf.get('SITE_NAME'),
      messages: [],
      errors: []
    });
  });

  app.post('/forgot', function (req, res) {
    users.generateRandomTicket(req.body.email, function(err, ticket) {
      if (err) { return res.send(500); }

      console.log('send email to ' + req.body.email + ' the ticket ' + ticket);
      mailer.send(req.body.email, ticket, encodeURIComponent(req.session.originalUrl), function(err) {
        if (err) { return res.send(500, err.message); }
        res.render('forgot', {
          title:  nconf.get('SITE_NAME'),
          messages: ['We\'ve just sent you an email to reset your password.'],
          errors: []
        });
      })
    });
  });

  app.post('/users', function (req, res) {
    users.getUserByRandomTicket(req.body.ticket, function(err, user) {
      if (err) { return res.send(500); }
      users.update(user.id, { password: req.body.password }, function(err, updatedUser) {
        if (err) { return res.send(500); }
        res.redirect(req.body.originalUrl);
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
