var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var users = require('./users');

passport.use(new LocalStrategy(
  function(username, password, done) {
    users.getProfile(username, password, function(err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username or password.' });
      }
      return done(null, user);
    });
  }
));


passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});