// Import Models
//var Users = require('../models/users.js');
// var PostModel = require('../models/posts.js');
var Stores = Models.Stores;
var Users = Models.User;
var Coupons = Models.Coupons;
const randomstring = require("randomstring");
const asyncFun = require("async");

var request = require('request');
const Reports = require("../models/Reports");
var Subscriptions = Models.Subscription;
var Subscription = Models.Subscription;
var SubscriptionStatus = Models.SubscriptionStatus;
var NotificationsStatus = Models.NotificationsStatus;
var Transactions = Models.Transactions;
global.paymentkey = "r8rp54d16i92od1aeqbjkihjrkoaieen";
global.entityid = "99992";

module.exports = {
    validate: function (rulesObj){
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
                reply: DM.ACCESS_TOKEN_NOT_FOUND,//'Access token not found.'
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
                    reply: DM.ACCESS_TOKEN_NOT_MACHED, //'Access token not matched.'
                });
            } else {
                await Users.update({ user_lang: lang }, { where: { id: user.id } }).then(() => { });
                if (user.status == false) {
                    return res.status(HttpStatus.OK).send({
                        status: false,
                        reply: DM.ACTIVE_YOUR_ACOUNT, //'Activate you account first by activation link from your email address.'
                    });
                } else if (user.isActive == false) {
                    return res.status(HttpStatus.OK).send({
                        status: false,
                        deactivate: true,
                        reply: DM.DEACTIVE_YOUR_ACOUNT, //'You are deactivated by admin.Please contact your admin'
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
                        req.flash('error', ADMIN_MSG.DEACTIVE_YOUR_ACOUNT); //'You are deactivated by admin.Please contact your admin.'
                        return res.redirect("/login");
                    }
                }).catch(function (err) {
                    console.log('auth error========>', err);
                    req.flash('error', ADMIN_MSG.CommonError); //'Something went wrong.'
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
                    req.flash('error', ADMIN_MSG.DEACTIVE_YOUR_ACOUNT); //'You are deactivated by admin.Please contact your admin.'
                    return res.redirect("/login");
                }
            }).catch(function (err) {
                console.log('auth error========>', err);
                req.flash('error', ADMIN_MSG.CommonError); //'Something went wrong.'
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
    hasSubscription: function (req, res, next) {
        var user_id = req.session.business_user.id;
        // console.log("user_id==========================>", req.session.business_user.id);return;
        Subscriptions.findOne({ where: { userId: user_id } }).then(checkSubscription => {
            // console.log("checkSubscription==========================>", checkSubscription.id)
            var cureent_date = moment().format("YYYY-MM-DD");
            var isafter = moment(checkSubscription.subscription_expire_date).isAfter(cureent_date);
            //var isafter = 1;
            if (isafter) {
                return next();
            } else {
                req.flash('error', ADMIN_MSG.SubscriptionExpire);
                res.redirect('/payment/purchase_subscription');
            }
        })
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
        console.log("Message", message);
        return;
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
    expireWelcomCoupon : function(){
        console.log("exprire welcome coupon for user cron code========================")
        Users.findAll({
            where: { status: true, welcome_coupon:1,user_type: 3 },
            raw: true
        }).then(users => {
            users.forEach(async function(user,index){

                console.log('user.createdAt=========================',user.createdAt);
                end_date = new Date(new Date(user.createdAt).getTime() + 24 * 60 * 60 * 1000);
               // console.log("end_date######################",end_date)
                //console.log("new date time",new Date())
                var isLarger = new Date() > new Date(end_date);
                console.log("larger or not",isLarger);

                if(isLarger){
                await Users.update({ 'welcome_coupon': 0 }, {where: { id: user.id, user_type: 3 }})
                }


            })

        }).catch(function (err) {
            console.log('catch', err);
            //return res.redirect('/');
        });
    },
    sendNotification: function () {
        var FCM = require('fcm-push');
        var fcm = new FCM(process.env.FCM_KEY);
        var Notifications = Models.Notifications;
        console.log("Your are in send notification funciton")
        var currentTime = moment().format("YYYY-MM-DD HH:mm");//"2019-04-11 13:29:00";// "2019-03-28 05:55:00";//
        console.log("---currentTime", currentTime);
        //var distanceInMiles = 1.60934 * 10; //miles * KM
        var currentTime1 = moment(currentTime).subtract(1, 'minutes').format("YYYY-MM-DD HH:mm:ss");
        var currentTime2 = moment(currentTime).subtract(1, 'minutes').format("YYYY-MM-DD HH:mm:ss");
        console.log("currentTime1======================", currentTime1)
        var distanceInMiles = 1.60934 * 6.2;
        var distanceInMilesCoupon = 1.60934 * 6.2;
        //AND c.start_date = '"+currentTime+"' AND s.isActive = 1 AND s.status = 1 and start_date: currentTime

        Coupons.findAll({                                                       //start_date: {$gte : currentTime2}
            where: { isActive: true, status: true, blockAdmin: false, start_date : currentTime2},
            group: 'coupons.id'
        }).then(allCoupons => {
            console.log("kupons found=========" + allCoupons)
            if (allCoupons) {
                console.log("kupons found=========" + allCoupons)
                asyncFun.eachSeries(allCoupons, async (coupon, cb) => {
                    let storeArr = coupon.storeId.split(",");
                    var usersArr = [];
                    var allStore = await Stores.findAll({
                        attributes: ['id', 'latitude', 'longitude'],
                        where: { id: { $in: JSON.parse("[" + storeArr + "]") } }
                    });
                    var notin = "";
                    //let eng_userIds = ['197','158'];
                    let eng_userIds = [];
                    //let eng_userTokens = ['coQexYqp3ZI:APA91bHTUhcWjTiz1Yz6C0C5iFhKVvVkQ8OlsEP8qHlU-xx1NcpX2iFXSEyBkcba6Pp0hNHSnuQJ2zyXgccXq0hCEe-GLk-asRiwWX_aPIV5K_TRdrBaG5laCl8W95KwvZhnJdHRSne3','fh6MOPV8xNo:APA91bH0PHnIg6Cw6j4PFZLxlifoEAegCUcYm747cnNTEJ0Z1-_dPQSulS-u3zF8PPu7BfoxahpY8ozzVtjfStodbc3nKhHMcxk49T7HMc09PNluJLjnpSCfuwjYMjC73uWgezNLzDly'];
                    let eng_userTokens = [];
                    asyncFun.eachSeries(allStore, async (element, cb1) => {
                        notin = (usersArr.length) ? " AND id NOT IN (" + JSON.parse("[" + usersArr + "]") + ")" : "";
                        //var getUsers = await sequelize.query("SELECT id, device_id, user_lang FROM users  WHERE status = true AND user_type = 3 AND allow_notificatoin = 1 ")
                        console.log("distanceInMilesCoupon ",distanceInMilesCoupon)
                        if(coupon.created_by == 'business'){
                            var getUsers = await sequelize.query("SELECT id, device_id, user_lang FROM users WHERE (FIND_IN_SET(:id, subcategory)) AND CHAR_LENGTH(device_id) > 50 AND status = true AND user_type = 3 AND allow_notificatoin = 1 AND latitude!='' and longitude!='' " + notin + "  AND ( 6387.7  * acos( cos( radians(" + element.latitude + ") ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(" + element.longitude + ") ) + sin( radians(" + element.latitude + ") ) * sin( radians( latitude ) ) ) ) < " + distanceInMilesCoupon + " group by id", { replacements: { id: coupon.subcategoryId }, type: sequelize.QueryTypes.SELECT, raw: true })
                        }else{
                            var getUsers = await sequelize.query("SELECT id, device_id, user_lang FROM users WHERE  CHAR_LENGTH(device_id) > 50 AND status = true AND user_type = 3 AND allow_notificatoin = 1 AND latitude!='' and longitude!='' " + notin + "  AND ( 6387.7  * acos( cos( radians(" + element.latitude + ") ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(" + element.longitude + ") ) + sin( radians(" + element.latitude + ") ) * sin( radians( latitude ) ) ) ) < " + distanceInMilesCoupon + " group by id", { type: sequelize.QueryTypes.SELECT, raw: true })
                        }

                        getUsers.map((user, index) => {
                            console.log("user&&&&&&&&&&&&&",user.device_id)
                            if (usersArr.indexOf(user.id) === -1) {
                                console.log("userif=================",user.device_id)
                                usersArr.push(user.id);
                                eng_userIds.push(user.id);
                                eng_userTokens.push(user.device_id);
                            }
                        })
                    }, (err) => {
                        if(err) console.error(err.message);
                        console.log("eng_userIds&&&&&&&&&&&&&",eng_userIds)
                        if (eng_userIds.length && eng_userTokens.length) {
                            var message1 = {
                                data: {
                                    title: coupon.title,
                                    body: coupon.description,
                                    badge: 1,
                                    sound: "default",
                                    noti_type: "coupon",
                                    coupon_id: coupon.id,
                                    icon : 'notification',
                                },
                                notification: {
                                    title: coupon.title,
                                    body: coupon.description,
                                    badge: 1,
                                    sound: "default",
                                    noti_type: "coupon",
                                    coupon_id: coupon.id,
                                    icon : 'notification',
                                },
                                // to: 'coQexYqp3ZI:APA91bHTUhcWjTiz1Yz6C0C5iFhKVvVkQ8OlsEP8qHlU-xx1NcpX2iFXSEyBkcba6Pp0hNHSnuQJ2zyXgccXq0hCEe-GLk-asRiwWX_aPIV5K_TRdrBaG5laCl8W95KwvZhnJdHRSne3',
                                collapse_key: 'applice',
                                sound: 'default',
                                delayWhileIdle: true,
                                timeToLive: 3,

                            };

                            eng_userTokens.forEach(async function (element, index) {
                                // send notification
                                if (element) {
                                    message1.to = element;
                                    fcm.send(message1, function (err, response) {
                                        if (err) {
                                            console.log("Something has gone wrong !", err);
                                        } else {
                                            console.log("Successfully sent with response :", response);
                                        }
                                    });
                                }

                            })

                            var NotiData = {
                                userId: coupon.userId,
                                message: coupon.description,
                                couponId: coupon.id,
                                end_date: coupon.end_date,
                                noti_type: 'coupon',
                                user_ids: eng_userIds.join(",")
                            };
                            console.log("-----NotiData---", NotiData);
                            Notifications.create(NotiData).then(newresult => {

                                eng_userIds.forEach(async function (element, index) {
                                    var NotiuserData = {
                                        userId: coupon.userId,
                                        message: coupon.description,
                                        couponId: coupon.id,
                                        end_date: coupon.end_date,
                                        noti_type: 'coupon',
                                        user_id: element
                                    };

                                    if (element) {
                                        noti = await NotificationsStatus.create(NotiuserData);
                                    }
                                })
                                //console.log('success', 'Coupon added Successfully.');
                            });
                        }
                    });
                },(err) => {
                    if (err) console.error(err.message);
                    console.log('inner end')
                });
            } else {
                console.log("allCoupons--", "no coupons found");
            }
        }).catch(function (err) {
            console.log('catch', err);
        });
        // send deals notification
        const Deals = Models.Deals;
        //var distanceInMiles = 1.60934 * 20; //miles * KM
        var distanceInMiles = 1.60934 * 12.4;
        Deals.findAll({
            where: { isActive: true, status: true, blockAdmin: false, start_date: currentTime2},
            group: 'deals.id',
            raw: true
        }).then(dealsResult => {
            if (dealsResult) {
                // dealsResult.forEach( async (deal) => {
                asyncFun.eachSeries(dealsResult, async (deal) => {
                    // get stores by business user id
                    let stores = await Stores.findAll({ where: { userId: deal.userId } });
                    var usersArr = [];
                    var notin = "";
                  // let eng_userIds = ['197','158'];
                  let eng_userIds = [];
                    //let eng_userTokens = ['coQexYqp3ZI:APA91bHTUhcWjTiz1Yz6C0C5iFhKVvVkQ8OlsEP8qHlU-xx1NcpX2iFXSEyBkcba6Pp0hNHSnuQJ2zyXgccXq0hCEe-GLk-asRiwWX_aPIV5K_TRdrBaG5laCl8W95KwvZhnJdHRSne3','fh6MOPV8xNo:APA91bH0PHnIg6Cw6j4PFZLxlifoEAegCUcYm747cnNTEJ0Z1-_dPQSulS-u3zF8PPu7BfoxahpY8ozzVtjfStodbc3nKhHMcxk49T7HMc09PNluJLjnpSCfuwjYMjC73uWgezNLzDly'];
                    let eng_userTokens = [];

                    asyncFun.eachSeries(stores, async (element) => {
                        notin = (usersArr.length) ? " AND id NOT IN (" + JSON.parse("[" + usersArr + "]") + ")" : "";
                        var getUsers = await sequelize.query("SELECT id, device_id, user_lang FROM users WHERE (FIND_IN_SET(:id, subcategory)) AND CHAR_LENGTH(device_id) > 50 AND status = true AND user_type = 3 AND allow_notificatoin = 1 AND latitude!='' and longitude!='' " + notin + "  AND ( 6387.7 * acos( cos( radians(" + element.latitude + ") ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(" + element.longitude + ") ) + sin( radians(" + element.latitude + ") ) * sin( radians( latitude ) ) ) ) < " + distanceInMiles + " group by id", { replacements: { id: deal.subcategoryId }, type: sequelize.QueryTypes.SELECT, raw: true })

                        getUsers.map((user, index) => {
                            if (usersArr.indexOf(user.id) === -1) {
                                usersArr.push(user.id);
                                eng_userIds.push(user.id);
                                eng_userTokens.push(user.device_id);
                            }
                        })
                    }, (err) => {
                        if (err) console.error(err.message);
                        if (eng_userIds.length && eng_userTokens.length) {
                            var message1 = {
                                data: {
                                    title: deal.title,
                                    body: deal.description,
                                    badge: 1,
                                    sound: "default",
                                    noti_type: "deal",
                                    coupon_id: deal.id,
                                    icon : 'notification',
                                },
                                notification: {
                                    title: deal.title,
                                    body: deal.description,
                                    badge: 1,
                                    sound: "default",
                                    noti_type: "deal",
                                    coupon_id: deal.id,
                                    icon : 'notification',
                                },
                                //to: "",
                                content_available: true,
                                priority: "high"
                            };
                            // send notification

                            eng_userTokens.forEach(async function (element, index) {
                                // send notification
                                if (element) {
                                    message1.to = element;
                                    fcm.send(message1, function (err, response) {
                                        if (err) {
                                            console.log("Something has gone wrong !", err);
                                        } else {
                                            console.log("Successfully sent with response :", response);
                                        }
                                    });
                                }

                            })
                            var NotiData = {
                                userId: deal.userId,
                                message: deal.description,
                                couponId: deal.id,
                                end_date: deal.end_date,
                                noti_type: 'deal',
                                user_ids: eng_userIds.join(",")
                            };
                            console.log("-----NotiData deals---", NotiData);
                            Notifications.create(NotiData).then(newresult => {
                                //console.log('success', 'Deal added Successfully.');

                                eng_userIds.forEach(async function (element, index) {
                                    var NotiuserData = {
                                        userId: deal.userId,
                                        message: deal.description,
                                        couponId: deal.id,
                                        end_date: deal.end_date,
                                        noti_type: 'deal',
                                        user_id: element
                                    };

                                    noti = await NotificationsStatus.create(NotiuserData);

                                })
                            });
                        }
                    });
                }, (err) => {
                    if (err) console.error(err.message);
                    console.log('inner end')
                });
            } else {
                console.log("---no deals---")
            }
        }).catch((err) => {
            console.log("--deals--err---", err);
        })
    },
    getPaymentSet: async function (req, res, next) {


        console.log("corn execute====ddddddddddddd=================================>")
        //680900000 720600000
        var url = paymenturl + '/payments';



        var options = {
            "uri": url,
            "headers": {
                "Authorization": "Token r8rp54d16i92od1aeqbjkihjrkoaieen",
                "Accept": "application/vnd.proxypay.v2+json",
                "Content-Type": "application/json"
            },
            "method": 'Get'

        };
        console.log("options", options)
        const test6676 = new Promise((a, b) => request(options, function (error, response, body) {
            ///request(options, function (error, response, body) {

            console.log("error", error)
            console.log("body", body)
            if (0) {
                console.log("body.length============", body.length);
                b("cron faild")
            } else {

                if (!error && response.statusCode == 200) {
                    var info = JSON.parse(body);

                    if (info.length) {
                        var counter = info.length;
                        info.map(function (key, index, arr) {
                            if (key.custom_fields) {
                                if (key.custom_fields.userId) {
                                    console.log('payment element', key)
                                    var user_id;
                                    user_id = key.custom_fields.userId;

                                    SubscriptionStatus.findAll({ limit: 1, where: { reference_id: key.reference_id, userId: user_id, payment_status: { $not: 'done' } } }).then(subsStatus => {
                                        var paystatus = subsStatus[0];

                                        if (paystatus) {
                                            console.log("status&&&&&&&&&&&&&&&&&&&&&&&&&&&&&", paystatus)
                                            console.log("status&&&&&&&&&&&&&&&&&&&&&&&&&&&&&", paystatus.id)

                                            var updateData;

                                            var transactionData = {
                                                userId: user_id,
                                                paid_amount: key.amount,
                                                transaction_id: key.terminal_transaction_id,
                                                reference_id: key.reference_id,
                                                payment_id: key.id,
                                                subscriptions_status_id: paystatus.id
                                            };

                                            Transactions.create(transactionData).then(transaction => {
                                                console.log("transaction===============", transaction)
                                                const getTotal = sequelize.query("SELECT SUM(paid_amount) as totalPaid FROM `transactions` WHERE reference_id='" + key.reference_id + "' and subscriptions_status_id ='" + paystatus.id + "'", { type: sequelize.QueryTypes.SELECT })
                                                    .then(transaction => {
                                                        console.log("transaction4444444444444444444444444444", transaction[0].totalPaid);
                                                        if (transaction[0].totalPaid >= paystatus.sub_amount) {
                                                            var currentDate = moment().format("YYYY-MM-DD");
                                                            var next30DayDate = moment(currentDate).add(30, 'days');


                                                            updateData = { no_of_days: 30, subscription_start_date: currentDate, subscription_expire_date: next30DayDate, subscription_type: 'paid' }
                                                            Subscription.update(updateData, { where: { userId: user_id } });

                                                            statusData = { paid_amount: transaction[0].totalPaid, payment_status: 'done' }
                                                            SubscriptionStatus.update(statusData, { where: { userId: user_id, payment_status: { $not: 'done' }, reference_id: key.reference_id } });

                                                            //SubscriptionStatus.update()
                                                            //awaitdeletePayment(key.id);
                                                            var url1 = `${paymenturl}/payments/${key.id}`;


                                                            var options1 = {
                                                                "uri": url1,
                                                                "headers": {
                                                                    "Authorization": "Token r8rp54d16i92od1aeqbjkihjrkoaieen",
                                                                    "Accept": "application/vnd.proxypay.v2+json",
                                                                    "Content-Type": "application/json"
                                                                },
                                                                "method": 'DELETE'

                                                            };
                                                            console.log("options", options1)
                                                            request(options1, function (error1, response1, body1) {

                                                                console.log("error", error1)
                                                                console.log("payment delete =================== body", body1)
                                                                console.log("response.statusCode", response1.statusCode)
                                                                if (!error1 && response1.statusCode == 200) {
                                                                    var info = JSON.parse(body1);
                                                                    console.log('info', info)
                                                                }
                                                                else {
                                                                    console.log("error", error1)
                                                                }
                                                                //res.send('ok')
                                                            });
                                                            //	deleteRefrence(key.reference_id)
                                                        } else {

                                                            statusData = { paid_amount: transaction[0].totalPaid, payment_status: 'partial' }
                                                            SubscriptionStatus.update(statusData, { where: { userId: user_id, payment_status: { $not: 'done' }, reference_id: key.reference_id } });
                                                            //deletePayment(key.id);
                                                            var url1 = `${paymenturl}/payments/${key.id}`;


                                                            var options1 = {
                                                                "uri": url1,
                                                                "headers": {
                                                                    "Authorization": "Token r8rp54d16i92od1aeqbjkihjrkoaieen",
                                                                    "Accept": "application/vnd.proxypay.v2+json",
                                                                    "Content-Type": "application/json"
                                                                },
                                                                "method": 'DELETE'

                                                            };
                                                            console.log("options", options1)
                                                            request(options1, function (error1, response1, body1) {

                                                                console.log("error", error1)
                                                                console.log("payment delete =================== body", body1)
                                                                console.log("response.statusCode", response1.statusCode)
                                                                if (!error1 && response1.statusCode == 200) {
                                                                    var info = JSON.parse(body1);
                                                                    console.log('info', info)
                                                                }
                                                                else {
                                                                    console.log("error", error1)
                                                                }
                                                                //res.send('ok')
                                                            });
                                                        }




                                                    }).catch(function (err) {
                                                        console.log('catch after transaction total', err);
                                                    });

                                            })

                                        }
                                    }).catch(function (err) {
                                        console.log('catch', err);

                                    });
                                }
                            }

                            setTimeout(function () {
                                counter -= 1;
                                if (counter === 0)
                                    callback();

                            }, key);
                        })

                        function callback() {
                            console.log("callback execute");
                            a("cron successfully done");
                        }


                    }
                    //console.log(info);
                }
                else {
                    console.log("error", error)
                    b("Cron Faild");
                }
            }


            //	res.send('ok')

        }));

        await test6676;
    },
    sendNotiOnExpireCoupon: function () {
        var FCM = require('fcm-push');
        var fcm = new FCM(process.env.FCM_KEY);
        var Notifications = Models.Notifications;
        var beforeSomeMinutes = moment().add(15, 'minutes').format("YYYY-MM-DD HH:mm");
        console.log("-beforeSomeMinute********s", beforeSomeMinutes);
        //var distanceInMiles = 1.60934 * 10; //miles * KM
        var distanceInMiles = 1.60934 * 6.2;
        Coupons.findAll({
            where: { isActive: true, status: true, blockAdmin: false, end_date: beforeSomeMinutes },
            group: 'coupons.id'
        }).then(allCoupons => {
            if (allCoupons) {
                // allCoupons.forEach(async function(coupon) {
                asyncFun.eachSeries(allCoupons, async (coupon) => {
                    let storeArr = coupon.storeId.split(",");
                    var usersArr = [];
                    var allStore = await Stores.findAll({
                        attributes: ['id', 'latitude', 'longitude'],
                        where: { id: { $in: JSON.parse("[" + storeArr + "]") } }
                    });

                    var notin = "";
                    let eng_userIds = [];
                    let eng_userTokens = [];

                    let pt_userIds = [];
                    let pt_userTokens = [];
                    asyncFun.eachSeries(allStore, async (element) => {
                        notin = (usersArr.length) ? " AND id NOT IN (" + JSON.parse("[" + usersArr + "]") + ")" : "";
                        var getUsers = await sequelize.query("SELECT id, device_id, user_lang,email FROM users WHERE id NOT IN (SELECT userId from redeemeds WHERE userId = users.id AND couponId = '" + coupon.id + "') AND id NOT IN (SELECT user_id from not_interested_coupons WHERE user_id = users.id AND couponId = '" + coupon.id + "') AND  (FIND_IN_SET(:id, subcategory)) AND CHAR_LENGTH(device_id) > 50 AND status = true AND user_type = 3 AND allow_notificatoin = 1 AND latitude!='' and longitude!='' " + notin + "  AND ( 6387.7 * acos( cos( radians(" + element.latitude + ") ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(" + element.longitude + ") ) + sin( radians(" + element.latitude + ") ) * sin( radians( latitude ) ) ) ) < " + distanceInMiles + " group by id", { replacements: { id: coupon.subcategoryId }, type: sequelize.QueryTypes.SELECT, raw: true })

                        getUsers.map((user, index) => {
                            if (usersArr.indexOf(user.id) === -1) {

                                if (user.user_lang == 'en') {
                                    console.log("user.user_lang>>>>>>>>>>>", user.email);
                                    usersArr.push(user.id);
                                    eng_userIds.push(user.id);
                                    eng_userTokens.push(user.device_id);
                                } else {
                                    usersArr.push(user.id);
                                    pt_userIds.push(user.id);
                                    pt_userTokens.push(user.device_id);
                                }

                            }
                        })
                    }, async (err) => {
                        if (err) console.error(err.message);
                        if (eng_userIds.length && eng_userTokens.length) {
                            let expMessage = "Your coupon [TITLE] is going to be expired in 15 Mins";
                            var message1 = {
                                data: {
                                    title: expMessage.replace("[TITLE]", coupon.title),
                                    body: coupon.description,
                                    badge: 1,
                                    sound: "default",
                                    noti_type: "coupon",
                                    coupon_id: coupon.id,
                                    icon : 'notification',
                                },
                                notification: {
                                    title: expMessage.replace("[TITLE]", coupon.title),
                                    body: coupon.description,
                                    badge: 1,
                                    sound: "default",
                                    noti_type: "coupon",
                                    coupon_id: coupon.id,
                                    icon : 'notification',
                                },
                               // registration_ids: eng_userTokens,
                                content_available: true,
                                priority: "high"
                            };
                            // send notification
                            eng_userTokens.forEach(async function (element, index) {
                                // send notification
                                if (element) {
                                    message1.to = element;
                                    fcm.send(message1, function (err, response) {
                                        if (err) {
                                            console.log("Something has gone wrong !", err);
                                        } else {
                                            console.log("Successfully sent with response :", response);
                                        }
                                    });
                                }

                            })


                            var NotiData = {
                                userId: coupon.userId,
                                message: coupon.description,
                                couponId: coupon.id,
                                end_date: coupon.end_date,
                                noti_type: 'coupon',
                                user_ids: eng_userIds.join(",")
                            };
                            console.log("-expire-NotiData", NotiData)
                            Notifications.create(NotiData).then(newresult => {
                                // console.log('success', 'Coupon added Successfully.');
                                eng_userIds.forEach(async function (element, index) {
                                    var NotiuserData = {
                                        userId: coupon.userId,
                                        message: coupon.description,
                                        couponId: coupon.id,
                                        end_date: coupon.end_date,
                                        noti_type: 'coupon',
                                        user_id: element
                                    };

                                    noti = await NotificationsStatus.create(NotiuserData);

                                })

                            });
                        }

                        if (pt_userIds.length && pt_userTokens.length) {
                            let expPTMessage = "Su Kupon [TITLE] caducará en 15 min.";
                            var message1 = {
                                data: {
                                    title: expPTMessage.replace("[TITLE]", coupon.title),
                                    body: coupon.description,
                                    badge: 1,
                                    sound: "default",
                                    noti_type: "coupon",
                                    coupon_id: coupon.id,
                                    icon : 'notification',
                                },
                                notification: {
                                    title: expPTMessage.replace("[TITLE]", coupon.title),
                                    body: coupon.description,
                                    badge: 1,
                                    sound: "default",
                                    noti_type: "coupon",
                                    coupon_id: coupon.id,
                                    icon : 'notification',
                                },
                               // registration_ids: pt_userTokens,
                                content_available: true,
                                priority: "high"
                            };
                            // send notification
                            pt_userTokens.forEach(async function (element, index) {
                                // send notification
                                if (element) {
                                    message1.to = element;
                                    fcm.send(message1, function (err, response) {
                                        if (err) {
                                            console.log("Something has gone wrong !", err);
                                        } else {
                                            console.log("Successfully sent with response :", response);
                                        }
                                    });
                                }

                            })
                            var NotiData = {
                                userId: coupon.userId,
                                message: coupon.description,
                                couponId: coupon.id,
                                end_date: coupon.end_date,
                                noti_type: 'coupon',
                                user_ids: pt_userIds.join(",")
                            };
                            console.log("-expire-NotiDataPT>>>>>>>>>>>>>", NotiData)
                            Notifications.create(NotiData).then(newresult => {

                                pt_userIds.forEach(async function (element, index) {
                                    var NotiuserData = {
                                        userId: coupon.userId,
                                        message: coupon.description,
                                        couponId: coupon.id,
                                        end_date: coupon.end_date,
                                        noti_type: 'coupon',
                                        user_id: element
                                    };

                                    noti = await NotificationsStatus.create(NotiuserData);

                                })

                            });
                        }
                    });
                }, (err) => {
                    if (err) console.error(err.message);
                    console.log('inner end')
                });
            } else {
                console.log("allCoupons--", "no coupons found");
            }
        }).catch(function (err) {
            console.log('catch', err);
        });
    },
    expireDeals: () => {
        const Deals = Models.Deals;
        var currentTime = moment().format("YYYY-MM-DD HH:mm");//"2019-04-11 13:29:00";// "2019-03-28 05:55:00";//
        console.log("---currentTime", currentTime);
        Deals.update({ isActive: false }, { where: { end_date: { $lte: currentTime } } });
        Coupons.update({ isActive: false }, { where: { end_date: { $lte: currentTime } } });
        console.log("---updated all inactive deals / coupons");
    },
    getUnqiueString: function () {
        var randomObj = require("randomstring");
        return randomObj.generate({
            length: 10,
            charset: 'alphanumeric',
            capitalization: 'uppercase'
        });
    },

    unreadReports: function (req, res, next) {
            Reports.count({
                where: { status: true, admin_read:false }
            }).then(result => {
                if (result > 0) {
                    return result;
                } else {
                    return 0;
                }
            }).catch(function (err) {
                console.log('auth error========>', err);
                req.flash('error', ADMIN_MSG.CommonError);
                return res.redirect('/');
            });
        }

};