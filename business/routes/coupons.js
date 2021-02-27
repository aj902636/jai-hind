var express = require('express');
app = express();
var router = express.Router();
global.Models = require('../../models');
var Coupons = Models.Coupons;
var Categories = Models.Categories;
var Business = Models.Business;
var Stores = Models.Stores;
var Users = Models.User;
var Notifications = Models.Notifications;
var Subcategories = Models.Subcategories;
var Redeemed = Models.Redeemed;
var Uninterested = Models.Uninterested;
var Subscriptions = Models.Subscription;
const CouponRating = Models.couponRating;
//const AWS = require("aws-sdk");
var fs = require("fs");
const sharp = require('sharp');
const async = require('async');
var path = require('path');
/*AWS.config.update({
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
    region: process.env.S3_REGION,
    apiVersion: "2006-03-01",
    signatureVersion: "v4",
    ACL: "public-read"
});
const s3 = new AWS.S3();*/
global.FUNC = require('../../functions/businessfunctions.js');


var multer = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/coupons/')
    },
    filename: function (req, file, cb) {
        var extname = path.extname(file.originalname).toLowerCase();
        cb(null, 'coupons-' + Date.now() + extname)
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
    limits: { fileSize: 15728640 }//15mb - 15 * 1024*1024
}).single('foo');

router.get('/', FUNC.Auth, function (req, res, next) {
    var user_id = req.session.business_user.id;
    var currentServerDate = moment().format("YYYY-MM-DD HH:mm");

    var whrCond = { userId: user_id,status: true,blockAdmin:0 };
    var status = true;
    if(typeof req.query.status != "undefined" && req.query.status != '' && req.query.status == 'inactive'){
        whrCond = Object.assign( { end_date: {$lte: currentServerDate} } ,  whrCond );
        status = false;
    }else{
        whrCond = Object.assign( {end_date: {$gte: currentServerDate} } ,  whrCond );
    }
    console.log(whrCond)
    Coupons.findAll({
        where: whrCond,
        attributes: [`id`, `categoryId`, `subcategoryId`, `userId`, `title`, `description`, `image`, `storeId`, `items`,  `max_users`, `discount`, `original_price`, `final_price`, `start_date`, `end_date`, `coupon_duration`, `isSpecial`, `isActive`, `blockAdmin`, `status`, `createdAt`, `updatedAt`,
        [sequelize.fn("COUNT", sequelize.col("redeemeds.id")), "redeemCount"], [sequelize.fn("COUNT", sequelize.col("not_interested_coupons.id")), "notIntCount"]],
        include: [
            {
                model: Categories,
                attributes: ['id', 'name']
            },
            {
                model: Subcategories,
                attributes: ['id', 'name']
            },
            {
                model: Redeemed,
                attributes: []
            },
            {
                model: Uninterested,
                attributes: []
            },
        ],
        group: ['coupons.id'],
        order:[['id','DESC']]
    }).then(results => {
        console.log("---results",JSON.stringify(results))
        res.render('coupons/index', { dealInfo: JSON.parse(JSON.stringify(results)), title: 'coupons', status});
    }).catch(function (err) {
        console.log('----------catch', err);
        //return res.redirect('/dashboard');
    });
});

router.get('/add', FUNC.Auth, function (req, res, next) {
    var user_id = req.session.business_user.id;
    console.log("user_id==========================>",user_id);
    Subscriptions.findOne( { where : {userId: user_id }}).then(checkSubscription=> {

        var cureent_date = moment().format("YYYY-MM-DD");
        var cureent_date_time = moment().add(1, 'minutes').format("YYYY-MM-DD HH:mm");
        console.log("checkSubscription==========================>",cureent_date)
        var isafter = moment(checkSubscription.subscription_expire_date).isAfter(cureent_date);
        //var isafter = 1;
        if(isafter){
            Business.findOne({
                where: { userId: user_id },
            }).then(businessInfo => {
                var cats = businessInfo.categoryId.split(',');
                Categories.findAll({
                    where: { id: cats, status: true, isActive: true },
                    raw: true
                }).then(cat => {
                    Stores.findAll({
                        where: { status: true, userId: user_id },
                        attributes: ['id', 'userId', 'store_name'],
                        raw: true
                    }).then(storeData => {
                        sequelize.query("SELECT sub.subscription_type, subs.category_id,subs.store_id FROM subscriptions as sub LEFT JOIN subscriptions_status as subs ON subs.userId = sub.userId where sub.userId = "+user_id+" ORDER BY subs.userId DESC LIMIT 1", { type: sequelize.QueryTypes.SELECT })
                        .then(subscription => {
                            //console.log(subscription[0].store_id );
                            let storeId = [];
                            let categoryIds = [];
                            if(subscription[0].store_id != null){
                                storeId = subscription[0].store_id.split(',') ;
                                categoryIds = subscription[0].category_id.split(',') ;
                            }

                            storeId = storeId.map(Number)
                            categoryIds = categoryIds.map(Number)
                            res.render('coupons/add', { title: 'coupons', cat, storeData,cureent_date_time:cureent_date_time, subscription : subscription[0],storeIds : storeId, categoryIds:categoryIds  });
                        }).catch(function(err){
                            console.log('catch', err);
                            return res.redirect('/');
                        });
                    }).catch(function (err) {
                        console.log('catch', err);
                        return res.redirect('/');
                    });
                }).catch(function (err) {
                    console.log('catch', err);
                    return res.redirect('/');
                });
            });
        }else{
            req.flash('error', ADMIN_MSG.SubscriptionExpire);
            res.redirect('/dashboard');
        }

    })
    .catch(function(err){
        console.log('catch', err);
        return res.redirect('/');
    })

});

router.post('/addCoupon', FUNC.Auth, function (req, res, next) {
    upload(req, res, function (err) {
        if (err) {
            if (err.code == 'LIMIT_FILE_SIZE') {
                req.flash('error', 'File size too large.Use maximum 15 MB file.');
            } else {
                req.flash('error', err);

            }
            return res.redirect('/coupons/add/');
        }
        if (req.body.offerType == 1) {
            var offerType = 0;
        } else {
            var offerType = 1;
        }
        let store_name = req.body["store_name[]"];
        var coupon = {
            categoryId: req.body.parent_cat,
            subcategoryId: req.body.sub_cat,
            userId: req.session.business_user.id,
            storeId: store_name.toString(),
            title: req.body.title,
            description: req.body.description,
            max_users: req.body.max_users,
            items: req.body.items,
            discount: req.body.discount,
            original_price: req.body.original_price,
            final_price: req.body.final_price,
            isSpecial: offerType,
            // templateId: req.body.coupon_template,
            coupon_duration: req.body.coupon_duration,
            status: true
        };
        console.log(coupon)
        console.log("req.file---",req.file);
        if (typeof (req.file) != 'undefined') {
            coupon.image = req.file.filename;
        }
    const toMilliseconds = time => {
        const [hour, minute] = time.split(':');
        return (hour * 60 + parsInt(minute)) * 60 * 1000;
    };

    // start_date = new Date(new Date(req.body.date).getTime() + toMilliseconds(req.body.time));
    //start_date = req.body.date + ' ' + req.body.time;
    start_date = req.body.date;
    end_date = new Date(new Date(start_date).getTime() + req.body.coupon_duration * 60 * 60 * 1000);
    coupon.start_date = start_date;
    coupon.end_date = end_date;
    Coupons.create(coupon).then(result => {
        req.flash('success', 'Coupon added Successfully.');
        return res.redirect('/coupons');

    }).catch(function (err) {
        console.log('111111111111111111111111111111111111111111111111111111')
        console.log('err========>', err);
        return res.redirect('/coupons');
    });
    });
});


router.post('/addCoupon2', FUNC.Auth, function (req, res, next) {
    var imageData =  req.body.newImage;
    var ext =  imageData.split(';')[0].match(/jpeg|png|jpg/)[0];
    console.log("ext>>>>>>>>>>>>>>>>>>>",ext);
    //return false;
    var base64Data = req.body.newImage.replace(/^data:image\/png;base64,/, "");
        base64Data = base64Data.replace(/^data:image\/jpeg;base64,/, "");
        base64Data = base64Data.replace(/^data:image\/jpg;base64,/, "");
    //let filename = `coupons-${Date.now()}.jpg`;
    let filename = `coupons-${Date.now()}.`+ext;
    require("fs").writeFile(`./public/uploads/coupons/${filename}`, base64Data, 'base64', function(err) {
        console.log(err);
        if(err){
            return next(err)
        }
        if (req.body.offerType == 1) {
            var offerType = 0;
        } else {
            var offerType = 1;
        }

        let store_name = req.body["store_name[]"];
        var coupon = {
            categoryId: req.body.parent_cat,
            subcategoryId: req.body.sub_cat,
            userId: req.session.business_user.id,
            storeId: (store_name)?store_name.toString():"",
            title: req.body.title,
            description: req.body.description,
            max_users: req.body.max_users,
            items: req.body.items,
            discount: req.body.discount,
            original_price: req.body.original_price,
            final_price: req.body.final_price,
            isSpecial: offerType,
            // templateId: req.body.coupon_template,
            coupon_duration: req.body.coupon_duration,
            status: true,
            image: filename
        };
        if (typeof (req.file) != 'undefined') {
            console.log("I M HERE WITH IMAGE NAME>>>>>>>>>>>>>>>>>>");
            coupon.image = req.file.filename;
        }
        const toMilliseconds = time => {
            const [hour, minute] = time.split(':');
            return (hour * 60 + parsInt(minute)) * 60 * 1000;
        };

        // start_date = new Date(new Date(req.body.date).getTime() + toMilliseconds(req.body.time));
        //start_date = req.body.date + ' ' + req.body.time;
        start_date = req.body.date;
        console.log('start date   '+start_date)
        end_date = new Date(new Date(start_date).getTime() + req.body.coupon_duration * 60 * 60 * 1000);
        coupon.start_date = start_date;
        coupon.end_date = end_date;

        // IMAGE THUMB

        let inputFile  = "public/uploads/coupons/"+filename;
        let outputFile = "public/uploads/coupons/"+"thumb_"+filename;
        sharp(inputFile).resize({ height: 100, width: 100 }).toFile(outputFile)
        .then(function(newFileInfo) {
            console.log("outputFile>>>>>>>>>>>",outputFile);
            console.log("newFileInfo>>>>>>>>>>>>",newFileInfo);
            console.log("Success");

            Coupons.create(coupon).then(result => {


                // UPLOAD IMAGE ON S3
                    var params = {
                        Bucket: process.env.USER_IMG_BUCKET,
                        Key: "coupons" + "/" +filename,
                        ContentType: "image/jpeg",
                        Body: fs.createReadStream(
                        "public/uploads/coupons/"+filename
                        ),
                        ACL: "public-read"
                    };
                    return res.redirect('/coupons');
                    /*s3.upload(params, (errMessage, responseData) => {
                        if(errMessage){
                            console.log("error Message >>>>>>>>>>>>>>>>", errMessage);
                        } else {
                            console.log("responseData>>>>>>>>>>>>>>",responseData);
                            var thumbParams = {
                                Bucket: process.env.USER_IMG_BUCKET,
                                Key: "coupons" + "/thumb_" +filename,
                                ContentType: "image/jpeg",
                                Body: fs.createReadStream(
                                "public/uploads/coupons/thumb_"+filename
                                ),
                                ACL: "public-read"
                            };
                            s3.upload(thumbParams, (errMessage1, responseData1) => {
                                if(errMessage1){
                                    console.log("error Message1 >>>>>>>>>>>>>>>>", errMessage1);
                                } else {
                                    console.log("responseData1>>>>>>>>>>>>>>",responseData1);
                                     // UPLOAD IMAGE ON S3 END
                                    req.flash('success', ADMIN_MSG.CouponAdded);
                                    return res.redirect('/coupons');
                                }
                            })
                        }
                    })*/
            }).catch(function (err) {
                console.log('err========>', err);
                return res.redirect('/coupons');
            });

        })
        .catch(function(err) {
            console.log("err>>>>>>>>>>>>>>>>",err);
            console.log("Error occured");
        });
        // IMAGE THUMB
        //return false;

    });
});

router.get('/view/:id', FUNC.Auth, function (req, res, next) {
    Coupons.findOne({
        where: { id: req.params.id },
    }).then(couponInfo => {
        var user_id = req.session.business_user.id;
        Business.findOne({
            where: { userId: user_id },
        }).then(businessInfo => {
            var cats = businessInfo.categoryId.split(',');
            Categories.findAll({
                where: { id: cats, status: true, isActive: true },
                raw: true
            }).then(cat => {
                Stores.findAll({
                    where: { status: true, userId: user_id },
                    attributes: ['id', 'userId', 'store_name'],
                    raw: true
                }).then(storeData => {
                    res.render('coupons/view', { title: 'coupons', cat, storeData, couponInfo });
                }).catch(function (err) {
                    console.log('catch', err);
                    return res.redirect('/');
                });
            }).catch(function (err) {
                console.log('catch', err);
                return res.redirect('/');
            });
        });
    }).catch(function (err) {
        req.flash('error', ADMIN_MSG.CommonError);
        return res.redirect('/coupons');
    });
});

router.get('/detail/:id', FUNC.Auth, function (req, res, next) {
    const Sequelize = require('sequelize');
    var user_id = req.session.business_user.id;
    Coupons.findOne({
        where: { id: req.params.id, userId: user_id },
        include: [
            {
                model: Categories,
                attributes: ['id', 'name']
            },
            {
                model: Subcategories,
                attributes: ['id', 'name']
            }
        ],
    }).then(couponInfo => {

        var averageRating = 0;
        var userCount = 0;
        var averageCountRating = 0;
        var couponId = couponInfo.id;
        CouponRating.findOne({
            where: { coupon_id: couponId },
            attributes: [[Sequelize.fn("COUNT", Sequelize.col("id")), "userCount"],[Sequelize.fn("SUM", Sequelize.col("rating")), "userRatingSum"]],
            raw: true
        }).then(coupon_rating =>{
            if(coupon_rating.userCount > 0){
                averageCountRating = numberWithCommas(coupon_rating.userRatingSum/coupon_rating.userCount);
                userCount = coupon_rating.userCount;
                averageRating = Math.round(coupon_rating.userRatingSum/coupon_rating.userCount);
            }
        }).catch(function(err){
            console.log(err);
        });


        // get coupon redeems user---
        var stores = couponInfo.storeId.split(',');
        Stores.findAll({
            where: { id: stores },
            attributes: ['id', 'userId', 'store_name'],
            raw: true
        }).then(storeData => {
            Redeemed.findAll({
                where: {couponId : req.params.id },
                include: [{model: Users, attributes: ['id','fname','lname']},{model: Stores, attributes: ['id','store_name']}],
                order:[['id','DESC']]
            }).then(getRedeemed=>{
                console.log("-----getRedeemed",storeData);
                res.render('coupons/detail', { title: 'coupons', couponInfo, storeData, getRedeemed, averageRating, averageCountRating, userCount });
            }).catch(function(err){
                req.flash('error', ADMIN_MSG.CommonError);
                return res.redirect('/coupons');
            })
        }).catch(function (err) {
            console.log('catch', err);
            return res.redirect('/');
        });



    }).catch(function (err) {
        console.log("-----err",err);
        req.flash('error', ADMIN_MSG.CommonError);
        return res.redirect('/coupons');
    });
});

function numberWithCommas(x) {
    let character = x.toString().charAt(2)
    let parts = x.toString().split(".",2);
    return (character =='')?parts[0]+',0':parts[0]+','+character;
}

router.get('/analytics/:id', FUNC.Auth, function (req, res, next) {
    var user_id = req.session.business_user.id;
    Coupons.findOne({
        where: { id: req.params.id, userId: user_id },
    }).then(couponInfo => {
        // get coupon redeems user---
        sequelize.query("SELECT SUM(IF(users.gender = 'Male',1,0)) as countMale,SUM(IF(users.gender = 'Female',1,0)) as countFemale FROM `redeemeds` INNER JOIN users on users.id = redeemeds.userId WHERE redeemeds.couponId = "+couponInfo.id+" ORDER BY users.gender", { type: sequelize.QueryTypes.SELECT })
        .then(getRedeem => {
            sequelize.query("SELECT SUM(IF(users.gender = 'Male',1,0)) as countMale,SUM(IF(users.gender = 'Female',1,0)) as countFemale FROM `not_interested_coupons` INNER JOIN users on users.id = not_interested_coupons.user_id WHERE not_interested_coupons.couponId = "+couponInfo.id+" ORDER BY users.gender", { type: sequelize.QueryTypes.SELECT })
            .then(getNotIntrested => {
                var countMale = (getRedeem.length && getRedeem[0].countMale)?parseInt(getRedeem[0].countMale):0;
                var countFemale = (getRedeem.length && getRedeem[0].countFemale)?parseInt(getRedeem[0].countFemale):0;
                var countNotIntMale = (getNotIntrested.length && getNotIntrested[0].countMale)?parseInt(getNotIntrested[0].countMale):0;
                var countNotIntFemale = (getNotIntrested.length && getNotIntrested[0].countFemale)?parseInt(getNotIntrested[0].countFemale):0;
                res.render('coupons/analytics', { countMale, countFemale, countNotIntMale, countNotIntFemale, title: 'coupons analytics', couponInfo  });
            }).catch(function (err) {
                console.log('catch', err);
                return res.redirect('/dashboard');
            });
        }).catch(function (err) {
            console.log('catch', err);
            return res.redirect('/dashboard');
        });

    }).catch(function (err) {
        console.log("-----err",err);
        req.flash('error', ADMIN_MSG.CommonError);
        return res.redirect('/coupons');
    });
});

router.post('/updateCoupon/:id', FUNC.Auth, function (req, res, next) {
    upload(req, res, function (err) {
        if (err) {
            if (err.code == 'LIMIT_FILE_SIZE') {
                req.flash('error', 'File size too large.Use maximum 15 MB file.');
            } else {
                req.flash('error', err);

            }
            return res.redirect('/coupons/view/' + req.params.id);
        }

        if (req.body.offerType == 1) {
            var offerType = 0;
        } else {
            var offerType = 1;
        }
        var coupon = {
            categoryId: req.body.parent_cat,
            subcategoryId: req.body.sub_cat,
            userId: req.session.business_user.id,
            storeId: req.body.store_name,
            title: req.body.title,
            description: req.body.description,
            max_users: req.body.max_users,
            items: req.body.items,
            discount: req.body.discount,
            original_price: req.body.original_price,
            final_price: req.body.final_price,
            isSpecial: offerType,
            //templateId: req.body.coupon_template,
            coupon_duration: req.body.coupon_duration,
            status: true
        };
        if (typeof (req.file) != 'undefined') {
            coupon.image = req.file.filename;
        }
        const toMilliseconds = time => {
            const [hour, minute] = time.split(':');
            return (hour * 60 + parsInt(minute)) * 60 * 1000;
        };
        // start_date = new Date(new Date(req.body.date).getTime() + toMilliseconds(req.body.time));
        //start_date = req.body.date + ' ' + req.body.time;
        start_date = req.body.date;
        end_date = new Date(new Date(start_date).getTime() + req.body.coupon_duration * 60 * 60 * 1000);
        coupon.start_date = start_date;
        coupon.end_date = end_date;
        Coupons.update(coupon, {
            where: { id: req.params.id }
        }).then(result => {
            req.flash('success', ADMIN_MSG.CouponAdded);
            res.redirect('/coupons');
        }).catch(function (err) {
            console.log('error========>', err);
            req.flash('error', ADMIN_MSG.CommonError);
            return res.redirect('/coupons');
        });
    });
});

router.get('/delete/:id', FUNC.Auth, function (req, res, next) {
    return res.redirect('/');
    Coupons.update({ status: false }, {
        where: { id: req.params.id }
    }).then(result => {
        req.flash('success', ADMIN_MSG.CouponRemoved);
        res.redirect('/coupons');
    }).catch(function (err) {
        req.flash('error', ADMIN_MSG.CommonError);
        return res.redirect('/');
    });
});

router.post('/status', FUNC.Auth, function (req, res, next) {
    var {
        id,
        status
    } = req.body;

    Coupons.update({ isActive: status }, {
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
            var y = new Array('<option value=""> -- '+res.locals.LANG.Select +' '+ res.locals.LANG.Subcategory+' -- </option>');
            if (subcategories && subcategories.length > 0) {
                subcategories.forEach(function (value, index) {
                    var selected = "";
                    var curVal = "";
                    if (value.id == req.body.cityId) { var selected = "selected" }
                    curVal = value.name;
                    var temp = '<option value="' + value.id + '"' + selected + '>' + curVal + '</option>';
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
    if (formData.storeId != '' && formData.sub_cat != '' && formData.sub_cat_name != '' && formData.title != '' && formData.discount != '' && formData.desc != '' && formData.date != ''  && formData.coupon_duration != '') {
        var user_id = req.session.business_user.id;
            if (formData.img == '') {
                var catImgUrl = process.env.BUSINESS_URL+'uploads/def_cat/'+formData.sub_cat_name+'.jpg';
            } else {
                var catImgUrl = formData.img;
            }
            if (formData.offer == 1) {
                var discountValue = "- "+formData.discount + '%';
            } else {
                var discountValue = 'OFERTA ESPECIAL';
            }
            var storeLogo = '/uploads/business/' + req.session.business_user.user_image;

            //validDate = new Date(formData.date).toLocaleString('en-GB', { hour12: true });
            validDate = moment(formData.date).add(parseInt(formData.coupon_duration), 'h').format('DD-MM-YYYY hh:mm a');

            var y = '<div class="cuponBlock"><div class="row"><div class="col-sm-4 align-content-center"><div class="kuponImg">' +
                '<img src="' + catImgUrl + '" alt="" width="160" height="170" class="img-fluid"></div></div><div class="col-sm-1"><div class="kuponDivider"><div class="halfRound"></div></div></div>' +
                '<div class="col-sm-5"><div class="kuponDetails"><div class="kuponsLogo">' +
                '<img src="/images/kupons-logo.png" alt="" class="img-fluid"> </div>' +
                '<div class="cuponCat">' + formData.title + '</div>' +
                '<div class="kuponDescp">' + formData.desc + '</div>' +
                '<div class="priceSec"><span class="newPice">S/'+ formData.final_price +'</span> <span class="oldPrice">S/'+ formData.original_price +'</span></div>' +
                '<div class="kuponExpire">'+ LANG.ValidUntil +' <br>' + validDate + '</div></div></div>' +
                '<div class="col-sm-2"><div class="clientLogo"><img src="' + storeLogo + '" height="60" weight="60" alt="" class="img-responsive img-fluid img-circle">' +
                '<div class="btn waves-effect pull-right" style="    margin-top: 44px;text-align: center;color: #ff1212;background: #fdfd00!important;font-weight: bold;">' + discountValue + '  </div>' +
                '</div></div></div></div>';

            res.json(JSON.parse(JSON.stringify(y)));

    } else {
        var y = '<div class="alert alert-danger alert-dismissable"> Please fill Complete form to preview coupon</div>';

        res.json(JSON.parse(JSON.stringify(y)));
    }
});

module.exports = router;

