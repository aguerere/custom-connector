var nodemailer = require("nodemailer");
var env = require("./env");
var templates = require('./templates');

// create reusable transport method (opens pool of SMTP connections)
var smtpTransport = nodemailer.createTransport("SMTP",{
    service: env['EMAIL_SERVICE'] || 'Gmail',
    auth: {
        user: env['EMAIL_SERVICE'],
        pass: env['EMAIL_PASSWORD']
    }
});

// send mail with defined transport object
exports.send = function(email, ticket, originalUrl, callback) {
    if (!email) return callback(new Error("missing email"));

    var mailOptions = { 
        from: env['EMAIL_FROM'],
        subject: "Change Password",
        html: templates.forgotpassword({ ticket: ticket, baseUrl: env['BASE_URL'], originalUrl: originalUrl } ),
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