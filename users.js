var users = [
  {
    id:           123,
    username:     'test', 
    displayName:  'test user',
    name: {
      familyName: 'user',
      givenName:  'test'
    }, 
    emails:   [ { value: 'foo@bar.com'} ],
    validPassword: function (pwd) {
      return pwd === '123';
    }
  }
];

exports.findByName = function (name, callback) {
  var user = users.filter(function (user) { 
    return user.username === name;
  })[0];

  return callback(null, user);
};
