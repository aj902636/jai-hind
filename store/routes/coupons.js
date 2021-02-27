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
var FCM = require('fcm-push');

var fcm = new FCM(process.env.FCM_KEY);
global.FUNC = require('../../functions/storefunctions.js');

var path = require('path');
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
    limits: { fileSize: 150000 }
}).single('foo');

router.get('/', FUNC.Auth, function (req, res, next) {
    var user_id = req.session.store_user.userId;
    var store_id = req.session.store_user.id;
    Coupons.findAll({
        where: { status: true, userId: user_id, storeId: {like:'%'+store_id+'%'}},
        order: [
            ['id', 'DESC']
        ],
        include: [
            {
                model: Categories,
                attributes: ['id', 'name']
            },
            {
                model: Subcategories,
                attributes: ['id', 'name']
            }
        ]
    }).then(results => {
        res.render('coupons/index', { dealInfo: results, title: 'coupons' });
    }).catch(function (err) {
        console.log('catch', err);
        return res.redirect('/dashboard');
    });
});

router.get('/view/:id', FUNC.Auth, function (req, res, next) {
    var store_id = req.session.store_user.id;
    Coupons.findOne({
        where: { id:req.params.id,storeId : store_id},
    }).then(couponInfo => {
        var user_id = req.session.store_user.userId;
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
        req.flash('error', 'Something went wrong.');
        return res.redirect('/coupons');
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
    if (formData.storeId != '' && formData.sub_cat != '' && formData.title != '' && formData.discount != '' && formData.desc != '' && formData.date != '') {
        var user_id = req.session.store_user.userId;
        Stores.findOne({
            where: { id: formData.storeId },
            attributes: ['id', 'userId', 'store_name'],
            include: [
                {
                    model: Users,
                    where: { id: user_id },
                    attributes: ['id', 'fname', 'lname', 'user_image'],
                    required: false
                }
            ]
        }).then(couponInfo => {
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
            var storeLogo = '/uploads/business/' + couponInfo.user.user_image;

            //validDate = new Date(formData.date).toLocaleString('en-GB', { hour12: true });
            validDate = moment(formData.date).format('lll');

            var y = '<div class="cuponBlock"><div class="row"><div class="col-sm-4 align-content-center"><div class="kuponImg">' +
                '<img src="' + catImgUrl + '" alt="" width="160" height="170" class="img-fluid"></div></div><div class="col-sm-1"><div class="kuponDivider"><div class="halfRound"></div></div></div>' +
                '<div class="col-sm-5"><div class="kuponDetails"><div class="kuponsLogo">' +
                '<img src="/images/kupons-logo.png" alt="" class="img-fluid"> </div>' +
                '<div class="cuponCat">' + formData.title + '</div>' +
                '<div class="kuponDescp">' + formData.desc + '</div>' +
                '<div class="kuponExpire">Valid until <br>' + validDate + '</div></div></div>' +
                '<div class="col-sm-2"><div class="clientLogo"><img src="' + storeLogo + '" height="60" weight="60" alt="" class="img-fluid img-circle">' +
                '<div class="btn waves-effect pull-right" style="margin-top: 80px;border-radius: 50%;text-align: center;">' + discountValue + '  </div>' +
                '</div></div></div></div>';

            res.json(JSON.parse(JSON.stringify(y)));

        });
    } else {
        var y = '<div class="alert alert-danger alert-dismissable"> Please fill Complete form to preview coupon</div>';

        res.json(JSON.parse(JSON.stringify(y)));
    }
});

router.get('/detail/:id', FUNC.Auth, function (req, res, next) {
    Coupons.findOne({
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
        res.render('coupons/detail', { title: 'coupons', couponInfo });
    }).catch(function (err) {
        console.log(" req.params.id======>", err);
        req.flash('error', 'Something went wrong.');
        return res.redirect('/coupons');
    });
});
module.exports = router;

