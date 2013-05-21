require('colors');
var nconf = require('nconf');
var connectorSetup = require('connector-setup');

nconf.env('||')
     .file({ file: process.env.CONFIG_FILE || (__dirname + '/config.json'), logicalSeparator: '||' })
     .defaults({
        PORT:           4000,
        SESSION_SECRET: 'a1b2c3d4567',
        AUTHENTICATION: 'FORM',
        ENABLE_SIGNUP:  true,
        EMAIL_PROTOCOL: 'SMTP'
     });

connectorSetup.run(__dirname, function(err) {

  if(err) {
    console.log(err.message);
    process.exit(2);
  }

  var http     = require('http');
  var express  = require('express');
  var passport = require('passport');
    
  require('./lib/setupPassport');

  var cookieSessions = require('cookie-sessions');
  var app = express();
  
  //configure the webserver
  app.configure(function(){
    this.set('view engine', 'ejs');
    this.set('views', __dirname + '/views');

    this.use(express.static(__dirname + '/public'));
    
    this.use(express.cookieParser());
    this.use(express.bodyParser());
    this.use(cookieSessions({
      session_key:    'sqlfs',
      secret:         nconf.get('SESSION_SECRET'),
      session_cookie: true
    }));

    this.use(passport.initialize());

    this.use(require('./lib/middleware/bewit'));
    
    this.use(this.router);
  });

  require('./endpoints').install(app);

  http.createServer(app)
    .listen(nconf.get('PORT'), function () {
      console.log('listening on http://localhost:' + nconf.get('PORT'));
    });
});
