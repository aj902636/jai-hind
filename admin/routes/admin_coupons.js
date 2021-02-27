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
const CouponRating = Models.couponRating;
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
    Coupons.findAll({
        where: { created_by: 'admin',status:true,blockAdmin:false },
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
        results1 = new Array();
        const promises = results.map(async function (element, index) {
            console.log("value.user",element)
            let storeIds = element.storeId.split(",");
            var store = await Stores.findAll({ where: { id: { $in: JSON.parse("[" + storeIds + "]") } }, attributes: ['id', 'store_name'], raw: true });
            var business = await Business.findOne({ where: { userId: element.userId }, attributes: ['userId', 'business_name'], raw: true });
            var user = await Users.findOne({ where: { id: element.userId,status:true }, attributes: ['id', 'status'], raw: true });
           // console.log("business=====================================",business)
            //console.log("coupon=====================================",element.id)

            if(user){
               // results1.push(element);
               element['stores'] = store;
                if(business){
                    element['business_user'] = business.business_name;
                }else{
                    element['business_user'] = "";
                }
                results1.push(element);
            }
        }, this);
        await Promise.all(promises);
        results = results1;
        results.sort(function(a, b) {
            return b.id - a.id;
        });
        //console.log("results1results1results1",results1)
        res.render('admin_coupons/admin_coupon_list', { dealInfo: results, title: 'admin_coupons' });
    }).catch(function (err) {
        console.log('catch', err);
        return res.redirect('/dashboard');
    });
});



router.get('/details/:id', FUNC.Auth, function (req, res, next) {
    const Sequelize = require('sequelize');
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

        var stores = couponInfo.storeId.split(',');
        Stores.findAll({
            where: { id: stores },
            attributes: ['id', 'userId', 'store_name'],
            raw: true
        }).then(storeData => {
            res.render('admin_coupons/admin_coupon_details',{
                title: 'admin_coupons',
                couponInfo,
                storeData,
                averageRating,
                averageCountRating,
                userCount,
            });
        }).catch(function (err) {
            console.log(" req.params.id======>", err);
            req.flash('error', 'Something went wrong.');
            return res.redirect('/admin_coupons');
        });
    }).catch(function (err) {
        console.log(" req.params.id======>", err);
        req.flash('error', 'Something went wrong.');
        return res.redirect('/admin_coupons');
    });
});

function numberWithCommas(x) {
    let character = x.toString().charAt(2)
    let parts = x.toString().split(".",2);
    return (character =='')?parts[0]+',0':parts[0]+','+character;
}


router.get('/delete/:id', FUNC.Auth, function (req, res, next) {
    Coupons.update({ blockAdmin: false,status:false,blockAdmin:true }, {
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
    var cureent_date_time = moment().add(3, 'minutes').format("YYYY-MM-DD HH:mm");
    /*
    SELECT businesses.business_name, count(stores.id) as store_count FROM `businesses` inner join users on businesses.userId = users.id inner join stores on businesses.userId = stores.userId where users.status = 1 Group By businesses.id
    */
   sequelize.query("SELECT users.email,businesses.business_name, count(stores.id) as store_count ,businesses.userId FROM `businesses` inner join users on businesses.userId = users.id inner join stores on businesses.userId = stores.userId where users.status = 1 AND users.isActive=1 AND users.nif_number > 0 Group By businesses.id ORDER BY businesses.business_name ASC",{raw: true})
   .spread(business => {

   console.log("business====================== ",business);

        res.render('admin_coupons/add', { title: 'coupons_pdmin', business,cureent_date_time:cureent_date_time  });

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
            '<img src="/images/kuponLohoFinal@3x.png" alt="" class="img-fluid"> <span style="font-size: 24px; color: red;" >Welcome Kupon </span></div>' +
            '<div class="cuponCat">' + formData.title + '</div>' +
            '<div class="kuponDescp">' + formData.desc + '</div>' +
            '<div class="kuponExpire">Valid For 24 Hours</div></div></div>' +
            '<div class="col-sm-2"><div class="clientLogo"><img src="' + storeLogo + '" height="60" weight="60" alt="" class="img-responsive img-fluid img-circle">' +
            '<div class="btn waves-effect pull-right" style="margin-top: 80px;text-align: center;color: #fff512">' + discountValue + '  </div>' +
            '</div></div></div></div>';

        res.json(JSON.parse(JSON.stringify(y)));

    } else {
        var y = '<div class="alert alert-danger alert-dismissable"> Please fill Complete form to preview coupon</div>';

        res.json(JSON.parse(JSON.stringify(y)));
    }
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
        end_date = new Date(new Date(start_date).getTime() + 26280 * 60 * 60 * 1000);
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
                                    return res.redirect('/admin_coupons');
                                }
                            })
                        }
                    })
                }).catch(function (err) {
                    console.log('err========>', err);
                    return res.redirect('/admin_coupons');
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

