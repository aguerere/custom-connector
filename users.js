var utils = require('./utils');

var users = [
  {
    id:           123,
    username:     'test', 
    password:     '123', 
    displayName:  'test user',
    name: {
      familyName: 'user',
      givenName:  'test'
    }, 
    emails:   [ { value: 'foo@bar.com' } ],
    active:       true
  }
];

exports.create = function (user, callback) {
  var exists_user = users.filter(function (existing_user) { 
    return existing_user.username === user.username || existing_user.emails.filter(function(email) { return email.value == user.email })[0];
  })[0];

  if (exists_user)
    return callback('User Exists');

  var new_user = {
    id:           utils.uid(16),
    username:     user.username, 
    password:     user.password, 
    displayName:  user.display_name,
    name: {
      familyName: user.last_name,
      givenName:  user.first_name
    }, 
    emails:   [ { value: user.email } ],
    active:       false,
    ticket:       utils.uid(16), 
  }

  users.push(new_user);
  
  return callback(null, new_user);
};

exports.getProfile = function (name, password, callback) {
  var user = users.filter(function (user) { 
    return user.username === name && user.active;
  })[0];

  if (!user) return callback('User not found');

  if (password !== user.password) return callback();
  
  return callback(null, user);
};

exports.generateRandomTicket = function (email, callback) {
  var user = users.filter(function (user) { 
    return user.emails.filter(function (userEmail) {
      return userEmail.value == email
    })[0];
  })[0];

  user.ticket = utils.uid(16);
  
  return callback(null, user.ticket);
};

exports.getUserByRandomTicket = function (ticket, callback) {
  var user = users.filter(function (user) { 
    return user.ticket === ticket;
  })[0];
  
  return callback(null, user);
};

exports.getUserByEmail = function (email, callback) {
  var user = users.filter(function (user) { 
    return user.emails.filter(function (user_email) {
      return user_email.value == email
    })[0];
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
