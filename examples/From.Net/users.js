var edge = require('edge');

var usersQuery = edge.func('users.csx');

exports.getProfile = function (userName, password, callback) {
  usersQuery({ userName: userName, 
               password: password}, function (err, user) {
    if (err) {
      console.log(err);
      callback(err);
    }
    if (!user) return callback();
    return callback(null, user);
  });
};