var jwt = require('jsonwebtoken');

exports.generateKey = function(userId, cb) {
    var token = jwt.sign({ userId: userId }, process.env.SECRET_KEY);
    console.log(token);
    cb(token)
}





exports.decodeKey = function(token, cb) {
    var decoded = jwt.verify(token, process.env.SECRET_KEY);
    console.log(decoded) // bar
    cb(decoded)
}