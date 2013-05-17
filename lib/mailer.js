var path       = require('path');
var fs         = require('fs');

var nodemailer = require("nodemailer");
var nconf      = require('nconf');
var hawk       = require('hawk');
var urlJoin    = require('url-join');

var templates  = require('./templates');

var credentials = {
  id:  'auth0',
  key: fs.readFileSync(path.join(__dirname, '/../certs/cert.key')),
  algorithm: 'sha256'
};

var smtpTransport = (nconf.get('EMAIL_SERVICE') && nconf.get('EMAIL_USERNAME')) ? 
                    nodemailer.createTransport("SMTP",{
                      service: nconf.get('EMAIL_SERVICE'),
                      auth: {
                        user: nconf.get('EMAIL_USERNAME'),
                        pass: nconf.get('EMAIL_PASSWORD')
                      }
                    }) : null;

function signUrl (url, extra) {
  var bewit = hawk.uri.getBewit(url, { 
    credentials: credentials, 
    ttlSec:      60 * 5 ,
    ext:         JSON.stringify(extra)
  });

  return url + '?bewit=' + bewit;
}

function trySend (mailOptions, callback) {
  if (!smtpTransport) {
    console.log("this connector can't send emails yet");
    console.log("this is the mail\n", mailOptions.text);
    return callback();
  }

  smtpTransport.sendMail(mailOptions, function (err) {
    if (err) {
      console.log('error ' + err + ' with email ' + mailOptions.to);
      return callback(err);
    }
    callback();
  });
}

exports.sendActivation = function (userEmail, originalUrl, callback) {
  var activationUrl = urlJoin(nconf.get('BASE_URL'), '/activate');
  
  activationUrl = signUrl(activationUrl, {
    email:        userEmail,
    original_url: originalUrl
  });

  var content = templates.activateuser({ uri: activationUrl } );

  var mailOptions = { 
    from:    nconf.get('EMAIL_FROM'),
    subject: "Activate your account",
    html:    content,
    text:    "To activate your account go to " + activationUrl,
    to:      userEmail
  };
  
  trySend(mailOptions, callback);
};

exports.sendReset = function (userEmail, originalUrl, callback) {
  var resetUrl = urlJoin(nconf.get('BASE_URL'), '/reset');
  
  resetUrl = signUrl(resetUrl, {
    email:        userEmail,
    original_url: originalUrl
  });

  var content = templates.forgotpassword({ uri: resetUrl } );

  var mailOptions = { 
    from:    nconf.get('EMAIL_FROM'),
    subject: "Reset your password",
    html:    content,
    text:    "To reset your password go to " + resetUrl,
    to:      userEmail
  };

  trySend(mailOptions, callback);
};