var path     = require('path');
var http     = require('http');
var express  = require('express');
var nconf    = require('nconf');

nconf.env('||')
   .defaults({
      PORT:           4000,
      SESSION_SECRET: 'a1b2c3d4567',
      AUTHENTICATION: 'FORM',
      ENABLE_SIGNUP:  true,
      WSFED_ISSUER:   'test.com'
   });

module.exports.createApp = function(done) { 
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
  });

  require('../../endpoints').install(app);

  return http.createServer(app).listen(nconf.get('PORT'), done);
};