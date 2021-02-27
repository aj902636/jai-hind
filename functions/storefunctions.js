// Import Models
//var Users = require('../models/users.js');
// var PostModel = require('../models/posts.js');
var Stores = Models.Stores;
var Users = Models.User;
const randomstring = require("randomstring");

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
    apiAuth: function (req, res, next) {
        var login_token = req.headers.access_token;
        if (login_token == undefined || login_token == "") {
            return res.status(HttpStatus.OK).send({
                status: false,
                reply: 'Access token not found.'
            });
        }
        Users.findOne({
            where: {
                user_type: 3,
                access_token: login_token
            }
        }).then(user => {
            if (!user) {
                return res.status(HttpStatus.OK).send({
                    status: false,
                    reply: 'Access token not matched.'
                });
            } else {
                if (user.status == false) {
                    return res.status(HttpStatus.OK).send({
                        status: false,
                        reply: 'User not activated with this token'
                    });
                } else if (user.isActive == false) {
                    return res.status(HttpStatus.OK).send({
                        status: false,
                        deactivate: true,
                        reply: 'You are deactivated by admin.Please contact your admin'
                    });

                } else {
                    req.userData = user;
                    return next();
                }
            }
        });
    },
    Auth: function (req, res, next) {
        if (req.originalUrl == '/' || req.originalUrl == '/login' || req.url == '/forgot_password' || req.url == '/privacy' || req.url == '/terms' || req.url == '/activation' || req.url == '/password_reset') {
            if (req.session.store_user) {
                var uid = req.session.store_user.store_email;
                Stores.findOne({ where: { store_email: uid, status: true} }).then(counter => {
                    if (counter.isActive) {
                        return res.redirect('/dashboard');
                    } else {
                        req.flash('error', 'You are deactivated by admin.Please contact your admin.');
                        return res.redirect("/login");
                    }
                }).catch(function (err) {
                    console.log('auth error========>', err);
                    req.flash('error', 'Something went wrong.');
                    return res.redirect('/login');
                });
            } else {
                return next();
            }
        } else if (req.session.store_user) {
            var uid = req.session.store_user.store_email;
            Stores.findOne({ where: { store_email: uid, status: true} }).then(check => {
                if (check.isActive) {
                    return next();
                } else {
                    req.flash('error', 'You are deactivated by admin.Please contact your admin.');
                    return res.redirect("/login");
                }
            }).catch(function (err) {
                console.log('auth error========>', err);
                req.flash('error', 'Something went wrong.');
                return res.redirect('/login');
            });
        } else {
            req.flash('error', 'Unauthorized Access');
            return res.redirect("/login");
        }
    },
    hasStore: function (req, res, next) {
        if (req.session.business_user) {
            Stores.count({
                where: { status: true, userId: req.session.business_user.id }
            }).then(result => {
                if (result > 0) {
                    return next();
                } else {
                    req.flash('error', 'You have to add store to continue.');
                    res.redirect('/stores/add');
                }
            }).catch(function (err) {
                console.log('auth error========>', err);
                req.flash('error', 'Something went wrong.');
                return res.redirect('/');
            });
        } else {
            return res.redirect("/login");
        }
    },
    sendOTP: function (user_data, next) {
        var urlencode = require('urlencode');
        var phone = user_data.mobileNo;
        var sms_api_url = process.env.SMS_URL;
        var username = process.env.SMS_USER;
        var password = process.env.SMS_PW;
        var sender = process.env.SENDER_ID;
        var EN = require('../locale/en/message').Messages;
        var message = EN.OTP;
        console.log("Message", message); return;
        message = message.replace("[otp]", user_data.otp);
        message = urlencode(message);
        //http://cloud.smsindiahub.in/vendorsms/pushsms.aspx?user=abc&password=xyz&msisdn=919898xxxxxx&sid=SenderId&msg=test%20message&fl=0&gwid=2
        request(sms_api_url + "user=" + username + "&password=" + password + "&msisdn=" + phone + "&sid=" + sender + "&msg=" + message + "&fl=0&gwid=2", function (error, response, body) {
            console.log("error", error);
            //console.log("response", response)
            console.log("body", body);
            next();

        });
    },
    generateOTP: function () {
        var otp = 1234;
        // if (process.env.env != "development") {
        //     otp = Math.floor(Math.random() * (9999 - 1000)) + 1000;
        // }
        return otp;
    },
};



