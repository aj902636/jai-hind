var express = require('express');
app = express();
var router = express.Router();
global.Models = require('../../models');
var Coupons = Models.Coupons;
var Deals = Models.Deals;
var Categories = Models.Categories;
var Business = Models.Business;
var Subcategories = Models.Subcategories;
var Users = Models.User;
var Redeemed = Models.Redeemed;
var Stores = Models.Stores;
var Interested = Models.Interested;
global.FUNC = require('../../functions/storefunctions.js');


var path = require('path');
var multer = require('multer');
const { ADMIN_MSG } = require('../../locale/en/message');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/deals/')
    },
    filename: function (req, file, cb) {
        var extname = path.extname(file.originalname).toLowerCase();
        cb(null, 'deals-' + Date.now() + extname)
    }
});

var upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        var filetypes = /jpeg|jpg|gif|png/;
        var mimetype = filetypes.test(file.mimetype);
        var extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb("Only images are allowed with following filetypes - " + filetypes);
    },
    limits: { fileSize: 150000 }
}).single('foo');

router.get('/', FUNC.Auth, function (req, res, next) {
    var store_id = req.session.store_user.id;
    console.log("store_id>>>>>>>>>>>>>>>>>",store_id);
    Redeemed.findAll({
        where: { storeId: store_id },
        include: [
            {
                model: Users,
                attributes: ['fname', 'lname']
            }
        ],
        order: [
            ['id', 'DESC']
        ]
    }).then(results =>  {
        console.log('results=======', JSON.stringify(results));
        res.render('finance/index', { dealInfo: results, title: 'finance' });
    }).catch(function (err) {
        console.log('catch', err);
        return res.redirect('/');
    });
});

router.get('/check', FUNC.Auth, function (req, res, next) {
       res.render('finance/add', { title: 'finance'});
});

router.post('/checkValidation', function (req, res, next) {
    console.log("checkValidation>>>>>>>>>>>>>>>>>>");
    Interested.findOne({
        where: {coupon_code: req.body.couponCode},
        include: [
            {
                model: Coupons,
                attributes: ['id','storeId']
            },
        ]
    }).then(getIntrested=>{
        if(getIntrested){
            Coupons.findOne({
                //where: { id: getIntrested.coupon.id,storeId: getIntrested.coupon.storeId},
                where: { id: getIntrested.coupon.id,storeId: {like:'%'+req.session.store_user.id+'%'}},
                include: [
                    {model:Stores,attributes:['id',['store_name','store_name']]},
                    {model:Categories,attributes:['id',['name','name']]},
                    {model:Subcategories,attributes:['id',['name','name']]}
                ]
            }).then(results => {
                //console.log("results--------------",results)
                if(results){
                    var curTIme = moment().format("YYYY-MM-DD HH:mm");
                    var end_date = moment(results.end_date).format("YYYY-MM-DD HH:mm");
                    if (end_date >= curTIme) {
                        Redeemed.findAll({
                            where: {couponId: getIntrested.coupon.id, storeId: {like:'%'+req.session.store_user.id+'%'}},
                            attributes: ['userId']
                        }).then(redeemedInfo => {
                            console.log("redeemedInfo--------------",redeemedInfo)
                            if (redeemedInfo.length > 0) {
                                if (redeemedInfo.find(item => parseInt(item.userId, 10) === parseInt(getIntrested.user_id, 10))) {
                                    return res.status(200).json({status: true, couponData: results, msg: ADMIN_MSG.AlreadyRedeemed});
                                } else if (redeemedInfo.length >= results.max_users) {
                                    return res.status(200).json({status: true, couponData: results, msg: ADMIN_MSG.MaxUserLimit});
                                } else {
                                    return res.status(200).json({status: true, nowSubmit: true,  couponData: results});
                                }
                            } else {
                                return res.status(200).json({status: true, nowSubmit: true, couponData: results});
                            }
                        });
                    } else {
                        return res.status(200).json({status: true, couponData: results, msg: ADMIN_MSG.CouponExpired});
                    }
                }else{
                    return res.status(200).json({status: false, notApp: true, msg: ADMIN_MSG.CouponNotAvaliable});
                }
            }).catch(function (err) {
                console.log("err--------------",err)
                return res.status(200).json({status: false, msg: ADMIN_MSG.CommonError});
            });
        }else{
            return res.status(200).json({status: false, notApp: true, msg: LANG.CouponNotAvaliable});
        }
    }).catch(function (err){
        return res.status(200).json({status: false, msg: ADMIN_MSG.CommonError});
    });
});

router.post('/verifyCoupon', function (req, res, next) {
    Interested.findOne({
        where: {coupon_code: req.body.couponCodeVerify},
        include: [
            {
                model: Coupons,
                attributes: ['id','storeId']
            },
            {
                model: Users,
                attributes: ['id','fname','device_id']
            }
        ]
    }).then(getIntrested=>{
        if(getIntrested){
            Coupons.findOne({
                where: { id: getIntrested.coupon.id,storeId: getIntrested.coupon.storeId},
            }).then(results => {
                if(results){
                    console.log("results--------------",results)
                    var curTIme = moment().format("YYYY-MM-DD HH:mm");
                    var end_date = moment(results.end_date).format("YYYY-MM-DD HH:mm");
                    if (end_date >= curTIme) {
                        Redeemed.findAll({
                            where: {couponId: getIntrested.coupon.id, storeId: getIntrested.coupon.storeId},
                            attributes: ['userId']
                        }).then(redeemedInfo => {
                            console.log("redeemedInfo--------------",redeemedInfo)
                            var redeeme = {
                                userId: getIntrested.user_id,
                                title: results.title,
                                description: results.description,
                                couponId: results.id,
                                coupon_code: req.body.couponCodeVerify,
                                //storeId: getIntrested.coupon.storeId,
                                storeId: req.session.store_user.id,
                                items: results.items,
                                max_users: results.max_users,
                                discount: results.discount,
                                original_price: results.original_price,
                                final_price: results.final_price,
                                start_date: results.start_date,
                                end_date: results.end_date,
                                status: true
                            };

                            var FCM = require('fcm-push');
                            var fcm = new FCM(process.env.FCM_KEY);
                            var message1 = {
                                data: {
                                    title: results.title+" "+LANG.Redeemed,
                                    body: 'coupon redeem successfully',
                                    badge: 1,
                                    sound: "default",
                                    noti_type: "redeem",
                                    coupon_id: results.id,
                                    icon : 'notification',
                                },

                                to: getIntrested.user.device_id, //'d7BXllGcSQ29rn3h1qTV_l:APA91bH53RKZnOMM-4S8xkoRcWFeuCB6jgZBrbRkKE26nIdpD4ipvKF-TZxyjtw8Od4DkZ8NcbkQ2bSp8UymHUCA_yAwDUucSZ8w4NZ6zsyqFYD987425MBOnPSLSUfP3krCD_dTTX4G',
                                collapse_key: 'applice',
                                sound: 'default',
                                delayWhileIdle: true,
                                timeToLive: 3,

                            };

                            if (redeemedInfo.length > 0) {
                                if (redeemedInfo.find(item => parseInt(item.userId, 10) === parseInt(getIntrested.user_id, 10))) {
                                    return res.status(200).json({status: false, msg: ADMIN_MSG.AlreadyRedeemed});
                                } else if (redeemedInfo.length >= results.max_users) {
                                    return res.status(200).json({status: false,  msg: ADMIN_MSG.MaxUserLimit});
                                } else {
                                    Redeemed.create(redeeme).then(result => {

                                        message1.to = message1.to;
                                        fcm.send(message1, function (err, response) {
                                            if (err) {
                                                console.log("Something has gone wrong !", err);
                                            } else {
                                                console.log("Successfully sent with response :", response);
                                            }
                                        });

                                        req.flash('success', ADMIN_MSG.CouponRedeemed);
                                        return res.status(200).json({status: true, msg: ADMIN_MSG.CouponRedeemed});
                                    }).catch(function (err) {
                                        console.log('err========>', err);
                                        return res.status(200).json({status: false, msg: ADMIN_MSG.CommonError});
                                    });
                                }
                            } else {
                                Redeemed.create(redeeme).then(result => {

                                    message1.to = message1.to;
                                    fcm.send(message1, function (err, response) {
                                        if (err) {
                                            console.log("Something has gone wrong !", err);
                                        } else {
                                            console.log("Successfully sent with response :", response);
                                        }
                                    });

                                    req.flash('success', ADMIN_MSG.CouponRedeemed);
                                    return res.status(200).json({status: true, msg: ADMIN_MSG.CouponRedeemed});
                                }).catch(function (err) {
                                    console.log('err========>', err);
                                    return res.status(200).json({status: false, msg: ADMIN_MSG.CommonError});
                                });
                            }
                        });
                    } else {
                        return res.status(200).json({status: false, msg: ADMIN_MSG.CouponExpired});
                    }
                }else{
                    return res.status(200).json({status: false, msg: ADMIN_MSG.CouponNotForStore});
                }
            }).catch(function (err) {
                return res.status(200).json({status: false, msg: ADMIN_MSG.CommonError});
            });
        }else{
            return res.status(200).json({status: false, notApp: true, msg: ADMIN_MSG.CouponNotAvaliable});
        }
    }).catch(function (err){
        return res.status(200).json({status: false, msg: ADMIN_MSG.CommonError});
    });
});

router.get('/view/:id', FUNC.Auth, function (req, res, next) {
    Deals.findOne({
        where: { id: req.params.id },
    }).then(results => {
        var user_id = req.session.business_user.id;
        Business.findOne({
            where: { userId: user_id },
        }).then(businessInfo => {
            var cats = businessInfo.categoryId.split(',');
            Categories.findAll({
                where: { id: cats, status: true, isActive: true },
                raw: true
            }).then(cat => {
                res.render('deals/view', { dealInfo: results, title: 'deals', cat });
            }).catch(function (err) {
                console.log('catch', err);
                return res.redirect('/');
            });
        });
    }).catch(function (err) {
        req.flash('error', 'Something went wrong.');
        return res.redirect('/deals');
    });
});

router.get('/detail/:id', FUNC.Auth, function (req, res, next) {
    Deals.findOne({
        where: { id: req.params.id },
        include: [
            {
                model: Categories,
                attributes: ['id', 'name', 'icon'],
            },
            {
                model: Subcategories,
                attributes: ['id', 'name']
            }
        ]
    }).then(couponInfo => {
        res.render('deals/detail', { title: 'deals', couponInfo });
    }).catch(function (err) {
        console.log(" req.params.id======>", err);
        req.flash('error', 'Something went wrong.');
        return res.redirect('/deals');
    });
});

router.post('/status', FUNC.Auth, function (req, res, next) {
    var {
        id,
        status
    } = req.body;

    Deals.update({ isActive: status }, {
        where: { id: id }
    }).then(result => {
        if (result)
            res.status(200).json({
                message: `status changed ${status}`
            });
    }).catch(function (err) {
        if (err)
            res.status(200).json({
                message: err
            });
    });
});

router.post('/get_subcat', function (req, res, next) {
    sequelize.query("SELECT * FROM `subcategories` WHERE `status`=1 AND `isActive`=1 AND `categoryId`=:id", { replacements: { id: req.body.id } },
        { type: sequelize.QueryTypes.SELECT })
        .spread(subcategories => {
            var y = new Array('<option value=""> -- Select Subcategory -- </option>');
            if (subcategories && subcategories.length > 0) {
                subcategories.forEach(function (value, index) {
                    var selected = "";
                    if (value.id == req.body.cityId) { var selected = "selected" }
                    var temp = '<option value="' + value.id + '"' + selected + '>' + value.name + '</option>';
                    y.push(temp);
                });
                res.json(JSON.parse(JSON.stringify(y)));
            } else {
                res.json(JSON.parse(JSON.stringify(y)));
            }
        }).catch(function (err) {
            req.flash('error', 'Something went wrong.');
            return res.redirect('/deals');
        });
});

router.post('/get_coupon_priview', function (req, res, next) {
    var formData = req.body;
    if (formData.sub_cat != '' && formData.title != '' && formData.discount != '' && formData.date != '' && formData.desc !== '') {
        var user_id = req.session.business_user.id;
        Users.findOne({
            where: { id: user_id },
            attributes: ['id', 'fname', 'lname', 'user_image']
        }).then(userInfo => {
            if (formData.img == '') {
                var catImgUrl = '/images/kupon-cat.jpg';
            } else {
                var catImgUrl = formData.img;
            }
            if (formData.offer == 1) {
                var discountValue = formData.discount + '% OFF ';
            } else {
                var discountValue = 'Special Offer';
            }
            var storeLogo = '/uploads/business/' + userInfo.user_image;

            //validDate = new Date(formData.date).toLocaleString('en-GB', { hour12: true });
            validDate = moment(formData.date).format('LT');

            var y = '<div class="cuponBlock"><div class="row"><div class="col-sm-4 align-content-center"><div class="kuponImg">' +
                '<img src="' + catImgUrl + '" alt="" width="160" height="170" class="img-fluid"></div></div><div class="col-sm-1"><div class="kuponDivider"><div class="halfRound"></div></div></div>' +
                '<div class="col-sm-5"><div class="kuponDetails"><div class="kuponsLogo">' +
                '<img src="/images/kupons-logo.png" alt="" class="img-fluid"> </div>' +
                '<div class="cuponCat">' + formData.title + '</div>' +
                '<div class="kuponDescp">' + formData.desc + '</div>' +
                '<div class="kuponExpire">Valid until ' + validDate + '</div></div></div>' +
                '<div class="col-sm-2"><div class="clientLogo"><img src="' + storeLogo + '" height="60" width="60" alt="" class="img-fluid img-circle">' +
                '<div class="btn waves-effect pull-right" style="margin-top: 80px;margin-right: 15px;">' + discountValue + '</div>' +
                '</div></div></div></div>';

            res.json(JSON.parse(JSON.stringify(y)));

        });
    } else {
        var y = '<div class="alert alert-danger alert-dismissable"> Please fill Complete form to preview deal</div>';

        res.json(JSON.parse(JSON.stringify(y)));
    }
});


module.exports = router;

