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
    emails:   [ { value: 'foo@bar.com' } ]
  }
];

exports.getProfile = function (name, password, callback) {
  var user = users.filter(function (user) { 
    return user.username === name;
  })[0];

  if (password !== user.password) return callback();
  
  return callback(null, user);
};

exports.generateRandomTicket = function (email, callback) {
  var user = users.filter(function (user) { 
    return user.emails.filter(function (userEmail) {
      return userEmail.value == email
    })[0];
  })[0];

  var validChars = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  user.ticket = "";
  for (var i = 0; i < 16; i++){
    user.ticket += validChars[Math.floor(Math.random()*validChars.length)];
  }
  
  return callback(null, user.ticket);
};

exports.getUserByRandomTicket = function (ticket, callback) {
  var user = users.filter(function (user) { 
    return user.ticket === ticket;
  })[0];
  
  return callback(null, user);
};

exports.update = function (id, updatedUser, callback) {
  var user = users.filter(function (user) { 
    return user.id === id;
  })[0];

  user.password = updatedUser.password;
  
  return callback(null, user);
};
