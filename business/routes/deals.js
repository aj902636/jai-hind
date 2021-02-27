var express = require('express');
app = express();
var router = express.Router();

global.Models = require('../../models');
var Deals = Models.Deals;
var Categories = Models.Categories;
var Business = Models.Business;
var Subcategories = Models.Subcategories;
var Subscriptions = Models.Subscription;
var Users = Models.User;
//const AWS = require("aws-sdk");
var fs = require("fs");
const sharp = require('sharp');
const async = require('async');
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


var path = require('path');
var multer = require('multer');
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
    limits: { fileSize: 15728640 }
}).single('foo');

router.get('/', FUNC.Auth, function (req, res, next) {
    var user_id = req.session.business_user.id;
     var whrCond = { userId: user_id };
    var status = true;
    if(typeof req.query.status != "undefined" && req.query.status != '' && req.query.status == 'inactive'){
        whrCond = Object.assign( { end_date: {$lte: Date.now()} } ,  whrCond );
        status = false;
    }else{
        whrCond = Object.assign( {end_date: {$gte: Date.now()} } ,  whrCond );
    }
    Deals.findAll({
        where: whrCond,
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
        order:[['id','DESC']]
    }).then(results => {
        console.log('results=======',results);
        res.render('deals/index', { dealInfo: results, title: 'deals', status });
    }).catch(function (err) {
        console.log('catch', err);
        return res.redirect('/');
    });
});

router.get('/add', FUNC.Auth,FUNC.hasSubscription, function (req, res, next) {
    var user_id = req.session.business_user.id;
    Subscriptions.findOne( { where : {userId: user_id }}).then(checkSubscription=> {
        var cureent_date = moment().format("YYYY-MM-DD");
        var isafter = moment(checkSubscription.subscription_expire_date).isAfter(cureent_date);
        //var isafter = 1;
        if(isafter){
            var cureent_date_time = moment().format("YYYY-MM-DD HH:mm");
            Business.findOne({
                where: { userId: user_id },
            }).then(businessInfo => {
                var cats = businessInfo.categoryId.split(',');
                Categories.findAll({
                    where: { id: cats, status: true, isActive: true },
                    raw: true
                }).then(cat => {
                    sequelize.query("SELECT sub.subscription_type, subs.category_id,subs.store_id FROM subscriptions as sub LEFT JOIN subscriptions_status as subs ON subs.userId = sub.userId where sub.userId = "+user_id+" ORDER BY subs.userId DESC LIMIT 1", { type: sequelize.QueryTypes.SELECT })
                        .then(subscription => {
                            let storeId = [];
                            let categoryIds = [];
                            if(subscription[0].store_id != null){
                                storeId = subscription[0].store_id.split(',') ;
                                categoryIds = subscription[0].category_id.split(',') ;
                            }
                            storeId = storeId.map(Number)
                            categoryIds = categoryIds.map(Number)
                            res.render('deals/add', { title: 'deals', cat,cureent_date_time:cureent_date_time,subscription : subscription[0],storeId:storeId,categoryIds:categoryIds });
                        }).catch(function(err){
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
    }).catch(function(err){
        console.log('catch', err);
        return res.redirect('/');
    });
});

router.post('/addDeal2', FUNC.Auth, function (req, res, next) {
        var imageData =  req.body.newImage;
        var ext =  imageData.split(';')[0].match(/jpeg|png|jpg/)[0];
        console.log("ext>>>>>>>>>>>>>>>>>>>",ext);
        var base64Data = req.body.newImage.replace(/^data:image\/png;base64,/, "");
        base64Data = base64Data.replace(/^data:image\/jpeg;base64,/, "");
        base64Data = base64Data.replace(/^data:image\/jpg;base64,/, "");

        //let filename = `deals-${Date.now()}.jpg`;
        let filename = `deals-${Date.now()}.`+ext;
        require("fs").writeFile(`./public/uploads/deals/${filename}`, base64Data, 'base64', function(err) {
            console.log(err);
            if(err){
                return next(err)
            }
            if (req.body.offerType == 1) {
                var offerType = 0;
            } else {
                var offerType = 1;
            }

            var deal = {
                categoryId: req.body.parent_cat,
                subcategoryId: req.body.sub_cat,
                userId: req.session.business_user.id,
                title: req.body.title,
                description: req.body.description,
                discount: req.body.discount,
                original_price: req.body.original_price,
                final_price: req.body.final_price,
                isSpecial: offerType,
                status: true,
                image: filename
            };

            const toMilliseconds = time => {
                const [hour, minute] = time.split(':');
                return (hour * 60 + parsInt(minute)) * 60 * 1000;
            };

            // start_date = new Date(new Date(req.body.date).getTime() + toMilliseconds(req.body.time));
            start_date = req.body.date;
            //end_date = new Date(new Date(start_date).getTime() + 60 * 60 * 24 * 1000);
            end_date = new Date(new Date(start_date).setHours(23, 59, 59, 999));
            deal.start_date = start_date;
            deal.end_date = end_date;

            let inputFile  = "public/uploads/deals/"+filename;
            let outputFile = "public/uploads/deals/"+"thumb_"+filename;
            sharp(inputFile).resize({ height: 100, width: 100 }).toFile(outputFile)
        .then(function(newFileInfo) {
            console.log("outputFile>>>>>>>>>>>",outputFile);
            console.log("newFileInfo>>>>>>>>>>>>",newFileInfo);
            console.log("Success");
                Deals.create(deal).then(result => {
                    var params = {
                        Bucket: process.env.USER_IMG_BUCKET,
                        Key: "deals" + "/" +filename,
                        ContentType: "image/jpeg",
                        Body: fs.createReadStream(
                        "public/uploads/deals/"+filename
                        ),
                        ACL: "public-read"
                    };
                    s3.upload(params, (errMessage, responseData) => {
                        if(errMessage){
                            console.log("error Message >>>>>>>>>>>>>>>>", errMessage);
                        } else {
                            console.log("responseData>>>>>>>>>>>>>>",responseData);
                            var thumbParams = {
                                Bucket: process.env.USER_IMG_BUCKET,
                                Key: "deals" + "/thumb_" +filename,
                                ContentType: "image/jpeg",
                                Body: fs.createReadStream(
                                "public/uploads/deals/thumb_"+filename
                                ),
                                ACL: "public-read"
                            };
                            s3.upload(thumbParams, (errMessage1, responseData1) => {
                                if(errMessage1){
                                    console.log("error Message1 >>>>>>>>>>>>>>>>", errMessage1);
                                } else {
                                    console.log("responseData1>>>>>>>>>>>>>>",responseData1);
                                     // UPLOAD IMAGE ON S3 END
                                     console.log(result.get({ plain: true }));
                                     req.flash('success', ADMIN_MSG.DealAdded);
                                     return res.redirect('/deals');
                                }
                            })
                        }
                    })
                }).catch(function (err) {
                    console.log('err========>', err);
                    return res.redirect('/deals');
                });
            }).catch(function(err) {
                console.log("err>>>>>>>>>>>>>>>>",err);
                console.log("Error occured");
                //return res.redirect('/deals');
            });
        });
});

router.post('/addDeal', FUNC.Auth, function (req, res, next) {

    upload(req, res, function (err) {
        if (err) {
            if (err.code == 'LIMIT_FILE_SIZE') {
                req.flash('error', 'File size too large.Use maximum 15 MB file.');
            } else {
                req.flash('error', err);

            }
            return res.redirect('/deals/add/');
        }
        if (req.body.offerType == 1) {
            var offerType = 0;
        } else {
            var offerType = 1;
        }
        console.log("req.body",req.body)
        var deal = {
            categoryId: req.body.parent_cat,
            subcategoryId: req.body.sub_cat,
            userId: req.session.business_user.id,
            title: req.body.title,
            description: req.body.description,
            discount: req.body.discount,
            original_price: req.body.original_price,
            final_price: req.body.final_price,
            isSpecial: offerType,
            status: true
        };

        if (typeof (req.file) != 'undefined') {
            deal.image = req.file.filename;
        }

        const toMilliseconds = time => {
            const [hour, minute] = time.split(':');
            return (hour * 60 + parsInt(minute)) * 60 * 1000;
        };

        // start_date = new Date(new Date(req.body.date).getTime() + toMilliseconds(req.body.time));
        start_date = req.body.date;
        //end_date = new Date(new Date(start_date).getTime() + 60 * 60 * 24 * 1000);
        end_date = new Date(new Date(start_date).setHours(23, 59, 59, 999));
        deal.start_date = start_date;
        deal.end_date = end_date;
        Deals.create(deal).then(result => {
            console.log(result.get({ plain: true }));
            req.flash('success', ADMIN_MSG.DealAdded);
            return res.redirect('/deals');
        }).catch(function (err) {
            console.log('err========>', err);
            return res.redirect('/deals');
        });
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
        req.flash('error', ADMIN_MSG.CommonError);
        return res.redirect('/deals');
    });
});

router.get('/detail/:id', FUNC.Auth, function (req, res, next) {
    Deals.findOne({
        where: { id: req.params.id },
        include: [
            {
                model: Users,
                attributes: ['id', 'fname', 'user_image'],
            },
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
        res.render('deals/detail', { title: 'deals', couponInfo, deatStaticText });
    }).catch(function (err) {
        console.log(" req.params.id======>", err);
        req.flash('error', ADMIN_MSG.CommonError);
        return res.redirect('/deals');
    });
});

router.post('/updateDeal/:id', FUNC.Auth, function (req, res, next) {
    upload(req, res, function (err) {
        if (err) {
            if (err.code == 'LIMIT_FILE_SIZE') {
                req.flash('error', 'File size too large.Use maximum 15 MB file.');
            } else {
                req.flash('error', err);

            }
            return res.redirect('/deals/view/' + req.params.id);
        }
        if (req.body.offerType == 1) {
            var offerType = 0;
        } else {
            var offerType = 1;
        }
        var deal = {
            categoryId: req.body.parent_cat,
            subcategoryId: req.body.sub_cat,
            title: req.body.title,
            description: req.body.description,
            discount: req.body.discount,
            original_price: req.body.original_price,
            final_price: req.body.final_price,
            isSpecial: offerType
        };

        if (typeof (req.file) != 'undefined') {
            deal.image = req.file.filename;
        }

        const toMilliseconds = time => {
            const [hour, minute] = time.split(':');
            return (hour * 60 + minute) * 60 * 10;
        };

        //start_date = new Date(new Date(req.body.date).getTime() + toMilliseconds(req.body.time))
        start_date = req.body.date;
        end_date = new Date(new Date(start_date).setHours(23, 59, 59, 999));
        deal.start_date = start_date;
        deal.end_date = end_date;

        //console.log(deal); return;
        Deals.update(deal, {
            where: { id: req.params.id }
        }).then(result => {
            req.flash('success', ADMIN_MSG.DealUpdated);
            res.redirect('/deals');
        }).catch(function (err) {
            console.log('error========>', err);
            req.flash('error', ADMIN_MSG.CommonError);
            return res.redirect('/deals');
        });

    });
});

router.get('/delete/:id', FUNC.Auth, function (req, res, next) {
    Deals.update({ status: false }, {
        where: { id: req.params.id }
    }).then(result => {
        req.flash('success', ADMIN_MSG.DealRemoved);
        res.redirect('/deals');
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
            req.flash('error', ADMIN_MSG.CommonError);
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
                var catImgUrl = process.env.BUSINESS_URL+'uploads/def_cat/'+formData.sub_cat_name+'.jpg';
            } else {
                var catImgUrl = formData.img;
            }
            if (formData.offer == 1) {
                var discountValue = "- "+formData.discount + '%';
            } else {
                var discountValue = 'Special Offer';
            }
            var storeLogo = '/uploads/business/' + userInfo.user_image;

            //validDate = new Date(formData.date).toLocaleString('en-GB', { hour12: true });
            validDate = moment(formData.date).format('LT');

            var y = '<div class="cuponBlock deails"><div class="row"><div class="col-sm-4 col-md-3 align-content-center"><div class="kuponImg">' +
                '<img src="' + catImgUrl + '" alt="" width="160" height="170" class="img-responsive"></div><div class="green_text">'+deatStaticText+
                '</div></div><div class="col-sm-8 col-md-9"><div class="kuponDetails">' +
                '<div class="cuponCat">' + formData.title + '<img src="' + storeLogo +'"  alt="" class="img-circle img-responsive" ></div>' +
                '<div class="kuponDescp">' + formData.desc + '</div>' +
                '<div class="priceSec"><span class="newPice">S/'+ formData.final_price +'</span> <span class="oldPrice">S/'+ formData.original_price +'</span>'+
                '<span class="btn waves-effect dealDisc" style="text-align: center;border: 1px solid #000;color: #d81a38;margin-left: 60px;border-radius: 100%;height: 27px;font-size: 13px;padding: 3px 25px;background: #fff512;font-weight: bold;">' + discountValue + '</span></div>' +
                '<div class="kuponExpire m-t-20 m-b-10">'+LANG.VALID_UNIT +' '+ validDate + '</div></div></div>' +
                '</div></div>';

            res.json(JSON.parse(JSON.stringify(y)));

        });
    } else {
        var y = '<div class="alert alert-danger alert-dismissable"> Please fill Complete form to preview deal</div>';
        res.json(JSON.parse(JSON.stringify(y)));
    }
});


module.exports = router;

