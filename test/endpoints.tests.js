var app     = require('./support/mockapp');
var request = require('request');
var jsdom   = require('jsdom');
var fs      = require('fs');
var path    = require('path');
var hawk    = require('hawk');

describe('endpoints', function () {
  var mockApp;
  before(function(done) {
    mockApp = app.createApp(done);
  });

  after(function(done) {
    mockApp.close(done);
  });

  it('should render the login view', function (done) {
    request.get('http://localhost:4000/wsfed', function (err, res) {
      jsdom.env(
        res.body,
        ["http://code.jquery.com/jquery.js"],
        function(errors, window) {
          res.statusCode.should.eql(200);
          window.$("input[name='username']").attr('type').should.eql('email');
          window.$("a.forgot").text().should.eql('Forgot your password?');
          window.$("input[name='password']").attr('type').should.eql('password');
          window.$.trim(window.$("button[type='submit']").text()).should.eql('Sign in');
          window.$.trim(window.$("p.forgot:last").text()).should.eql('Don\'t have an account? Sign Up');
          done();
        }
      );
    });
  });

  it('should render the login view with hint', function (done) {
    request.get('http://localhost:4000/wsfed?login_hint=test@mail.com', function (err, res) {
      jsdom.env(
        res.body,
        ["http://code.jquery.com/jquery.js"],
        function(errors, window) {
          res.statusCode.should.eql(200);
          window.$("input[name='username']").val().should.eql('test@mail.com');
          done();
        }
      );
    });
  });

  // it('should render the login view with error message', function (done) {
  //   var form = {
  //     username: 'notExists@mail.com',
  //     password: 'password'
  //   };

  //   request.post('http://localhost:4000/wsfed', {form: form}, function (err, res) {
  //     jsdom.env(
  //       res.body,
  //       ["http://code.jquery.com/jquery.js"],
  //       function(errors, window) {
  //         res.statusCode.should.eql(200);
  //         window.$("div.notice p.warn").text().should.eql('The email or password you entered is incorrect.');
  //         done();
  //       }
  //     );
  //   });
  // });

  // it('should render the login view with email input after fails', function (done) {
  //   var form = {
  //     username: 'notExists@mail.com',
  //     password: 'password'
  //   };

  //   request.post('http://localhost:4000/wsfed', {form: form}, function (err, res) {
  //     jsdom.env(
  //       res.body,
  //       ["http://code.jquery.com/jquery.js"],
  //       function(errors, window) {
  //         res.statusCode.should.eql(200);
  //         window.$("input[name='username']").val().should.eql('notExists@mail.com');
  //         done();
  //       }
  //     );
  //   });
  // });

  it('should render the forgot view', function (done) {
    request.get('http://localhost:4000/forgot', function (err, res) {
      jsdom.env(
        res.body,
        ["http://code.jquery.com/jquery.js"],
        function(errors, window) {
          res.statusCode.should.eql(200);
          window.$("input[name='email']").attr('type').should.eql('email');
          window.$.trim(window.$("button[type='submit']").text()).should.eql('Send');
          done();
        }
      );
    });
  });  

  it('should render the forgot view with error message', function (done) {
    var form = {
      email: 'notExists@mail.com'
    };

    request.post('http://localhost:4000/forgot', {form: form}, function (err, res) {
      jsdom.env(
        res.body,
        ["http://code.jquery.com/jquery.js"],
        function(errors, window) {
          res.statusCode.should.eql(200);
          window.$("div.notice p.warn").text().should.eql('User does not exist.');
          done();
        }
      );
    });
  });

  it('should render the forgot view with success message', function (done) {
    var form = {
      email: 'foo@bar.com'
    };

    request.get('http://localhost:4000/forgot', { headers: { referer: 'http://localhost:4000/wsfed' } }, function() {
      request.post('http://localhost:4000/forgot', {form: form}, function (err, res) {
        jsdom.env(
          res.body,
          ["http://code.jquery.com/jquery.js"],
          function(errors, window) {
            res.statusCode.should.eql(200);
            window.$("div.notice p.success").text().should.eql('We\'ve just sent you an email to reset your password.');
            done();
          }
        );
      });
    });
  });

  it('should render the reset view', function (done) {
    var credentials = {
      id:  'auth0',
      key: fs.readFileSync(path.join(__dirname, '/../certs/cert.key')),
      algorithm: 'sha256'
    };

    var extra = {
      email: 'foo@bar.com',
      original_url: 'http://localhost:4000/wsfed'
    };

    var bewit = hawk.uri.getBewit('http://localhost:4000/reset', { 
      credentials: credentials, 
      ttlSec:      60 * 5 ,
      ext:         JSON.stringify(extra)
    });

    request.get('http://localhost:4000/reset?bewit=' + bewit, function (err, res) {
      jsdom.env(
        res.body,
        ["http://code.jquery.com/jquery.js"],
        function(errors, window) {
          res.statusCode.should.eql(200);
          window.$("input[name='password']").attr('type').should.eql('password');
          window.$("input[name='repeatPassword']").attr('type').should.eql('password');
          done();
        }
      );
    });
  });

  it('should redirect to original url after reset password', function (done) {
    var credentials = {
      id:  'auth0',
      key: fs.readFileSync(path.join(__dirname, '/../certs/cert.key')),
      algorithm: 'sha256'
    };

    var extra = {
      email: 'foo@bar.com',
      original_url: 'http://localhost:4000/wsfed'
    };

    var bewit = hawk.uri.getBewit('http://localhost:4000/reset', { 
      credentials: credentials, 
      ttlSec:      60 * 5 ,
      ext:         JSON.stringify(extra)
    });

    var form = {
      password: '123',
      repeatPassword: '123',
      email: 'foo@bar.com',
      original_url: 'http://localhost:4000/wsfed'
    };

    request.get('http://localhost:4000/reset?bewit=' + bewit, function () {
      request.post('http://localhost:4000/reset', { form: form }, function(err, res) {
        res.statusCode.should.eql(302);
        res.headers['location'].should.eql('http://localhost:4000/wsfed');
        done();
      });
    });
  });

  it('should render the signup view', function (done) {
    request.get('http://localhost:4000/signup', function (err, res) {
      jsdom.env(
        res.body,
        ["http://code.jquery.com/jquery.js"],
        function(errors, window) {
          res.statusCode.should.eql(200);
          window.$("input[name='email']").attr('type').should.eql('email');
          window.$("input[name='password']").attr('type').should.eql('password');
          window.$("input[name='repeatPassword']").attr('type').should.eql('password');
          window.$.trim(window.$("button[type='submit']").text()).should.eql('Sign up');
          window.$.trim(window.$("p.forgot").text()).should.eql('Already have an account? Sign in.');
          done();
        }
      );
    });
  });

  it('should render the signup view with error message', function (done) {
    var form = {
      email: 'foo@bar.com',
      password: '1234'
    };

    request.get('http://localhost:4000/signup', { headers: { referer: 'http://localhost:4000/wsfed' } },function () {
      request.post('http://localhost:4000/signup', {form: form}, function (err, res) {
        jsdom.env(
          res.body,
          ["http://code.jquery.com/jquery.js"],
          function(errors, window) {
            res.statusCode.should.eql(200);
            window.$("div.notice p.warn").text().should.eql('User Exists');
            done();
          }
        );
      });
    });
  });

  it('should redirect to login view after signup', function (done) {
    var form = {
      email: 'new@bar.com',
      password: '1234'
    };

    request.get('http://localhost:4000/signup', { headers: { referer: 'http://localhost:4000/wsfed' } },function () {
      request.post('http://localhost:4000/signup', {form: form}, function (err, res) {
        res.statusCode.should.eql(302);
        res.headers['location'].should.eql('http://localhost:4000/wsfed');
        done();
      });
    });
  });

  it('should redirect to login view after activate', function (done) {
    var credentials = {
      id:  'auth0',
      key: fs.readFileSync(path.join(__dirname, '/../certs/cert.key')),
      algorithm: 'sha256'
    };

    var extra = {
      email: 'new@bar.com',
      original_url: 'http://localhost:4000/wsfed'
    };

    var bewit = hawk.uri.getBewit('http://localhost:4000/activate', { 
      credentials: credentials, 
      ttlSec:      60 * 5 ,
      ext:         JSON.stringify(extra)
    });

    var form = {
      email: 'new@bar.com',
      password: '1234'
    };

    request.get('http://localhost:4000/signup', { headers: { referer: 'http://localhost:4000/wsfed' } },function () {
      request.post('http://localhost:4000/signup', {form: form}, function () {
        request.get('http://localhost:4000/activate?bewit=' + bewit, function (err, res) {
          jsdom.env(
            res.body,
            ["http://code.jquery.com/jquery.js"],
            function(errors, window) {
              res.statusCode.should.eql(200);
              window.$("div.notice p.success").text().should.eql('Your account has been activated');
              done();
            }
          );
        });
      });
    });
  });

  it('should logout and render bye', function (done) {
    var form = {
      username: 'foo@bar.com',
      password: '123'
    };

    var qs = {
      wtrealm: 'test',
      wa: 'wsignin1.0',
      wreply: 'https://test.auth0.com/login/callback'
    };

    request.post('http://localhost:4000/wsfed', { qs: qs, form: form }, function () {
      request.get('http://localhost:4000/logout', function (err, res) {
        res.statusCode.should.eql(200);
        res.body.should.include('bye');
        done();
      });
    });
  });

  it('should logout and redirect if returnTo qs is present', function (done) {
    var form = {
      username: 'foo@bar.com',
      password: '123'
    };

    var qs = {
      wtrealm: 'test',
      wa: 'wsignin1.0',
      wreply: 'https://test.auth0.com/login/callback'
    };

    request.post('http://localhost:4000/wsfed', { qs: qs, form: form }, function () {
      request.get({url: 'http://localhost:4000/logout?returnTo=http://mysite.com', followRedirect: false }, function (err, res) {
        res.statusCode.should.eql(302);
        res.headers.location.should.eql('http://mysite.com');
        done();
      });
    });
  });

  it('should login and redirect', function (done) {
    var form = {
      username: 'foo@bar.com',
      password: '123'
    };

    var qs = {
      wtrealm: 'test',
      wa: 'wsignin1.0',
      wreply: 'https://test.auth0.com/login/callback'
    };

    request.post('http://localhost:4000/wsfed', { qs: qs, form: form }, function (err, res) {
      res.statusCode.should.eql(200);
      done();
    });
  });
});