var config      = require('./config');
var connOptions = config.MYSQL_CONNECTION;
var mysql       = require('mysql');

var client = mysql.createConnection(connOptions);

function mapProfileToPassportProfile (userProfile) {
  var passportUser = {
    id: userProfile.id,
    displayName: userProfile.firstname + ' '  + userProfile.lastname,
    name: {
      familyName: userProfile.lastname,
      givenName:  userProfile.firstname
    }, 
    emails:   [{value: userProfile.email}]
  };

  return passportUser;
}


exports.getProfile = function (username, password, callback) {
  client.query("SELECT id, firstname, lastname, " +
                "email, password FROM Users where email = ?", 
                [username], function (err, results, fields) {
    
    console.log(results);

    if(err) return callback(err);
    
    if(results.length == 0) return callback(null , null);

    if (results[0].password !== password) return callback(null, null); 

    //map row to profile
    passportUser = mapProfileToPassportProfile(results[0]);

    callback(null, passportUser);
  });
};