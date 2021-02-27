var express = require('express');
app = express();
var router = express.Router();
global.Models = require('../../models');
var Coupons = Models.Coupons;
var Business = Models.Business;
var Stores = Models.Stores;
var Users = Models.User;
var Redeemed = Models.Redeemed;
var Interested = Models.Interested;
var Categories = Models.Categories;
var Subcategories = Models.Subcategories;

global.FUNC = require('../../functions/businessfunctions.js');
var path = require('path');

router.get('/', FUNC.Auth, function (req, res, next) {
    var user_id = req.session.business_user.id;
    Redeemed.findAll({
        include: [

            {
                model: Users,
                attributes: ['id', 'fname', 'lname']
            },
            {
                model: Coupons,
                attributes: ['title', 'description']
            },
            {
                model: Stores,
                where:  { userId: user_id },
                attributes: ['id', 'userId', 'store_name', 'store_location']
            }
        ],
        order: [
            ['id', 'DESC']
        ]
    }).then(results => {
        console.log('results=======', JSON.stringify(results));
        res.render('finance/index', { dealInfo: results, title: 'finance' });
    }).catch(function (err) {
        console.log('catch', err);
        return res.redirect('/');
    });
});

router.post('/checkValidation', function (req, res, next) {
    var user_id = req.session.business_user.id;
    Interested.findOne({
        where: {
            coupon_code: req.body.couponCode,
            '$coupon.store.userId$' : user_id
        },
        include: [
            {
                model: Coupons,
                attributes: ['id','storeId'],
                include: [
                    {
                        model: Stores,
                        // where: { userId: user_id },
                        required: false
                    }
                ]
            }
        ]
    }).then(getIntrested=>{
        if(getIntrested){
            Coupons.findOne({
                where: { id: getIntrested.coupon.id,storeId: getIntrested.coupon.storeId},
                include: [
                    {model:Stores,attributes:['id',['store_name','store_name']]},
                    {model:Categories,attributes:['id',['name','name']]},
                    {model:Subcategories,attributes:['id',['name','name']]}
                ]
            }).then(results => {
                console.log("results--------------",results)
                if(results){
                    var curTIme = moment().format("YYYY-MM-DD HH:mm");
                    var end_date = moment(results.end_date).format("YYYY-MM-DD HH:mm");
                    if (end_date >= curTIme) {
                        Redeemed.findAll({
                            where: {couponId: getIntrested.coupon.id, storeId: getIntrested.coupon.storeId},
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
            return res.status(200).json({status: false, notApp: true, msg: ADMIN_MSG.CouponNotAvaliable});
        }
    }).catch(function (err){
        console.log("---err",err)
        return res.status(200).json({status: false, msg: ADMIN_MSG.CommonError});
    });
});

router.post('/verifyCoupon', function (req, res, next) {
    var user_id = req.session.business_user.id;
    Interested.findOne({
        where: {
            coupon_code: req.body.couponCodeVerify,
            '$coupon.store.userId$' : user_id
        },
        include: [
            {
                model: Coupons,
                attributes: ['id','storeId'],
                include: [
                    {
                        model: Stores,
                        // where: { userId: user_id },
                        required: false
                    }
                ]
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
                                storeId: getIntrested.coupon.storeId,
                                items: results.items,
                                max_users: results.max_users,
                                discount: results.discount,
                                original_price: results.original_price,
                                final_price: results.final_price,
                                start_date: results.start_date,
                                end_date: results.end_date,
                                status: true
                            };
                            if (redeemedInfo.length > 0) {
                                if (redeemedInfo.find(item => parseInt(item.userId, 10) === parseInt(getIntrested.user_id, 10))) {
                                    return res.status(200).json({status: false, msg: ADMIN_MSG.AlreadyRedeemed});
                                } else if (redeemedInfo.length >= results.max_users) {
                                    return res.status(200).json({status: false,  msg: ADMIN_MSG.MaxUserLimit});
                                } else {
                                    Redeemed.create(redeeme).then(result => {
                                        return res.status(200).json({status: true, msg: ADMIN_MSG.CouponRedeemed});
                                    }).catch(function (err) {
                                        console.log('err========>', err);
                                        return res.status(200).json({status: false, msg: ADMIN_MSG.CommonError});
                                    });
                                }
                            } else {
                                Redeemed.create(redeeme).then(result => {
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
                    return res.status(200).json({status: false, msg: ADMIN_MSG.CouponNotForAnyStore});
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

module.exports = router;

