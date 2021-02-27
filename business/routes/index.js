var express = require('express');
var router = express.Router();
global.Models = require('../../models');
var Users = Models.User;
var Business = Models.Business;
var Coupons = Models.Coupons;
var Stores = Models.Stores;
var Deals = Models.Deals;
var Category = Models.Categories;
var Interested = Models.Interested;
var Uninterested = Models.Uninterested;
var Pages = Models.Pages;
var Subscription = Models.Subscription;
var Prices = Models.Prices;

global.FUNC = require('../../functions/businessfunctions.js');
const EmailTemplate = require('email-templates').EmailTemplate;
const nodemailer = require('nodemailer');
const path = require('path');

router.get('/testurl',function(res,res,next){




	var template = new EmailTemplate(path.join(__dirname, '../../templates/', 'customer_forget_password'));
				var newpass = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;
				var emailMessage = 'Hello ' + "fgdfd" + ' ' +"dsfsddsfs" + ' <br> Your new password is "' + "dsfs" + '"';
				//console.log(newpass);
				//console.log(emailMessage); return;
				nodemailer.createTestAccount((err, account) => {
					let transporter = nodemailer.createTransport(
						{
							host: process.env.SMTP_HOST,
                            port: process.env.SMTP_PORT,
                            secure: false,
                            auth: {
                                user: process.env.SMTP_USER, // generated ethereal user
                                pass: process.env.SMTP_PASS  // generated ethereal password
                            },
							tls: {rejectUnauthorized: false},
   							debug:true
						});

					// setup email data with unicode symbols

					var uname = "ssfsdf";

					var email_data = { user_name: uname, business_url:process.env.BUSINESS_URL,current_year:moment().format('YYYY'),email: 'rajthakur@yopmail.com', new_password: 12345 };

					var locals = {
						custom: email_data
					}
					template.render(locals, function (err, results) {
						if (err) {
							if (err) return next(err);
						} else {

							let mailOptions = {
								from: process.env.FROM_MAIL,
                                to: "sdfsdf@yopmail.com",
                                subject: 'Bem-vindo ao kupon, veja suas informações de login',
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

	var currentDate = moment().format("YYYY-MM-DD HH:mm");
	var next30DayDate = moment(currentDate).add(24, 'hours').format("YYYY-MM-DD HH:mm");
	console.log("nextcurrentDate==",currentDate)
	console.log("next24hoursDate==",next30DayDate)
	var currentTime = moment().tz('UTC').format('YYYY-MM-DD HH:mm')
	/*moment(currentDate).add(30, 'days');
    var template = new EmailTemplate(path.join(__dirname, '../../templates/', 'welcome'));

    console.log("verification_linkverification_linkverification_link")
						var email_data = { currdate: "currdate", verification_code: process.env.API_URL + "verify_email?email_verification_code=" };
						var locals = {
							custom: email_data
						};
						nodemailer.createTestAccount((err, account) => {
							let transporter = nodemailer.createTransport(
								{
									host: process.env.SMTP_HOST,
									port: process.env.SMTP_PORT,
									secure: false,
									auth: {
										user: process.env.SMTP_USER, // generated ethereal user
										pass: process.env.SMTP_PASS  // generated ethereal password
									},
									tls: { rejectUnauthorized: false },
									debug: true

								});

								console.log("locals=========================")
								template.render(locals, function (err, results) {
									if (err) {
										if (err) return next(err);
									} else {

										let mailOptions = {
											from: '"Kupon Peru " <theadmin@kupon.com>',
											to: "king123@yopmail.com",
											subject: 'Kupon Verification ',
											text: results.text,
											html: results.html, // html bodynewpass

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
							})

				*/

})

var multer = require('multer');
var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'public/uploads/business/')
	},
	filename: function (req, file, cb) {
		var extname = path.extname(file.originalname).toLowerCase();
		if (req.body.fname) {
			cb(null, req.body.fname.trim() + '-' + Date.now() + extname)
		} else {
			cb(null, 'img-' + Date.now() + extname)
		}
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
}).single('profileImg');

/*----> GET Signup page <----*/
router.get('/', function (req, res, next) {
	return res.redirect('/signup');
})
/*----> GET Signup page <----*/
router.get('/signup/:lang?', function (req, res, next) {
	let lang = 'es';
	if (typeof req.params.lang != "undefined" && req.params.lang != '' && req.params.lang == 'en') {
		lang = 'en';
	}
	console.log(lang)
	Category.findAll({
		where: { status: true, isActive: true, id: { $notIn: JSON.parse("[10001]") }, },
		order: [['name', 'ASC']],
		raw: true
	}).then(cat => {
		res.render('signup', { title: 'Kupon Business Signup', cat, lang });
	}).catch(function (err) {
		console.log('catch', err);
		return res.redirect('/');
	});
});

 router.get("/subscription_script/", async function(req, res, next){
	console.log("sdfsdf");
	var currentDate = moment().format("YYYY-MM-DD");
	var next30DayDate = moment(currentDate).add(90, 'days');
	const getusers = Users.findAll().then(users => {
		users.forEach(async function (element, index) {

			Subscription.findOne({
				where: {
					userId: element.id,
				}
			}).then(async (user) => {
				if(user){
					console.log("exist",user.userId);
				}else{
					console.log("new=====",element.id)
					var subscription_user = {
						userId: element.id,
						subscription_start_date: currentDate,
						subscription_expire_date: next30DayDate,
					}

					//var currentDate = moment().format("YYYY-MM-DD");
					//console.log("subscription_user==================", subscription_user);
					await Subscription.create(subscription_user);
				}
			});

		})
	})


})

router.get("/pages/:slug/:lang?", async function (req, res, next) {
	console.log(">>>>>>>>>>>>>>>>>>>>>>");
	let lang = 'es';
	if (typeof req.params.lang != "undefined" && req.params.lang != '' && req.params.lang == 'en') {
		lang = 'en';
	}
	var { slug } = req.params;

	if (lang == 'es') {
		var fieldName = 'description_pt';
	} else {
		var fieldName = 'description';
	}

	Pages.findOne({ where: { slug: slug, user_id: 1 }, attributes: [[fieldName, 'description']] }).then(result => {
		if (result) {
			res.render("static_page", { page: result, lang, slug })
		}
	})
})

/*---> POST Signup request <-- */
router.all('/signup', function (req, res) {
	var lang = 'en';
	upload(req, res, function (err) {
		if (typeof req.body.lang != 'undefined' && req.body.lang != '' && req.body.lang == 'en') {
			res.locals.LANG = require(`../../locale/en/message`).ADMIN_MSG;
			global.ADMIN_MSG = require(`../../locale/en/message`).Messages;
		} else {
			res.locals.LANG = require(`../../locale/es/message`).ADMIN_MSG;
			global.ADMIN_MSG = require(`../../locale/es/message`).Messages;
		}
		if (err) {
			if (err.code == 'LIMIT_FILE_SIZE') {
				let msg = ADMIN_MSG.ProfileImageSize
				msg = msg.replace("[size]", 4);
				req.flash('error', msg);
			} else {
				req.flash('error', err.code);
			}
			//return res.redirect(`/signup/en`); //${lang}
		}
		if (typeof (req.file) != 'undefined') {
			var ext = path.extname(req.file.originalname);
			if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
				let msg = ADMIN_MSG.AllowImges
				msg = msg.replace("[ext]", '.jpg, .png, .jpeg, .gif');
				req.flash('error', msg);
				return res.redirect('/');
			}
		}

		var reqBody = req.body;
		console.log(reqBody)
		//console.log("reqBody>>>>>>>>>>>>>", reqBody);
		let lang = reqBody.lang || "en";
		if (reqBody.email) {
			Users.count({
				where: { email: reqBody.email, user_type: 2,status:1} //,status:1
			}).then(userCount => {
				if (userCount) { console.log('sdffffffffffffffffffffffffffsdfffff');
					req.flash('error', ADMIN_MSG.EmailExists);
					return res.redirect('/');
				} else {
					var user = {
						fname: reqBody.fname,
						lname: reqBody.lname,
						email: reqBody.email,
						phone: reqBody.phone,
						latitude: reqBody.business_lat,
						longitude: reqBody.business_long,
						location: reqBody.location,
						nif_number: reqBody.nif_number,
						user_image: req.file.filename,
						isActive: 1,
						user_type: 2,
						adminApproved: 1,
						status: 1
					};

					user.password = bcrypt.hashSync(reqBody.password, 10);
					console.log('sddddddddddddddddddddddddd '+user);
					Users.create(user).then(result => {
						console.log(result.get({ plain: true }));
						if (result.id) {
							business_user = {
								userId: result.id,
								categoryId: reqBody.category.toString(),
								business_name: reqBody.business_name,
								state: reqBody.state,
								city: reqBody.city,
								location: reqBody.location
							}
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
									var template = new EmailTemplate(path.join(__dirname, '../../templates/', 'b_user_welcome'));
									nodemailer.createTestAccount((err, account) => {
										let transporter = nodemailer.createTransport(
											{
												host: process.env.SMTP_HOST,
												port: process.env.SMTP_PORT,
												secure: false,
												auth: {
													user: process.env.SMTP_USER, // generated ethereal user
													pass: process.env.SMTP_PASS  // generated ethereal password
												},
												tls: { rejectUnauthorized: false },
												debug: true
											});

										// setup email data with unicode symbols
										var fullName = reqBody.fname + " " + reqBody.lname;
										var email_data = { user_name: fullName,current_year:moment().format('YYYY'),business_url:process.env.BUSINESS_URL, email: reqBody.email, password: reqBody.password };
										var locals = {
											custom: email_data
										}
										template.render(locals, function (err, results) {
											if (err) {
												console.log("jef f sdfs dfs fs df======================",err)
												if (err) return next(err);
											} else {
												let mailOptions = {
													attachments: [
														{   // utf-8 string as an attachment
															filename: 'Kupon BU guia pt.pdf',
															path: 'public/uploads/Kupon_BU_guia_pt.pdf'
														}
													],
													from: process.env.FROM_MAIL,
													to: reqBody.email,
													subject:'Bem-vindo ao kupon, veja suas informações de login',
													text: results.text,
													html: results.html // html bodynewpass
												};
												// send mail with defined transport objenewpassct
												transporter.sendMail(mailOptions, (error, info) => {
													if (error) {
														return console.log("erroorrrrrrrrrrrrrrrrrrrrrrrrr-",error);
													}
													console.log('Message sent: %s', info.messageId);
												});
											}
										});
									});
									console.log(result2.get({ plain: true }));
									req.flash('success', ADMIN_MSG.AccountRegistered);
									return res.redirect(`/login/${lang}`);
								}).catch(function (err) {
									console.log('err========>', err);
									return res.redirect(`/signup/${lang}`);
								});
							}).catch(function (err) {
								console.log('err========>', err);
								return res.redirect(`/signup/${lang}`);
							});
						} else {
							req.flash('error', ADMIN_MSG.CommonError);
							return res.redirect(`/signup/${lang}`);
						}
					}).catch(function (err) {
						console.log('err========>', err);
						return res.redirect(`/signup/${lang}`);
					});
				}

			}).catch(function (err) {
				console.log(err)
				req.flash('error', ADMIN_MSG.CommonError);
				return res.redirect(`/signup/${lang}`);
			});
		} else {
			req.flash('error', ADMIN_MSG.EmailNotFound);
			return res.redirect(`/signup/${lang}`);
		}
	});
});

/*----> GET login page <----*/
router.get('/login/:lang?', function (req, res, next) {
	let lang = 'es';
	if (typeof req.params.lang != "undefined" && req.params.lang != '' && req.params.lang == 'en') {
		lang = 'en';
	}
	res.render('login', { title: 'Kupon Business Login', lang });
});

/*---> POST Login request <-- */
router.post('/login', FUNC.Auth, function (req, res) {
	let lang = req.body.lang || "es";
	if (req.body.email != '' && req.body.email != undefined && req.body.password != '' && req.body.password != undefined) {
		// get encripted password
		var password = req.body.password;
		var email = req.body.email;
		Users.findOne({
			where: { email: email, user_type: 2, status:1 },
			include: [
				{ model: Business, attributes: ["id", "business_name", "categoryId"] }
			],
		}).then(userInfo => {
			var userInfo = userInfo.dataValues;
			console.log("-----userInfo",userInfo);
			if (userInfo) {
				if (userInfo.isActive && userInfo.adminApproved) {
					bcrypt.compare(password, userInfo.password, async function (err, hash_result) {
						if (true) {
							userInfo.user_lang = lang;
							await Users.update({ 'user_lang': lang }, { where: { id: userInfo.id } });
							// admin create session
							var localData = userInfo;
							delete localData.password;
							req.session.regenerate(function () {
								//console.log("----localData",localData);
								req.session.business_user = localData;
								req.flash('success', ADMIN_MSG.SuccessfullyLogin);
								return res.redirect('/dashboard');
							})
						} else {
							req.flash('error', ADMIN_MSG.InvalidCredentials);
							//res.locals.error_flash = req.flash('error')[0];
							//res.render('login');
							return res.redirect(`/login/${lang}`);
						}
					});
				} else {
					req.flash('error', ADMIN_MSG.AccountDeactived);
					return res.redirect(`/login/${lang}`);
				}
			} else {
				req.flash('error', ADMIN_MSG.InvalidCredentials);
				return res.redirect(`/login/${lang}`);
			}

		}).catch(function (err) {
			req.flash('error', ADMIN_MSG.InvalidCredentials);
			return res.redirect(`/login/${lang}`);
		});
	} else {
		req.flash('error', ADMIN_MSG.InvalidCredentials);
		return res.redirect(`/login/${lang}`);
	}
});

/*---> GET dashboard page <----*/
router.all('/dashboard', FUNC.hasStore, FUNC.Auth, function (req, res, next) {
	//console.log("---req.session.business_user", req.session.business_user)
	var currentTime = moment().format("YYYY-MM-DD HH:mm");
	var previousOneMonth = moment(currentTime).subtract(30, 'days').format("YYYY-MM-DD HH:mm");

	var user_id = req.session.business_user.id;
	const storeCount = Stores.count({
		where: { status: true, userId: user_id }
	});
	const couponCount = Coupons.count({
		where: { status: true,blockAdmin:0, userId: user_id,end_date: { $gte: previousOneMonth } }
	});
	const dealsLoc = Deals.count({
		where: { status: true, userId: user_id,end_date: { $gte: previousOneMonth } }
	});

	var currentTime1 = moment(currentTime).format("YYYY-MM-DD HH:mm");
	const getCoupons = sequelize.query("SELECT `coupons`.*, (SELECT count(id) from `redeemeds` where `coupons`.`id` = 	`redeemeds`.`couponId`) as redeemCount , (SELECT count(id) from `not_interested_coupons` where `coupons`.`id` = `not_interested_coupons`.`couponId`) as unIntrestCount FROM `coupons` AS `coupons` LEFT OUTER JOIN `redeemeds` AS `redeemeds` ON `coupons`.`id` = `redeemeds`.`couponId` WHERE `coupons`.`status` = true AND `coupons`.`userId` = " + user_id + " AND `coupons`.`start_date` <= '" + currentTime + "' AND `coupons`.`end_date` >= '" + currentTime1 + "' GROUP BY `coupons`.`id` ORDER BY `coupons`.`id` DESC LIMIT 10", { type: sequelize.QueryTypes.SELECT })
		.then(result => {
			return result;
		}).catch(function (err) {
			return [];
		});

		const getPlanExpiredDay = Subscription.findAll({
			where: {userId: user_id },
			raw: true,
			order: [['id', "DESC"]],
			limit: 1
		}).then(subscriptionData => {
			const date1 = new Date(subscriptionData[0].subscription_expire_date);
			if(date1 >  new Date(moment())){
				const date2 = new Date(moment().format("YYYY-MM-DD"));
				const diffDays = Math.ceil(Math.abs(date1 - date2) / (1000 * 60 * 60 * 24));
				return diffDays;
			}else{
				return 0;
			}


		}).catch(function (err) {
			console.log('catch', err);
			return [];
		});

		//console.log("ajay kumar czxczxcxzczcczxc "+getPlanExpiredDay);

	//get deals
	const getDeals = Deals.findAll({
		where: { status: true, isActive: true, userId: user_id, end_date: { $gte: currentTime1 } },
		raw: true,
		order: [['id', "DESC"]],
		limit: 10
	}).then(deals => {
		return deals;
	}).catch(function (err) {
		console.log('catch', err);
		return [];
	});

	var chartData = [{
		name: 'Number of users interested',
		y: 0,
		male: 0,
		female: 0

	}, {
		name: 'Number of users Not interested',
		y: 0,
		male: 0,
		female: 0
	}]
	var int_count = 0;
	var unint_count = 0;

	getInterestedUninterestedMaleFemale('redeemeds', "userId", user_id, currentTime, (x) => {
		chartData[0].male = x.male
		chartData[0].female = x.female
		getInterestedUninterestedMaleFemale('not_interested_coupons', 'user_id', user_id, currentTime, (y) => {
			chartData[1].male = y.male
			chartData[1].female = y.female
			//Get Current Coupnes
			const getCurrentCoupons = sequelize.query("SELECT `coupons`.id, (SELECT count(id) from `redeemeds` where `coupons`.`id` = 	`redeemeds`.`couponId`) as redeemCount , (SELECT count(id) from `not_interested_coupons` where `coupons`.`id` = `not_interested_coupons`.`couponId`) as unIntrestCount FROM `coupons` AS `coupons` LEFT OUTER JOIN `redeemeds` AS `redeemeds` ON `coupons`.`id` = `redeemeds`.`couponId` WHERE `coupons`.`status` = true AND `coupons`.`userId` = " + user_id + " AND `coupons`.`end_date` >= '" + currentTime + "' GROUP BY `coupons`.`id`", { type: sequelize.QueryTypes.SELECT })
				.then(result => {

					if (result && result.length > 0) {
						_.each(result, (rs) => {
							int_count = int_count + parseInt(rs.redeemCount)
							unint_count = unint_count + parseInt(rs.unIntrestCount)
						})
					}
					chartData[0].y = int_count
					chartData[1].y = unint_count
					return chartData
				}).catch(function (err) {
					return [];
				});



			Promise
				.all([storeCount, couponCount, dealsLoc, getCoupons, getDeals, getCurrentCoupons, getPlanExpiredDay])
				.then(responses => {
					//console.log("-----------responses========>", responses[6]);
					res.render('dashboard', { responses, title: 'Kupon Dashboard' });
				})
				.catch(err => {
					console.log(err);
					return res.redirect('/login');
				});


		})
	})


});

/* POST users forgot Password. */
router.post('/forgot_password', function (req, res, next) {
	var reqBody = req.body;
	let lang = reqBody.lang || "es";
	//var otp = FUNC.generateOTP();
	if (req.body.email && req.body.email != '') {
		Users.findOne({
			where: { email: reqBody.email, user_type: 2 }
		}).then(userData => {
			var userData = userData.dataValues;
			if (userData) {
				var template = new EmailTemplate(path.join(__dirname, '../../templates/', 'customer_forget_password'));
				var newpass = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;
				var emailMessage = 'Hello ' + userData.fname + ' ' + userData.lname + ' <br> Your new password is "' + newpass + '"';
				//console.log(newpass);
				//console.log(emailMessage); return;
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

					var uname = userData.fname + ' ' + userData.lname;

					var email_data = { user_name: uname, business_url:process.env.BUSINESS_URL,current_year:moment().format('YYYY'),email: reqBody.email, new_password: newpass };

					var locals = {
						custom: email_data
					}
					template.render(locals, function (err, results) {
						if (err) {
							if (err) return next(err);
						} else {

							let mailOptions = {
								from: process.env.FROM_MAIL,
								to: userData.email,
								subject: 'Forgot Password',
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

				var Newpassword = bcrypt.hashSync(newpass.toString(), 10);

				Users.update({ 'password': Newpassword }, {
					where: { email: reqBody.email, user_type: 2 }
				}).then(result => {
					req.flash('success', ADMIN_MSG.CheckEmailForNewPassword);
					return res.redirect(`/login/${lang}`);

				}).catch(function (err) {
					req.flash('error', ADMIN_MSG.EmailNotRegistered);
					return res.redirect(`/login/${lang}`);
				});

			} else {
				req.flash('error', ADMIN_MSG.EmailNotRegistered);
				return res.redirect(`/login/${lang}`);
			}
		}).catch(function (err) {
			req.flash('error', ADMIN_MSG.EmailNotRegistered);
			return res.redirect(`/login/${lang}`);
		});
	} else {
		req.flash('error', ADMIN_MSG.EmailNotRegistered);
		return res.redirect(`/login/${lang}`);
	}
});

/* GET profile page. */
router.all('/updateProfile', FUNC.hasStore, FUNC.Auth, function (req, res, next) {
	var user_id = req.session.business_user.id;
	Users.findOne({
		where: { id: user_id, user_type: 2 },
	}).then(userinfo => {
		res.render('profile', { title: 'dashboard', userinfo: userinfo })
	}).catch(function (err) {
		req.flash('error', ADMIN_MSG.EmailNotRegistered);
		return res.redirect('/login');
	});
});

/* UPDATE profile page. */
router.post('/changeProfieInfo', FUNC.Auth, function (req, res, next) {
	upload(req, res, function (err) {
		if (err) {
			if (err.code == 'LIMIT_FILE_SIZE') {
				req.flash('error', 'File size too large.Use maximum 150 KB file.');
			} else {
				req.flash('error', err);

			}
			return res.redirect('/updateProfile');
		}

		var update = {};
		if (typeof (req.file) == 'undefined') {
			update.fname = req.body.fname;
			update.lname = req.body.lname;
		} else {
			update.fname = req.body.fname;
			update.lname = req.body.lname;
			update.user_image = req.file.filename;
		}


		if ((req.body.npass !== '') && (req.body.cnpass !== '')) {
			if (req.body.npass === req.body.cnpass) {
				update.password = bcrypt.hashSync(req.body.npass, 10);
			} else {
				req.flash('error', ADMIN_MSG.PasswordNotMatched);
				return res.redirect('/updateProfile');
			}
		}
		if (req.body.location) {
			update.location = req.body.location;
		}
		if (req.body.latitude) {
			update.latitude = req.body.latitude;
		}
		if (req.body.longitude) {
			update.longitude = req.body.longitude;
		}

		var user_id = req.session.business_user.id;
		Users.update(update, {
			where: { id: user_id, user_type: 2 }
		}).then(result => {
			Users.findOne({
				where: { id: user_id, user_type: 2 },
				include: [
					{ model: Business, attributes: ["id", "business_name", "categoryId"] }
				],
			}).then(userinfo => {
				req.session.business_user = userinfo.dataValues;
				req.flash('success', ADMIN_MSG.ProfileUpdated);
				return res.redirect('/updateProfile');
			}).catch(function (err) {
				req.flash('error', ADMIN_MSG.NoUserDataFoud);
				return res.redirect('/login');
			});
		}).catch(function (err) {
			req.flash('error', ADMIN_MSG.CommonError);
			return res.redirect('/login');
		});

	})

});


/*----> GET Terms and Condition <----*/
router.get('/terms', function (req, res, next) {
	res.render('terms', { title: 'Kupon Terms And Conditions' });
});

/*----> GET Privacy Policies <----*/
router.get('/policy', function (req, res, next) {
	res.render('policy', { title: 'Kupon Policies' });
});


/* Admin Logout */
router.all('/logout', function (req, res) {

	if (req.session.business_user) {
		var lang = req.session.business_user.user_lang;
		req.session.business_user.destroy; // Deletes the session in the database.
		req.session.business_user = null; // Deletes the cookie.
	}

	req.flash('success', ADMIN_MSG.LogoutSuccess);
	return res.redirect('/login/'+lang);
});

router.all("/changelanguage/:lng", function (req, res, next) {
	if (req.params.lng) {
		var user_id = req.session.business_user.id;
		Users.update({ user_lang: req.params.lng }, {
			where: { id: user_id }
		}).then(result => {
			Users.findOne({
				where: { id: user_id, user_type: 2 },
				include: [
					{ model: Business, attributes: ["id", "business_name", "categoryId"] }
				],
			}).then(userinfo => {
				req.session.business_user = userinfo.dataValues;
				console.log("---------------req.session.business_user", req.session.business_user);
				req.flash('success', ADMIN_MSG.LanguageSwitched);
				return res.redirect('/dashboard');
			}).catch(function (err) {
				req.flash('error', ADMIN_MSG.EmailNotRegistered);
				return res.redirect('/login');
			});
		}).catch(function (err) {
			req.flash('error', ADMIN_MSG.CommonError);
			return res.redirect('/login');
		});
	}
})

function getInterestedUninterestedMaleFemale(table, tableField, user_id, currentTime, cb) {
	sequelize.query(`SELECT ${table}.id,users.id,users.gender as gender FROM ${table} left join users on ${table}.${tableField} = users.id where couponId in ( SELECT id FROM coupons WHERE coupons.userId = ${user_id} AND coupons.end_date >= '${currentTime}' )`, { type: sequelize.QueryTypes.SELECT }).then(result => {
		var data = {
			"male": 0, "female": 0
		}
		if (result.length > 0) {
			_.each(result, (rs) => {
				if (rs.gender == 'Male' || rs.gender == 'male') {
					data.male = data.male + 1
				} else {
					data.female = data.female + 1
				}
			})
			cb(data);
		} else {
			cb(data);
		}
	})
}

router.get("/checkBusinessEmail", function (req, res) {
	Users.count({
		where: { email: req.query.email, user_type: 2,status: true }
	}).then(userCount => {
		if (userCount) {
			res.send("false")
		} else {
			res.send("true")
		}
	});
});

router.get("/checkBusinessNIF", function (req, res) {
	Users.count({
		where: { nif_number: req.query.nif_number, user_type: 2, status: true }
	}).then(userCount => {
		if (userCount) {
			res.send("false")
		} else {
			res.send("true")
		}
	});
});

module.exports = router;
