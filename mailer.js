var nodemailer = require("nodemailer");

var env        = require("./env"), 
    templates  = require('./templates'),
    utils      = require('./utils');

// create reusable transport method (opens pool of SMTP connections)
var smtpTransport = nodemailer.createTransport("SMTP",{
    service: env['EMAIL_SERVICE'] || 'Gmail',
    auth: {
        user: env['EMAIL_SERVICE'],
        pass: env['EMAIL_PASSWORD']
    }
});

// send mail with defined transport object
exports.send = function(email, key, original_url, type, callback) {
    if (!email) return callback(new Error("missing email"));
    var uri = utils.uri(email, env['BASE_URL'], original_url, key, type);

    var subject = 'Reset Password';
    var template = templates.forgotpassword({ uri: uri } );
    
    if (type === 'activate') {
        subject = 'Activate Account';
        template = templates.activateuser({ uri: uri } );
    };

    var mailOptions = { 
        from: env['EMAIL_FROM'],
        subject: subject,
        html: template,
        to: email
    }

    smtpTransport.sendMail(mailOptions, function(err, response){
        if(err){
            console.log('error ' + err + ' with email ' + email)
            callback(err);
        }else{
            callback(null);
        }
    });
}