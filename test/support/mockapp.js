var path     = require('path');
var http     = require('http');
var express  = require('express');
var nconf    = require('nconf');
var passport = require('passport');

nconf.env('||')
   .defaults({
      PORT:           4000,
      SESSION_SECRET: 'a1b2c3d4567',
      AUTHENTICATION: 'FORM',
      ENABLE_SIGNUP:  true,
      WSFED_ISSUER:   'test.com',
      EMAIL_SERVICE:  'GMail',
      EMAIL_USERNAME: 'mail@test.com',
      BASE_URL:       'http://localhost:4000',
      EMAIL_PROTOCOL: 'Stub',
      test:           'https://test.auth0.com/login/callback'
   });

module.exports.createApp = function(done) { 
  require('../../lib/setupPassport');

  var cookieSessions = require('cookie-sessions');
  var app = express();

  app.configure(function(){
    this.set('view engine', 'ejs');
    this.set('views', path.resolve('./views'));

    this.use(express.static(path.resolve('./public')));

    this.use(express.cookieParser());
    this.use(express.bodyParser());
    this.use(cookieSessions({
      session_key:    'sqlfs',
      secret:         nconf.get('SESSION_SECRET'),
      session_cookie: true
    }));

    this.use(passport.initialize());

    this.use(require('../../lib/middleware/bewit'));
    
    this.use(this.router);
  });

  require('../../endpoints').install(app);

  return http.createServer(app).listen(nconf.get('PORT'), done);
};