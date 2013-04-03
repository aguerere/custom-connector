var users = [
  {
    id:           123,
    username:     'test', 
    displayName:  'test user',
    name: {
      familyName: 'user',
      givenName:  'test'
    }, 
    emails:   [ { value: 'foo@bar.com'} ]
  }
];

exports.getProfile = function (name, password, callback) {
  var user = users.filter(function (user) { 
    return user.username === name;
  })[0];

  if (password !== '123') return callback();
  
  return callback(null, user);
};
