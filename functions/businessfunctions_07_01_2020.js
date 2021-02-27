// Import Models
//var Users = require('../models/users.js');
// var PostModel = require('../models/posts.js');
var Stores = Models.Stores;
var Users = Models.User;
var Coupons = Models.Coupons;
const randomstring = require("randomstring");
const asyncFun = require("async");

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
        var lang = req.user_language;
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
        }).then(async (user) => {
            if (!user) {
                return res.status(HttpStatus.OK).send({
                    status: false,
                    reply: 'Access token not matched.'
                });
            } else {
                await Users.update({user_lang: lang},{ where:{id: user.id}} ).then(() => {});
                if (user.status == false) {
                    return res.status(HttpStatus.OK).send({
                        status: false,
                        reply: 'User not activated with this token'
                    });
                } else if(user.isActive == false)
                {
                    return res.status(HttpStatus.OK).send({
                        status: false,
                        deactivate :true,
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
            if (req.session.business_user) {
                var uid = req.session.business_user.email;
                Users.findOne({ where: { email: uid, status: true, user_type: 2 } }).then(counter => {
                    if (counter.isActive && counter.adminApproved) {
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
        } else if (req.session.business_user) {
            var uid = req.session.business_user.email;
            Users.findOne({ where: { email: uid, status: true, user_type: 2 } }).then(check => {
                if (check.isActive && check.adminApproved) {
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
                    req.flash('error', ADMIN_MSG.ForceToAddStore);
                    res.redirect('/stores/add');
                }
            }).catch(function (err) {
                console.log('auth error========>', err);
                req.flash('error', ADMIN_MSG.CommonError);
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
    sendNotification: function(){
        var FCM = require('fcm-push');
        var fcm = new FCM(process.env.FCM_KEY);
        var Notifications = Models.Notifications;

        var currentTime = moment().format("YYYY-MM-DD HH:mm");//"2019-04-11 13:29:00";// "2019-03-28 05:55:00";//
        console.log("---currentTime",currentTime);
        var distanceInMiles = 1.60934 * 10; //miles * KM
        //AND c.start_date = '"+currentTime+"' AND s.isActive = 1 AND s.status = 1 and start_date: currentTime
        Coupons.findAll({
            where: { isActive: true , status: true, blockAdmin: false, start_date: currentTime },
            group: 'coupons.id'
        }).then(allCoupons => {
            if(allCoupons){
                asyncFun.eachSeries(allCoupons, async (coupon,cb) => {
                    let storeArr = coupon.storeId.split(",");
                    var usersArr = [];
                    var allStore = await Stores.findAll({
                        attributes: ['id','latitude','longitude'],
                        where: { id: { $in: JSON.parse("[" + storeArr + "]") } }
                    });
                    var notin = "";
                    let eng_userIds = [];
                    let eng_userTokens = [];
                    asyncFun.eachSeries(allStore,async (element,cb1)=>{
                        notin = (usersArr.length)? " AND id NOT IN ("+JSON.parse("[" + usersArr + "]")+")":"";
                        var getUsers =  await sequelize.query("SELECT id, device_id, user_lang FROM users WHERE (FIND_IN_SET(:id, subcategory)) AND CHAR_LENGTH(device_id) > 50 AND status = true AND user_type = 3 AND allow_notificatoin = 1 AND latitude!='' and longitude!='' "+notin+"  AND ( 6387.7 * acos( cos( radians("+element.latitude+") ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians("+element.longitude+") ) + sin( radians("+element.latitude+") ) * sin( radians( latitude ) ) ) ) < "+distanceInMiles+" group by id", { replacements: { id: coupon.subcategoryId },type: sequelize.QueryTypes.SELECT, raw: true })
                        getUsers.map((user, index) => {
                            if(usersArr.indexOf(user.id) === -1){
                                usersArr.push(user.id);
                                eng_userIds.push(user.id);
                                eng_userTokens.push(user.device_id);
                            }
                        })
                    }, (err) => {
                        if (err) console.error(err.message);

                        if(eng_userIds.length && eng_userTokens.length){
                            var message1 = {
                                data: {
                                    title: coupon.title,
                                    body: coupon.description,
                                    badge: 1,
                                    sound: "default",
                                    noti_type: "coupon",
                                    coupon_id: coupon.id
                                },
                                notification: {
                                    title: coupon.title,
                                    body: coupon.description,
                                    badge: 1,
                                    sound: "default",
                                    noti_type: "coupon",
                                    coupon_id: coupon.id
                                },
                                registration_ids: eng_userTokens,
                                content_available: true,
                                priority: "high"
                            };
                            // send notification
                            fcm.send(message1, function (err, response) {
                                if (err) {
                                    console.log("Something has gone wrong !", err);
                                } else {
                                    console.log("Successfully sent with response :", response);
                                }
                            });
                            var NotiData = {
                                userId: coupon.userId,
                                message: coupon.description,
                                couponId: coupon.id,
                                end_date: coupon.end_date,
                                noti_type: 'coupon',
                                user_ids: eng_userIds.join(",")
                            };
                            console.log("-----NotiData---",NotiData);
                            Notifications.create(NotiData).then(newresult => {
                                console.log('success', 'Coupon added Successfully.');
                            });
                        }
                    });
                },(err) => {
                    if (err) console.error(err.message);
                    console.log('inner end')
                });
            }else{
                console.log("allCoupons--","no coupons found");
            }
        }).catch(function (err) {
            console.log('catch', err);
        });
        // send deals notification
        const Deals = Models.Deals;
        var distanceInMiles = 1.60934 * 20; //miles * KM
        Deals.findAll({
            where: {isActive: true , status: true, blockAdmin: false, start_date: currentTime},
            group: 'deals.id',
            raw: true
        }).then(dealsResult=>{
            if(dealsResult){
                // dealsResult.forEach( async (deal) => {
                asyncFun.eachSeries(dealsResult, async (deal) => {
                    // get stores by business user id
                    let stores = await Stores.findAll({where: { userId: deal.userId } });
                    var usersArr = [];
                    var notin = "";
                    let eng_userIds = [];
                    let eng_userTokens = [];
                    asyncFun.eachSeries(stores,async (element)=>{
                        notin = (usersArr.length)? " AND id NOT IN ("+JSON.parse("[" + usersArr + "]")+")":"";
                        var getUsers =  await sequelize.query("SELECT id, device_id, user_lang FROM users WHERE (FIND_IN_SET(:id, subcategory)) AND CHAR_LENGTH(device_id) > 50 AND status = true AND user_type = 3 AND allow_notificatoin = 1 AND latitude!='' and longitude!='' "+notin+"  AND ( 6387.7 * acos( cos( radians("+element.latitude+") ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians("+element.longitude+") ) + sin( radians("+element.latitude+") ) * sin( radians( latitude ) ) ) ) < "+distanceInMiles+" group by id", { replacements: { id: deal.subcategoryId },type: sequelize.QueryTypes.SELECT, raw: true })

                        getUsers.map((user, index) => {
                            if(usersArr.indexOf(user.id) === -1){
                                usersArr.push(user.id);
                                eng_userIds.push(user.id);
                                eng_userTokens.push(user.device_id);
                            }
                        })
                    }, (err) => {
                        if (err) console.error(err.message);
                        if(eng_userIds.length && eng_userTokens.length){
                            var message1 = {
                                data: {
                                    title: deal.title,
                                    body: deal.description,
                                    badge: 1,
                                    sound: "default",
                                    noti_type: "deal",
                                    coupon_id: deal.id
                                },
                                notification: {
                                    title: deal.title,
                                    body: deal.description,
                                    badge: 1,
                                    sound: "default",
                                    noti_type: "deal",
                                    coupon_id: deal.id
                                },
                                registration_ids: eng_userTokens,
                                content_available: true,
                                priority: "high"
                            };
                            // send notification
                            fcm.send(message1, function (err, response) {
                                if (err) {
                                    console.log("Something has gone wrong !", err);
                                } else {
                                    console.log("Successfully sent with response :", response);
                                }
                            });
                            var NotiData = {
                                userId: deal.userId,
                                message: deal.description,
                                couponId: deal.id,
                                end_date: deal.end_date,
                                noti_type: 'deal',
                                user_ids: eng_userIds.join(",")
                            };
                            console.log("-----NotiData deals---",NotiData);
                            Notifications.create(NotiData).then(newresult => {
                                console.log('success', 'Deal added Successfully.');
                            });
                        }
                    });
                },(err) => {
                    if (err) console.error(err.message);
                    console.log('inner end')
                });
            }else{
                console.log("---no deals---")
            }
        }).catch((err)=>{
            console.log("--deals--err---",err);
        })
    },
    sendNotiOnExpireCoupon: function(){
        var FCM = require('fcm-push');
        var fcm = new FCM(process.env.FCM_KEY);
        var Notifications = Models.Notifications;
        var beforeSomeMinutes = moment().add(15, 'minutes').format("YYYY-MM-DD HH:mm");
        console.log("-beforeSomeMinutes",beforeSomeMinutes);
        var distanceInMiles = 1.60934 * 10; //miles * KM
        Coupons.findAll({
            where: { isActive: true , status: true, blockAdmin: false, end_date: beforeSomeMinutes },
            group: 'coupons.id'
        }).then(allCoupons => {
            if(allCoupons){
                // allCoupons.forEach(async function(coupon) {
                asyncFun.eachSeries(allCoupons, async (coupon) => {
                    let storeArr = coupon.storeId.split(",");
                    var usersArr = [];
                    var allStore = await Stores.findAll({
                        attributes: ['id','latitude','longitude'],
                        where: { id: { $in: JSON.parse("[" + storeArr + "]") } }
                    });

                    var notin = "";
                    let eng_userIds = [];
                    let eng_userTokens = [];
                    let pt_userIds = [];
                    let pt_userTokens = [];
                    asyncFun.eachSeries(allStore,async (element)=>{
                        notin = (usersArr.length)? " AND id NOT IN ("+JSON.parse("[" + usersArr + "]")+")":"";
                        var getUsers =  await sequelize.query("SELECT id, device_id, user_lang FROM users WHERE id NOT IN (SELECT userId from redeemeds WHERE userId = users.id AND couponId = '"+coupon.id+"') AND id NOT IN (SELECT user_id from not_interested_coupons WHERE user_id = users.id AND couponId = '"+coupon.id+"') AND  (FIND_IN_SET(:id, subcategory)) AND CHAR_LENGTH(device_id) > 50 AND status = true AND user_type = 3 AND allow_notificatoin = 1 AND latitude!='' and longitude!='' "+notin+"  AND ( 6387.7 * acos( cos( radians("+element.latitude+") ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians("+element.longitude+") ) + sin( radians("+element.latitude+") ) * sin( radians( latitude ) ) ) ) < "+distanceInMiles+" group by id", { replacements: { id: coupon.subcategoryId },type: sequelize.QueryTypes.SELECT, raw: true })

                        getUsers.map((user, index) => {
                            if(usersArr.indexOf(user.id) === -1){

                                if (user.user_lang == 'es') {
                                    console.log("user.user_lang>>>>>>>>>>>",user.user_lang);
                                    usersArr.push(user.id);
                                    pt_userIds.push(user.id);
                                    pt_userTokens.push(user.device_id);
                                } else {
                                    usersArr.push(user.id);
                                    eng_userIds.push(user.id);
                                    eng_userTokens.push(user.device_id);
                                }

                            }
                        })
                    },async (err) => {
                        if (err) console.error(err.message);
                        if(eng_userIds.length && eng_userTokens.length){
                            let expMessage = "Your coupon [TITLE] is going to be expired in 15 Mins";
                            var message1 = {
                                data: {
                                    title: expMessage.replace("[TITLE]",coupon.title),
                                    body: coupon.description,
                                    badge: 1,
                                    sound: "default",
                                    noti_type: "coupon",
                                    coupon_id: coupon.id
                                },
                                notification: {
                                    title: expMessage.replace("[TITLE]",coupon.title),
                                    body: coupon.description,
                                    badge: 1,
                                    sound: "default",
                                    noti_type: "coupon",
                                    coupon_id: coupon.id
                                },
                                registration_ids: eng_userTokens,
                                content_available: true,
                                priority: "high"
                            };
                            // send notification
                            fcm.send(message1, function (err, response) {
                                if (err) {
                                    console.log("Something has gone wrong !", err);
                                } else {
                                    console.log("Successfully sent with response :", response);
                                }
                            });
                            var NotiData = {
                                userId: coupon.userId,
                                message: coupon.description,
                                couponId: coupon.id,
                                end_date: coupon.end_date,
                                noti_type: 'coupon',
                                user_ids: eng_userIds.join(",")
                            };
                            console.log("-expire-NotiData",NotiData)
                            Notifications.create(NotiData).then(newresult => {
                                console.log('success', 'Coupon added Successfully.');
                            });
                        }

                        if(pt_userIds.length && pt_userTokens.length){
                            let expPTMessage = "[TITLE] expirara em 15 minutos";
                            var message1 = {
                                data: {
                                    title: expPTMessage.replace("[TITLE]",coupon.title),
                                    body: coupon.description,
                                    badge: 1,
                                    sound: "default",
                                    noti_type: "coupon",
                                    coupon_id: coupon.id
                                },
                                notification: {
                                    title: expPTMessage.replace("[TITLE]",coupon.title),
                                    body: coupon.description,
                                    badge: 1,
                                    sound: "default",
                                    noti_type: "coupon",
                                    coupon_id: coupon.id
                                },
                                registration_ids: pt_userTokens,
                                content_available: true,
                                priority: "high"
                            };
                            // send notification
                            fcm.send(message1, function (err, response) {
                                if (err) {
                                    console.log("Something has gone wrong !", err);
                                } else {
                                    console.log("Successfully sent with response :", response);
                                }
                            });
                            var NotiData = {
                                userId: coupon.userId,
                                message: coupon.description,
                                couponId: coupon.id,
                                end_date: coupon.end_date,
                                noti_type: 'coupon',
                                user_ids: pt_userIds.join(",")
                            };
                            console.log("-expire-NotiDataPT>>>>>>>>>>>>>",NotiData)
                            Notifications.create(NotiData).then(newresult => {
                                console.log('success', 'Coupon added Successfully.');
                            });
                        }
                    });
                },(err) => {
                    if (err) console.error(err.message);
                    console.log('inner end')
                });
            }else{
                console.log("allCoupons--","no coupons found");
            }
        }).catch(function (err) {
            console.log('catch', err);
	    });
    },
    expireDeals: ()=>{
        const Deals = Models.Deals;
        var currentTime = moment().format("YYYY-MM-DD HH:mm");//"2019-04-11 13:29:00";// "2019-03-28 05:55:00";//
        console.log("---currentTime",currentTime);
        Deals.update({isActive: false}, { where:{end_date: { $lte : currentTime } } });
        Coupons.update({isActive: false}, { where:{end_date: { $lte : currentTime } } });
        console.log("---updated all inactive deals / coupons");
    },
    getUnqiueString : function(){
        var randomObj = require("randomstring");
        return randomObj.generate({
            length: 10,
            charset: 'alphanumeric',
            capitalization: 'uppercase'
        });
    }

};