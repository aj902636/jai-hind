var express = require('express');
app = express();
var router = express.Router();
global.Models = require('../../models');
var Deals = Models.Deals;
var Categories = Models.Categories;
var Business = Models.Business;
var Subcategories = Models.Subcategories;
var Users = Models.User;
global.FUNC = require('../../functions/storefunctions.js');


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
    limits: { fileSize: 150000 }
}).single('foo');

router.get('/', FUNC.Auth, function (req, res, next) {
    var user_id = req.session.store_user.userId;
    Deals.findAll({
        where: { status: true, userId: user_id },
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
        console.log('results=======', JSON.stringify(results));
        res.render('deals/index', { dealInfo: results, title: 'deals' });
    }).catch(function (err) {
        console.log('catch', err);
        return res.redirect('/');
    });
});

/*router.get('/add', FUNC.Auth, function (req, res, next) {
    var user_id = req.session.store_user.userId;
    Business.findOne({
        where: { userId: user_id },
    }).then(businessInfo => {
        var cats = businessInfo.categoryId.split(',');
        Categories.findAll({
            where: { id: cats, status: true, isActive: true },
            raw: true
        }).then(cat => {
            res.render('deals/add', { title: 'deals', cat });
        }).catch(function (err) {
            console.log('catch', err);
            return res.redirect('/');
        });
    });
});*/

/*router.post('/addDeal', FUNC.Auth, function (req, res, next) {
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
            req.flash('success', 'Deal added Successfully.');
            return res.redirect('/deals');
        }).catch(function (err) {
            console.log('err========>', err);
            return res.redirect('/deals');
        });
    });
});*/

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
                model: Users,
                attributes: ['id', 'fname', 'user_image'],
            },
            {
                model: Categories,
                attributes: ['id', 'name', 'icon'],
            },
            {
                model: Subcategories,
                attributes: ['id', 'name' ]
            }
        ]
    }).then(couponInfo => {
        console.log("---------------------couponInfo",couponInfo);
        res.render('deals/detail', { title: 'deals', couponInfo, deatStaticText });
    }).catch(function (err) {
        console.log(" req.params.id======>", err);
        req.flash('error', 'Something went wrong.');
        return res.redirect('/deals');
    });
});

/*router.post('/updateDeal/:id', FUNC.Auth, function (req, res, next) {
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
            req.flash('success', 'Deal updated successfully');
            res.redirect('/deals');
        }).catch(function (err) {
            console.log('error========>', err);
            req.flash('error', 'Something went wrong.');
            return res.redirect('/deals');
        });

    });
});*/

/*router.get('/delete/:id', FUNC.Auth, function (req, res, next) {
    Deals.update({ status: false }, {
        where: { id: req.params.id }
    }).then(result => {
        req.flash('success', 'Deal removed successfully');
        res.redirect('/deals');
    }).catch(function (err) {
        req.flash('error', 'Something went wrong.');
        return res.redirect('/');
    });
});*/

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

