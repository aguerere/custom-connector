/*
 * this is an example user class for mongodb.
 * It requires the mongodb and bcrypt modules
 */


var bcrypt   = require('bcrypt');
var Db = require('mongodb').Db;

var client = new Db('test', new Server("127.0.0.1", 27017, {}), {w: 1});

client.open(function() {});

exports.findByName = function (name, callback) {
  client.collection('users').findOne({name: name}, function (err, user) {
    if (err) return callback(err);
    return callback(null,   {
      id:           user._id.toString(),
      username:     user.name, 
      displayName:  user.fullName,
      name: {
        familyName: user.firstName,
        givenName:  user.givenName
      }, 
      emails:   [  ],
      validPassword: function (pwd) {
        return bcrypt.compareSync(pwd, user.passwordHash);
      }
    });
  });
};
