// Import Models
//var Users = require('../models/users.js');
// var PostModel = require('../models/posts.js');
var Stores = Models.Stores;
var Users = Models.User;

module.exports = {
    validate: function (rulesObj) {
        return function (req, res, next) {
            // Validating Input 
            var validation = new Validator(req.body, rulesObj);
            if (validation.fails()) {
                //Validating fails 
                var errorObj = validation.errors.all();
                return res.status(HttpStatus.BAD_REQUEST).send({
                    error: HttpStatus.getStatusText(HttpStatus.BAD_REQUEST),
                    reply: errorObj[Object.keys(errorObj)[0]][0]
                });
            } else {
                return next();
            }
        }
    },
    Auth: function (req, res, next) {
        if (req.originalUrl == '/' || req.originalUrl == '/login' || req.url == '/forgot_password' || req.url == '/privacy' || req.url == '/terms' || req.url == '/activation' || req.url == '/password_reset') {
            if (req.session.user) {
                return res.redirect('/dashboard');
            }
            return next();
        } else if (req.session.user) {
            return next();
        } else {
            req.flash('error', 'Unauthorized Access');
            return res.redirect("/login");
        }
    }
}



