var utils = require('./utils');

var users = [
  {
    id:           123,
    email:        'foo@bar.com',
    password:     '123', 
    displayName:  'test user',
    name: {
      familyName: 'user',
      givenName:  'test'
    }, 
    emails:       [ { value: 'foo@bar.com' } ],
    active:       true
  }
];

exports.create = function (user, callback) {
  var exists_user = users.filter(function (existing_user) { 
    return existing_user.email === user.email;
  })[0];

  if (exists_user)
    return callback('User Exists');

  var new_user = {
    id:           utils.uid(16),
    password:     user.password, 
    email:        user.email, 
    displayName:  '',
    name: {
      familyName: '',
      givenName:  ''
    }, 
    emails:       [ { value: user.email } ],
    active:       false
  }

  users.push(new_user);
  
  return callback(null, new_user);
};

exports.getProfile = function (email, password, callback) {
  var user = users.filter(function (user) { 
    return user.email === email && user.active;
  })[0];

  if (!user) return callback(null, null);

  if (password !== user.password) return callback();
  
  return callback(null, user);
};

exports.getUserByEmail = function (email, callback) {
  var user = users.filter(function (user) { 
    return user.email === email;
  })[0];
  
  return callback(null, user);
};

exports.update = function (id, updatedUser, callback) {
  var user = users.filter(function (user) { 
    return user.id === id;
  })[0];

  if (updatedUser.password) user.password = updatedUser.password;
  if (updatedUser.active) user.active = updatedUser.active;  
  
  return callback(null, user);
};
