var app     = require('./support/mockapp');
var request = require('request');

describe('endpoints', function () {
  var mockApp;
  before(function(done) {
    mockApp = app.createApp(done);
  });

  after(function(done) {
    mockApp.close(done);
  });

  it('should return the login view', function (done) {
    request.get('http://localhost:4000/wsfed', function (err, res) {
      res.statusCode.should.eql(200);
      done();
    });
  });
});