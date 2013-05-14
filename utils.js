var utils = module.exports;

utils.uid = function(length) {
  var validChars = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var id = "";
  for (var i = 0; i < length; i++){
    id += validChars[Math.floor(Math.random()*validChars.length)];
  }
  return id;
};