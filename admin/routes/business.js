var express = require('express');
var router = express.Router();
global.Models = require('../../models');
var Users = Models.User;
var Category = Models.Categories;
var Subscription = Models.Subscription;
var SubscriptionStatus = Models.SubscriptionStatus;
var paymentMessage = Models.paymentMessage;
var Transactions = Models.Transactions;
var Prices = Models.Prices;
var Deals = Models.Deals;
var Coupons = Models.Coupons;
var Business = Models.Business;
var Stores = Models.Stores;
global.FUNC = require('../../functions/functions.js');

var path = require('path');
var multer = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/business/')
    },
    filename: function (req, file, cb) {
        var extname = path.extname(file.originalname).toLowerCase();
        cb(null, 'bs-' + Date.now() + extname)
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
    limits: { fileSize: 15 * 1024 * 1024 }
}).single('foo');



/*----> All Users listing <----*/
router.get('/', FUNC.Auth, function (req, res, next) {
    var user_id = req.session.user.id;
    sequelize.query("SELECT users.id as user_id,businesses.state, businesses.city, businesses.categoryId,subscriptions.subscription_type,users.isActive,users.adminApproved,users.email,businesses.business_name,businesses.location,users.nif_number,users.email,users.phone, count(stores.id) as store_count ,businesses.userId,users.createdAt FROM `businesses` inner join users on businesses.userId = users.id left join stores on businesses.userId = stores.userId INNER JOIN subscriptions ON businesses.userId = subscriptions.userId where users.status = 1  AND users.nif_number > 0 Group By businesses.id order by users.id desc", { raw: true })
        .spread(async results => {
            const promises = results.map(async function (element, index) {

                let categories = element.categoryId.split(",");
                var category_names = await Category.findOne({ where: { id: { $in: JSON.parse("[" + categories + "]") } }, attributes: [[sequelize.fn('GROUP_CONCAT', sequelize.col('name')), 'categories']], raw: true });

                var store_count = await Stores.count({ where: { userId: element.user_id, status : 1 }, raw: true });

                results[index]['categoryId'] = category_names.categories;

                results[index]['store_count'] = store_count;
            })
            await Promise.all(promises);
            results.sort(function (a, b) {
                return b.id - a.id;
            });
            console.log("------results-------------", results.length);
            // console.log("results=====",results);return;
            res.render('business/index', { userInfo: results, title: 'business' });
        }).catch(function (err) {
            console.log('catch', err);
            return res.redirect('/');
        });
});

/*----> Add Business User <----*/
router.get('/add', function (req, res, next) {
    Category.findAll({
        where: { status: true, isActive: true, id: { $notIn: JSON.parse("[10001]") } },
        raw: true
    }).then(cat => {
        res.render('business/add', { title: 'business', cat });
    }).catch(function (err) {
        console.log('catch', err);
        return res.redirect('/business');
    });
});

/*---> Add Business User <-- */
router.all('/addBusiness', function (req, res) {

    upload(req, res, function (err) {
        if (err) {
            if (err.code == 'LIMIT_FILE_SIZE') {
                req.flash('error', 'File size too large.Use maximum 15MB file.');
            } else {
                req.flash('error', err);

            }
            return res.redirect('/business/add/');
        }

        var reqBody = req.body;
        if (reqBody.email) {
            Users.count({
                where: { email: reqBody.email, user_type: 2, status: true }
            }).then(userCount => {
                if (userCount) {
                    req.flash('error', 'Email already exist.');
                    return res.redirect('/business/add/');
                } else {
                    Users.count({
                        where: { phone: reqBody.phone, user_type: 2, status: true }
                    }).then(phonCount => {
                        if (phonCount) {
                            req.flash('error', 'Phone number already exist.');
                            return res.redirect('/business/add/');
                        } else {
                            Users.count({
                                where: { nif_number: reqBody.nif_number, user_type: 2, status: true }
                            }).then(nifCount => {
                                if (nifCount) {
                                    req.flash('error', 'NIF number already exist.');
                                    return res.redirect('/business/add/');
                                } else {
                                    var user = {
                                        fname: reqBody.fname,
                                        email: reqBody.email,
                                        phone: reqBody.phone,
                                        nif_number: reqBody.nif_number,
                                        latitude: reqBody.business_lat,
                                        longitude: reqBody.business_long,
                                        isActive: 1,
                                        user_type: 2,
                                        status: 1,
                                        adminApproved: 1
                                    };
                                    if (typeof (req.file) != 'undefined') {
                                        user.user_image = req.file.filename;
                                    }
                                    user.password = bcrypt.hashSync(reqBody.password, 10);
                                    Users.create(user).then(result => {
                                        console.log(result.get({ plain: true }));
                                        if (result.id) {
                                            business_user = {
                                                userId: result.id,
                                                categoryId: reqBody.category.toString(),
                                                business_name: reqBody.business_name,
                                                location: reqBody.location,
                                                state: reqBody.state,
                                                city: reqBody.city,
                                            };
                                            Business.create(business_user).then(result2 => {

                                                var currentDate = moment().format("YYYY-MM-DD");
                                                var next30DayDate = moment(currentDate).add(30, 'days');
                                                var subscription_user = {
                                                    userId: result2.userId,
                                                    subscription_start_date: currentDate,
                                                    subscription_expire_date: next30DayDate,
                                                }

                                                //var currentDate = moment().format("YYYY-MM-DD");
                                                console.log("subscription_user==================", subscription_user);
                                                Subscription.create(subscription_user).then(result3 => {
                                                    var template = new EmailTemplate(path.join(__dirname, '../../templates/', 'welcome'));
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

                                                        var uname = reqBody.fname;
                                                        var email_data = {
                                                            user_name: uname,
                                                            email: reqBody.email,
                                                            password: reqBody.password
                                                        };
                                                        var locals = {
                                                            custom: email_data
                                                        };
                                                        template.render(locals, function (err, results) {
                                                            if (err) {
                                                                if (err) return next(err);
                                                            } else {
                                                                let mailOptions = {
                                                                    from: process.env.FROM_MAIL,
                                                                    to: reqBody.email,
                                                                    subject: 'Welcome On Kupon',
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
                                                })

                                                console.log(result2.get({ plain: true }));
                                                req.flash('success', 'Account created successfully.');
                                                return res.redirect('/business/');
                                            }).catch(function (err) {
                                                console.log('err========>', err);
                                                return res.redirect('/business/addBusiness');
                                            });
                                        } else {
                                            req.flash('error', 'Something went wrong.');
                                            return res.redirect('/business');
                                        }
                                    }).catch(function (err) {
                                        console.log('err========>', err);
                                        return res.redirect('/business');
                                    });
                                }
                            }).catch(function (err) {
                                req.flash('error', 'Something Wen Wrong.');
                                return res.redirect('/business');
                            });

                        }
                    }).catch(function (err) {
                        req.flash('error', 'Something Wen Wrong.');
                        return res.redirect('/business');
                    });
                }
            }).catch(function (err) {
                req.flash('error', 'Something Wen Wrong.');
                return res.redirect('/business');
            });
        } else {
            req.flash('error', 'Email Not Found.');
            return res.redirect('/business/add/');
        }
    });
});

/*-------> View Category By ID  <----------*/
router.get('/view/:id', FUNC.Auth, async function (req, res, next) {

    let subs = await Subscription.findOne({ where: { userId: req.params.id } });
	console.log("subs=================", subs);

	var cureent_date = moment().format("YYYY-MM-DD");
	var isafter = moment(subs.subscription_expire_date).isAfter(cureent_date);
    var subscriptionStatus = (isafter)?"active":"expired";
   // console.log('sdfsdfsdfsdfsdfffffsdfffffff'+subscriptionStatus);
    Users.findOne({
        where: { id: req.params.id, user_type: 2 },
    }).then(results => {

        res.render('business/view', { userInfo: results,subscriptionStatus:subscriptionStatus, title: 'business' });
    }).catch(function (err) {
        req.flash('error', 'Something went wrong.');
        return res.redirect('/business');
    });
});

/*-------> Edit Category By ID  <----------*/
router.get('/edit/:id', FUNC.Auth, function (req, res, next) {
    Users.findOne({
        where: { id: req.params.id, user_type: 2 }
    }).then(results => {
        Business.findOne({
            where: { userId: req.params.id }
        }).then(businessInfo => {
            Category.findAll({
                where: { status: true, isActive: true, id: { $notIn: JSON.parse("[10001]") } },
                raw: true
            }).then(cat => {
                res.render('business/edit', { userInfo: results, cat, businessInfo, title: 'business' });
            });
        });
    }).catch(function (err) {
        console.log("err======>", err); return;
        req.flash('error', 'Something went wrong.');
        return res.redirect('/business');
    });
});

/*-------> Update Category  <----------*/
router.post('/updateBusiness/:id', FUNC.Auth, function (req, res, next) {
    upload(req, res, function (err) {
        if (err) {
            if (err.code == 'LIMIT_FILE_SIZE') {
                req.flash('error', 'File size too large.Use maximum 15MB file.');
            } else {
                req.flash('error', err);

            }
            return res.redirect('/business/edit/' + req.params.id);
        }

        var reqBody = req.body;
        var update = {
            fname: reqBody.fname,
            email: reqBody.email,
            phone: reqBody.phone,
            nif_number: reqBody.nif_number,
            latitude: reqBody.business_lat,
            longitude: reqBody.business_long,
        };
        if (typeof (req.file) != 'undefined') {
            update.user_image = req.file.filename;
        }
        update.password = bcrypt.hashSync(reqBody.password, 10);
        Users.update(update, {
            where: { id: req.params.id, user_type: 2 }
        }).then(result => {
            business_user = {
                categoryId: reqBody.category.toString(),
                business_name: reqBody.business_name,
                location: reqBody.location,
                state: reqBody.state,
                city: reqBody.city,
            };
            Business.update(business_user, {
                where: { userId: req.params.id }
            }).then(update => {
                req.flash('success', 'Business updated successfully');
                res.redirect('/business');
            });
        }).catch(function (err) {
            req.flash('error', 'Something went wrong.');
            return res.redirect('/business');
        });

    });
});

/*-------> Delete User  <----------*/
router.get('/delete/:id', FUNC.Auth, function (req, res, next) {
    Users.update({ status: false }, {
        where: { id: req.params.id, user_type: 2 }
    }).then(async result => {
        await Deals.update({ status: false }, { where: { userId: req.params.id } });
        await Coupons.update({ status: false }, { where: { userId: req.params.id } });
        await Stores.update({ status: false }, { where: { userId: req.params.id } });
        console.log("sdfsd===============")
        req.flash('success', 'Business user removed successfully');
        res.redirect('/business');
    }).catch(function (err) {
        console.log('ero==============', err)
        req.flash('error', 'Something went wrong.');
        return res.redirect('/');
    });
});

/*---------> Change Active Status <---------*/
router.post('/status', FUNC.Auth, function (req, res, next) {
    var {
        id,
        status
    } = req.body;

    Users.update({ isActive: status }, {
        where: { id: id, user_type: 2 }
    }).then(async result => {
   // deal = await sequelize.query("update coupons set status="+status+" where userId="+id,	{ type: sequelize.QueryTypes.SELECT });
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

/*---------> Change Admin Approval Status <---------*/
router.post('/admin_approval', FUNC.Auth, function (req, res, next) {
    var {
        id,
        status
    } = req.body;

    Users.update({ adminApproved: status }, {
        where: { id: id, user_type: 2 }
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


router.all('/purchase_subscription_offline/:id', FUNC.Auth, async function (req, res, next) {
	var user_id = req.params.id;
	console.log(user_id);
	let subs = await Subscription.findOne({ where: { userId: user_id } });
	console.log("subs=================", subs);

	var cureent_date = moment().format("YYYY-MM-DD");
	var isafter = moment(subs.subscription_expire_date).isAfter(cureent_date);
	if (isafter) {
		req.flash('success', "Subscription already done.");
		res.redirect('/dashboard');
	}

	const storeCount = Stores.count({
		where: { status: true, userId: user_id }
    });
    const storeIds = Stores.findAll({where: { status: true, userId: user_id }});

	const business = Business.findOne({
        where: { userId: user_id },
        include: [{
            model: Users,
            attributes: ['email']
        }]
    });
    console.log(storeCount);
	const getrefrence = await SubscriptionStatus.findOne({ where: { userId: user_id, payment_status: { $not: 'done' } } });

	const getSubscriptionMessage = await paymentMessage.findOne();
	console.log(getSubscriptionMessage);

	var prices;

	const getPrice = Prices.findAll({
		raw: true,
		order: [['id', "DESC"]],
		limit: 1
	}).then(deals => {
		return deals;
	}).catch(function (err) {
		console.log('catch', err);
		return [];
	});

	//console.log("getrefrence==============",getrefrence);

	Promise.all([storeCount, business, getPrice, getrefrence,storeIds]).then(responses => {
			console.log("-----------responses===jjjj=====>", responses);
			var categories = "";
			var catprice = 0;
			var storeprice = 0;
			var catArray = 0;
            var totalPrice = 0;
            var vat_amount = 0;
            var store_ids = [];
            var business_name = "";
            var email = "";
            if (responses[1]) {
				console.log("responses[1].categoryId", responses[1].categoryId)
				categories = responses[1].categoryId;
				catArray = categories.split(",");
                business_name = responses[1].business_name;
                email = responses[1].user.email;
				console.log("array lenth-========", catArray.length);
			}

			if (responses[2]) {
				catprice = (((catArray.length) * responses[2][0].price_per_cat));
			}

			if (responses[0]) {
                storeprice = ((responses[0] * responses[2][0].price_per_store));
                vat_amount = responses[2][0].vat_price;
            }
            if(responses[4]){
                for (i = 0; i < responses[4].length; i++) {
                    store_ids.push(responses[4][i].id);
                }
            }
            console.log("store data "+store_ids.toString())
			console.log("storeprice -========", storeprice);
			console.log("catprice -========", catprice);
            console.log('ajay vat '+vat_amount);
            console.log('category string ' +categories);
			totalPrice = storeprice * catprice;
            totalPrice = (totalPrice * vat_amount/100) + totalPrice;

            var currentDate = moment().format("YYYY-MM-DD");
            var next30DayDate = moment(currentDate).add(30, 'days').format("YYYY-MM-DD");
            var d = new Date();
            var refrenceId = d.getTime();


            var updateData = {
                no_of_days: 30,
                subscription_start_date: currentDate,
                subscription_expire_date: next30DayDate,
                subscription_type: 'paid'
            }
            console.log(updateData);
			Subscription.update(updateData, {where: { userId: user_id }});

            var subscription_user_status = {
				userId: user_id,
				sub_amount: storeprice + catprice,
				paid_amount: totalPrice,
				reference_id: refrenceId,
                payment_status: "done",
                payment_method : "manual",
                vat_amount : vat_amount,
                store_id : store_ids.toString(),
                category_id : categories,
            }
            console.log(subscription_user_status);
			SubscriptionStatus.create(subscription_user_status).then(result3 => {})

            var template = new EmailTemplate(path.join(__dirname, '../../templates/', 'payment'));
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

				var uname = business_name;
				var email_data = {
					user_name: uname,
					email: email,
					BUSINESS_URL: process.env.BUSINESS_URL,
				};
				var locals = {
					custom: email_data
				};
				template.render(locals, function (err, results) {
					if (err) {
						if (err) return next(err);
					} else {
						let mailOptions = {
							from: process.env.FROM_MAIL,
							to: email,
							subject: 'Subscription SuccessFully Done',
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


            req.flash('success', 'Subscription Done Successfully');
	        res.redirect('/dashboard');
		})
		.catch(err => {
			console.log(err);
			return res.redirect('/login');
		});



})





module.exports = router;
