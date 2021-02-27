var express = require('express');
app = express();
var router = express.Router();
global.Models = require('../../models');
var Coupons = Models.Coupons;
var Users = Models.User;
var Stores = Models.Stores;
var fs = require("fs");
var Business = Models.Business;
const sharp = require('sharp');
const async = require('async');
var Categories = Models.Categories;
var Subcategories = Models.Subcategories;
global.FUNC = require('../../functions/functions.js');
//const AWS = require("aws-sdk");
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


router.get('/', FUNC.Auth, function (req, res, next) {
    var query = 'SELECT users.id,fname,lname,COUNT(coupons.id) as coupon_count,businesses.business_name  FROM `users` INNER JOIN `coupons` ON `coupons`.`userId` = `users`.`id` INNER JOIN `businesses` ON `businesses`.`userId` = `users`.`id` WHERE `user_type` = 2 AND coupons.created_by = "business"  AND users.status = true AND users.nif_number >0 GROUP by coupons.userId';
    sequelize.query(query,
        { type: sequelize.QueryTypes.SELECT })
        .then(results => {
            console.log("results=========>", results);
            res.render('coupons/index', { userInfo: results, title: 'coupons' });
        }).catch(function (err) {
            console.log(err);
            req.flash('error', 'Something went wrong.');
            return res.redirect('/dashboard');
        });
});

router.get('/view/:id', FUNC.Auth, function (req, res, next) {
    Coupons.findAll({
        where: { status: true, userId: req.params.id,created_by: 'business'},
        include: [
            {
                model: Categories,
                attributes: ['id', 'name', 'icon'],
            },
            {
                model: Subcategories,
                attributes: ['id', 'name']
            },
        ],
        order: [['createdAt', 'DESC']]
    }).then(async results => {
        const promises = results.map(async function (element, index) {
            let storeIds = element.storeId.split(",");
            var store = await Stores.findAll({ where: { id: { $in: JSON.parse("[" + storeIds + "]") } }, attributes: ['id', 'store_name'], raw: true });
            results[index]['stores'] = store;
        }, this);
        await Promise.all(promises);
        res.render('coupons/view', { dealInfo: results, title: 'coupons' });
    }).catch(function (err) {
        console.log('catch', err);
        return res.redirect('/dashboard');
    });
});

router.get('/admin_coupons', FUNC.Auth, function (req, res, next) {
    Coupons.findAll({
        where: { status: true, created_by: 'admin' },
        include: [
            {
                model: Categories,
                attributes: ['id', 'name', 'icon'],
            },
            {
                model: Subcategories,
                attributes: ['id', 'name']
            },

        ],
        order: [['createdAt', 'ASC']]
    }).then(async results => {
        //console.log("results=======================",results)
        const promises = results.map(async function (element, index) {
            //console.log("value.user",element.user.fname)
            let storeIds = element.storeId.split(",");
            var store = await Stores.findAll({ where: { id: { $in: JSON.parse("[" + storeIds + "]") } }, attributes: ['id', 'store_name'], raw: true });
            var business = await Business.findOne({ where: { userId: element.userId }, attributes: ['userId', 'business_name'], raw: true });
            console.log("business=====================================",business)
            console.log("coupon=====================================",element.id)
            results[index]['stores'] = store;
            if(business){
                results[index]['business_user'] = business.business_name;
            }else{
                results[index]['business_user'] = "";
            }


        }, this);
        await Promise.all(promises);
        res.render('coupons/admin_coupon_list', { dealInfo: results, title: 'admin_coupons' });
    }).catch(function (err) {
        console.log('catch', err);
        return res.redirect('/dashboard');
    });
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
            },
            // {
            //     model: Stores,
            //     attributes: ['id', 'store_name']
            // }
        ]
    }).then(couponInfo => {
        var stores = couponInfo.storeId.split(',');
        Stores.findAll({
            where: { id: stores },
            attributes: ['id', 'userId', 'store_name'],
            raw: true
        }).then(storeData => {
            res.render('coupons/detail', { title: 'coupons', couponInfo, storeData });
        }).catch(function (err) {
            console.log(" req.params.id======>", err);
            req.flash('error', 'Something went wrong.');
            return res.redirect('/coupons');
        });
    }).catch(function (err) {
        console.log(" req.params.id======>", err);
        req.flash('error', 'Something went wrong.');
        return res.redirect('/coupons');
    });
});

router.get('/admin_coupon_details/:id', FUNC.Auth, function (req, res, next) {
    Coupons.findOne({
        where: { id: req.params.id, created_by: 'admin' },
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
            },
            // {
            //     model: Stores,
            //     attributes: ['id', 'store_name']
            // }
        ]
    }).then(couponInfo => {
        var stores = couponInfo.storeId.split(',');
        Stores.findAll({
            where: { id: stores },
            attributes: ['id', 'userId', 'store_name'],
            raw: true
        }).then(storeData => {
            res.render('coupons/admin_coupon_details', { title: 'coupons', couponInfo, storeData });
        }).catch(function (err) {
            console.log(" req.params.id======>", err);
            req.flash('error', 'Something went wrong.');
            return res.redirect('/coupons/admin_coupons');
        });
    }).catch(function (err) {
        console.log(" req.params.id======>", err);
        req.flash('error', 'Something went wrong.');
        return res.redirect('/coupons/admin_coupons');
    });
});

router.post('/block', FUNC.Auth, function (req, res, next) {
    var {
        id,
        uid,
        description
    } = req.body;

    Users.findOne({
        where: { id: uid },
        attributes: ['id', 'email', 'fname', 'lname']
    }).then(userInfo => {

        var template = new EmailTemplate(path.join(__dirname, '../../templates/', 'customer_block_coupon'));
        nodemailer.createTestAccount((err, account) => {
            let transporter = nodemailer.createTransport(
                {
                    host: process.env.SMTP_HOST,
                    port: process.env.SMTP_PORT,
                    secure: false, // true for 465, false for other ports
                    auth: {
                        user: process.env.SMTP_USER, // generated ethereal user
                        pass: process.env.SMTP_PASS  // generated ethereal password
                    },
                    tls: { rejectUnauthorized: false },
                    debug: true
                });

            // setup email data with unicode symbols

            var uname = userInfo.fname + ' ' + userInfo.lname;
            var coupon_link = process.env.ADMIN_URL + 'coupons/detail/' + id;
            var email_data = { user_name: uname, type: 'coupon',business_url:process.env.BUSINESS_URL,current_year:moment().format('YYYY'), description: description, coupon_link: coupon_link };
            var locals = {
                custom: email_data
            };
            template.render(locals, function (err, results) {
                if (err) {
                    if (err) return next(err);
                } else {

                    let mailOptions = {
                        from: process.env.FROM_MAIL,
                        to: userInfo.email,
                        subject: 'Kupon Coupon Blocked',
                        text: results.text,
                        html: results.html // html bodynewpass
                    };
                    // send mail with defined transport objenewpassct
                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            return console.log(error);
                        }
                        console.log('Message sent: %s', info.messageId);
                    });
                }
            });
        });

        Coupons.update({ blockAdmin: true }, {
            where: { id: id }
        }).then(result => {
            req.flash('success', 'Coupon Blocked successfully');
            res.redirect(req.header('Referer'));
        }).catch(function (err) {
            req.flash('error', 'Something went wrong.');
            return res.redirect('/');
        });
    }).catch(function (err) {
        console.log(err);
        return res.redirect(req.header('Referer'));
    });

});

router.get('/unblock/:id', FUNC.Auth, function (req, res, next) {
    Coupons.update({ blockAdmin: false }, {
        where: { id: req.params.id }
    }).then(result => {
        req.flash('success', 'Coupon Unblocked successfully');
        res.redirect(req.header('Referer'));
    }).catch(function (err) {
        req.flash('error', 'Something went wrong.');
        return res.redirect('/');
    });
});



router.get('/delete/:id', FUNC.Auth, function (req, res, next) {
    Coupons.update({ blockAdmin: false,status:false }, {
        where: { id: req.params.id }
    }).then(result => {
        req.flash('success', 'Coupon Deleted successfully');
        res.redirect(req.header('Referer'));
    }).catch(function (err) {
        req.flash('error', 'Something went wrong.');
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


router.get('/add', FUNC.Auth, function (req, res, next) {
    var user = req.session.user;
    console.log("user_id=================", user);

    /*
    SELECT businesses.business_name, count(stores.id) as store_count FROM `businesses` inner join users on businesses.userId = users.id inner join stores on businesses.userId = stores.userId where users.status = 1 Group By businesses.id
    */
   sequelize.query("SELECT users.email,businesses.business_name, count(stores.id) as store_count ,businesses.userId FROM `businesses` inner join users on businesses.userId = users.id inner join stores on businesses.userId = stores.userId where users.status = 1 AND users.isActive=1 Group By businesses.id",{raw: true})
   .spread(business => {

   console.log("business====================== ",business);

        res.render('coupons/add', { title: 'coupons_pdmin', business });

    }).catch(function (err) {
        console.log('catch', err);
        return res.redirect('/');
    });



})


router.post('/get_coupon_priview', function (req, res, next) {
    console.log("req.session", req.session.user)
    var formData = req.body;
    if (formData.storeId != '' && formData.title != '' && formData.discount != '' && formData.desc != '' && formData.date != '' && formData.coupon_duration != '') {
        var user_id = req.session.user.id;
        if (formData.img == '') {
            var catImgUrl = process.env.BUSINESS_URL + 'uploads/def_cat/' + formData.sub_cat_name + '.jpg';
        } else {
            var catImgUrl = formData.img;
        }
        if (formData.offer == 1) {
            var discountValue = "- " + formData.discount + '%';
        } else {
            var discountValue = 'Special Offer';
        }
        var storeLogo = '/uploads/business/' + req.session.user.user_image;
        //var storeLogo = "";
        //validDate = new Date(formData.date).toLocaleString('en-GB', { hour12: true });
        validDate = moment(formData.date).add(parseInt(formData.coupon_duration), 'h').format('lll');

        var y = '<div class="cuponBlock"><div class="row"><div class="col-sm-4 align-content-center"><div class="kuponImg">' +
            '<img src="' + catImgUrl + '" alt="" width="160" height="170" class="img-fluid"></div></div><div class="col-sm-1"><div class="kuponDivider"><div class="halfRound"></div></div></div>' +
            '<div class="col-sm-5"><div class="kuponDetails"><div class="kuponsLogo">' +
            '<img src="/images/kupons-logo.png" alt="" class="img-fluid"> </div>' +
            '<div class="cuponCat">' + formData.title + '</div>' +
            '<div class="kuponDescp">' + formData.desc + '</div>' +
            '<div class="kuponExpire">Valid <br>' + validDate + '</div></div></div>' +
            '<div class="col-sm-2"><div class="clientLogo"><img src="' + storeLogo + '" height="60" weight="60" alt="" class="img-responsive img-fluid img-circle">' +
            '<div class="btn waves-effect pull-right" style="margin-top: 80px;text-align: center;color: #fff512">' + discountValue + '  </div>' +
            '</div></div></div></div>';

        res.json(JSON.parse(JSON.stringify(y)));

    } else {
        var y = '<div class="alert alert-danger alert-dismissable"> Please fill Complete form to preview coupon</div>';

        res.json(JSON.parse(JSON.stringify(y)));
    }
});


router.post('/get_subcat', function (req, res, next) {
    console.log("req-----------", req.body)
    sequelize.query("SELECT * FROM `subcategories` WHERE `status`=1 AND `isActive`=1 AND `categoryId`=:id", { replacements: { id: req.body.id } },
        { type: sequelize.QueryTypes.SELECT })
        .spread(subcategories => {
            var y = new Array('<option value=""> -- Select Subcategory -- </option>');
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
            console.log("err==================================1123=", err)
            req.flash('error', 'Something went wrong.');
            return res.redirect('/deals');
        });
});



router.post('/get_stores', function (req, res, next) {
    console.log("req-----------", req.body)

    Stores.findAll({
        where: {
            status: true,
            userId:req.body.id
         },


    }).then(async stores => {
            console.log("sores=>>>>>>>>>>>>>>>>>>>>>>>>>", stores)
            var y = new Array('<option value=""> -- Select Store -- </option>');
            if (stores && stores.length > 0) {
                stores.forEach(function (value, index) {
                    console.log("inloop")
                    var selected = "";
                    var curVal = "";

                    curVal = value.store_name;
                    var temp = '<option value="' + value.id + '"' + selected + '>' + curVal + '</option>';
                    y.push(temp);
                });
                console.log("options===", y)
                res.json(JSON.parse(JSON.stringify(y)));
            } else {
                res.json(JSON.parse(JSON.stringify(y)));
            }
        }).catch(function (err) {
            console.log("err==================================1123=", err)

        });
});

router.post('/addCoupon2', FUNC.Auth, function (req, res, next) {
    var imageData = req.body.newImage;
    var ext = imageData.split(';')[0].match(/jpeg|png|jpg/)[0];
    console.log("ext>>>>>>>>>>>>>>>>>>>", ext);
    //return false;
    var base64Data = req.body.newImage.replace(/^data:image\/png;base64,/, "");
    base64Data = base64Data.replace(/^data:image\/jpeg;base64,/, "");
    base64Data = base64Data.replace(/^data:image\/jpg;base64,/, "");
    //let filename = `coupons-${Date.now()}.jpg`;
    let filename = `coupons-${Date.now()}.` + ext;
    require("fs").writeFile(`./public/uploads/coupons/${filename}`, base64Data, 'base64', function (err) {
        console.log(err);
        if (err) {
            return next(err)
        }
        if (req.body.offerType == 1) {
            var offerType = 0;
        } else {
            var offerType = 1;
        }

        let store_name = req.body["store_name[]"];
        var coupon = {
            categoryId: 10001,
            subcategoryId: 20001,
            userId: req.body.business,
            storeId: store_name.toString(),
            title: req.body.title,
            description: req.body.description,
            max_users: req.body.max_users,
            items: req.body.items,
            discount: req.body.discount,
            original_price: req.body.original_price,
            final_price: req.body.final_price,
            isSpecial: offerType,
            automated: 1,
            created_by: "admin",
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
        end_date = new Date(new Date(start_date).getTime() + req.body.coupon_duration * 60 * 60 * 1000);
        coupon.start_date = start_date;
        coupon.end_date = end_date;

        // IMAGE THUMB

        let inputFile = "public/uploads/coupons/" + filename;
        let outputFile = "public/uploads/coupons/" + "thumb_" + filename;
        sharp(inputFile).resize({ height: 100, width: 100 }).toFile(outputFile)
            .then(function (newFileInfo) {
                console.log("outputFile>>>>>>>>>>>", outputFile);
                console.log("newFileInfo>>>>>>>>>>>>", newFileInfo);
                console.log("Success");

                Coupons.create(coupon).then(result => {


                    // UPLOAD IMAGE ON S3
                    var params = {
                        Bucket: process.env.USER_IMG_BUCKET,
                        Key: "coupons" + "/" + filename,
                        ContentType: "image/jpeg",
                        Body: fs.createReadStream(
                            "public/uploads/coupons/" + filename
                        ),
                        ACL: "public-read"
                    };
                    s3.upload(params, (errMessage, responseData) => {
                        if (errMessage) {
                            console.log("error Message >>>>>>>>>>>>>>>>", errMessage);
                        } else {
                            console.log("responseData>>>>>>>>>>>>>>", responseData);
                            var thumbParams = {
                                Bucket: process.env.USER_IMG_BUCKET,
                                Key: "coupons" + "/thumb_" + filename,
                                ContentType: "image/jpeg",
                                Body: fs.createReadStream(
                                    "public/uploads/coupons/thumb_" + filename
                                ),
                                ACL: "public-read"
                            };
                            s3.upload(thumbParams, (errMessage1, responseData1) => {
                                if (errMessage1) {
                                    console.log("error Message1 >>>>>>>>>>>>>>>>", errMessage1);
                                } else {
                                    console.log("responseData1>>>>>>>>>>>>>>", responseData1);
                                    // UPLOAD IMAGE ON S3 END
                                    req.flash('success', "Coupon added successfully");
                                    return res.redirect('/coupons/admin_coupons');
                                }
                            })
                        }
                    })
                }).catch(function (err) {
                    console.log('err========>', err);
                    return res.redirect('/coupons/admin_coupons');
                });

            })
            .catch(function (err) {
                console.log("err>>>>>>>>>>>>>>>>", err);
                console.log("Error occured");
            });
        // IMAGE THUMB
        //return false;

    });
});



module.exports = router;

