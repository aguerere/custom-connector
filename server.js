var http     = require('http');
var express  = require('express');
var passport = require('passport');
var connectorSetup = require('connector-setup');

connectorSetup.run(__dirname, function(err, config) {

  if(err) {
    console.log(err.message);
    process.exit(2);
  }
    
  require('./setupPassport');

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
      secret:         config.SESSION_SECRET
    }));

    this.use(passport.initialize());
    this.use(this.router);
  });


  require('./endpoints').install(app);

  var port = process.env.PORT || config.PORT || 4000;

  http.createServer(app)
    .listen(port, function () {
      console.log('listening on http://localhost:' + port);
    });
});