// var bcrypt   = require('bcrypt');
var Db = require('mongodb').Db;

var client = new Db('test', new Server("127.0.0.1", 27017, {}), {w: 1});

client.open(function() {});

exports.getProfile = function (name, callback) {
  client.collection('users').findOne({name: name}, function (err, user) {
    if (err) return callback(err);
    

    // validate password with the passwordHash..
    // if(!bcrypt.compareSync(password, user.password)) {
    //   return callback();
    // } 

    return callback(null,   {
      id:           user._id.toString(),
      username:     user.name, 
      displayName:  user.fullName,
      name: {
        familyName: user.firstName,
        givenName:  user.givenName
      }, 
      emails:   [  ]
    });
  });
};
