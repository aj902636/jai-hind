var express = require('express');
var router = express.Router();
global.Models = require('../../models');
var Users = Models.User;
var Business = Models.Business;
var Coupons = Models.Coupons;
var Stores = Models.Stores;
var Deals = Models.Deals;
const StoreRating = Models.storeRating;
var Category = Models.Categories;
global.FUNC = require('../../functions/storefunctions.js');
const EmailTemplate = require('email-templates').EmailTemplate;
const nodemailer = require('nodemailer');
const path = require('path');

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
	limits: { fileSize: 150000 }
}).single('profileImg');

/*----> GET login page <----*/
router.get('/', function (req, res, next) {
	return res.redirect('/login');
});

/*----> GET login page <----*/
router.get('/login/:lang?', function (req, res, next) {
	let lang = 'es';
	if(typeof req.params.lang != "undefined" && req.params.lang != '' && req.params.lang == 'en'){
		lang = 'en';
	}
	res.render('login', { title: 'Kupon Store Login',lang });
});

/*---> POST Login request <-- */
router.post('/login', FUNC.Auth, function (req, res) {
	let lang = req.body.lang || "es";
	if (req.body.email != '' && req.body.email != undefined && req.body.password != '' && req.body.password != undefined) {
		// get encripted password
		var password = req.body.password;
		var email = req.body.email;
		Stores.findOne({
			where: { store_email: email,status :true },
			include: [
				{
					model: Users,
					attributes: ['id', 'fname', 'lname','user_image'],
					required: false
				}
			]
		}).then(userInfo => {
			var userInfo = userInfo.dataValues;
			console.log("userInfo======>",userInfo);
			if (userInfo) {
				if (userInfo.isActive) {
					bcrypt.compare(password, userInfo.store_password, async function (err, hash_result) {
						if (hash_result) {
							//update user language
							await Stores.update({ 'user_lang': lang }, { where: { id: userInfo.id }});
							userInfo.user_lang = lang;
							// admin create session
							var localData = userInfo;
							delete localData.store_password;
							req.session.regenerate(function () {
								req.session.store_user = localData;
								req.flash('success', ADMIN_MSG.SuccessfullyLogin);
								return res.redirect('/dashboard');
							});
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
router.all('/dashboard', FUNC.Auth, function (req, res, next) {
	//console.log(store_user)
	var currentTime = moment().format("YYYY-MM-DD HH:mm");
	console.log(currentTime)
	var currentTime1 = moment(currentTime).format("YYYY-MM-DD HH:mm");
	var user_id = req.session.store_user.userId;
	const storeCount = Stores.count({
		where: { status: true, userId: user_id }
	});
	console.log("SHOPID>>>>>>>>>>>>",req.session.store_user.id);
	console.log("SHOPID>>>>>>>>>>>>",user_id);
	const couponCount = Coupons.count({
		//where: { status: true, userId: user_id, storeId:req.session.store_user.id }
		//where: { status: true, userId: user_id, storeId:{like:'%'+req.session.store_user.id+'%'} }
		where: { status: true, userId: user_id,end_date: { $gte: currentTime }, storeId:{like:'%'+req.session.store_user.id+'%'} }
	});
	const dealsLoc = Deals.count({
		where: { status: true, userId: user_id, end_date: { $gte: currentTime } }
	});




	const getCoupons = sequelize.query("SELECT `coupons`.*, (SELECT count(id) from `redeemeds` where `coupons`.`id` = 	`redeemeds`.`couponId`) as redeemCount , (SELECT count(id) from `not_interested_coupons` where `coupons`.`id` = `not_interested_coupons`.`couponId`) as unIntrestCount FROM `coupons` AS `coupons` LEFT OUTER JOIN `redeemeds` AS `redeemeds` ON `coupons`.`id` = `redeemeds`.`couponId` WHERE `coupons`.`status` = true AND `coupons`.`userId` = " + user_id + " AND `coupons`.`start_date` <= '" + currentTime + "' AND `coupons`.`end_date` >= '" + currentTime1 + "' AND coupons.storeId LIKE '%"+req.session.store_user.id+"%' GROUP BY `coupons`.`id` ORDER BY `coupons`.`id` DESC LIMIT 10", { type: sequelize.QueryTypes.SELECT })
		.then(result => {
			return result;
		}).catch(function (err) {
			return [];
		});

	const getDeals = Deals.findAll({
		where: { status: true, isActive: true, userId: user_id, end_date: { $gte: currentTime } },
		raw: true,
		order: [['id', "DESC"]],
		limit: 10
	}).then(deals => {
		return deals;
	}).catch(function (err) {
		console.log('catch', err);
		return [];
	});



	Promise
		.all([storeCount, couponCount, dealsLoc,getCoupons,getDeals])
		.then(responses => {
			res.render('dashboard', { responses, title: 'Kupon Dashboard' });
		})
		.catch(err => {
			console.log(err);
			return res.redirect('/login');
		});

});

/* POST users forgot Password. */
router.post('/forgot_password', function (req, res, next) {
	var reqBody = req.body;
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

					var email_data = { user_name: uname,business_url:process.env.BUSINESS_URL,current_year:moment().format('YYYY'), email: reqBody.email, new_password: newpass };

					var locals = {
						custom: email_data
                    };
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
					return res.redirect('/login');

				}).catch(function (err) {
					req.flash('error', ADMIN_MSG.EmailNotRegistered);
					return res.redirect('/login');
				});

			} else {
				req.flash('error', ADMIN_MSG.EmailNotRegistered);
				return res.redirect('/login');
			}
		}).catch(function (err) {
			req.flash('error', ADMIN_MSG.EmailNotRegistered);
			return res.redirect('/');
		});
	} else {
		req.flash('error', ADMIN_MSG.EmailNotRegistered);
		return res.redirect('/login');
	}
});

/* GET profile page. */
router.all('/updateProfile', FUNC.Auth, function (req, res, next) {
	var user_id = req.session.store_user.id;
	Users.findOne({
		where: { id: user_id, user_type: 2 },
	}).then(userinfo => {
		res.render('profile', { title: 'dashboard', userinfo: userinfo })
	}).catch(function (err) {
		req.flash('error', ADMIN_MSG.NoUserDataFoud);
		return res.redirect('/login');
	});
});
/* GET profile page. */
router.all('/profile', FUNC.Auth, function (req, res, next) {
	const Sequelize = require('sequelize');
	var user_id = req.session.store_user.id;
	var averageRating = 1;
	Stores.findOne({
		where: { id: user_id },
	}).then(userinfo => {
		var averageRating = 0;
		var averageCountRating = 0;
		StoreRating.findOne({
            where: { storeId: user_id },
            attributes: [[Sequelize.fn("COUNT", Sequelize.col("id")), "userCount"],[Sequelize.fn("SUM", Sequelize.col("rating")), "userRatingSum"]],
            raw: true
        }).then(store_rating =>{
			averageCountRating = (numberWithCommas(store_rating.userRatingSum/store_rating.userCount) !='NaN,N')?numberWithCommas(store_rating.userRatingSum/store_rating.userCount):0;
			averageRating = (Math.round(store_rating.userRatingSum/store_rating.userCount))?Math.round(store_rating.userRatingSum/store_rating.userCount):0;
			console.log("asdasdasd "+averageCountRating);
			console.log(averageRating);
			res.render('profile', { title: 'dashboard', userInfo: userinfo, averageRating:averageRating,userCount:store_rating.userCount,averageCountRating:averageCountRating})
		}).catch(function(err){
            console.log(err);
		});
	}).catch(function (err) {
		req.flash('error', ADMIN_MSG.NoUserDataFoud);
		return res.redirect('/login');
	});
});

function numberWithCommas(x) {
    let character = x.toString().charAt(2)
    let parts = x.toString().split(".",2);
	return (character =='')?parts[0]+',0':parts[0]+','+character;
}

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
		var user_id = req.session.store_user.id;
		Users.update(update, {
			where: { id: user_id, user_type: 2 }
		}).then(result => {
			Users.findOne({
				where: { id: user_id, user_type: 2 }
			}).then(userinfo => {
				req.session.store_user = userinfo.dataValues;
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

router.all("/changelanguage/:lng", function(req, res, next){
	if(typeof req.params.lng != 'undefined' && req.params.lng != ''){
		var user_id = req.session.store_user.id;
		Stores.update({user_lang: req.params.lng}, {
			where: { id: user_id }
		}).then(result => {
			Stores.findOne({
				where: { id: user_id },
				include: [
					{
						model: Users,
						attributes: ['id', 'fname', 'lname','user_image'],
						required: false
					}
				],
			}).then(userinfo => {console.log("---userinfo",userinfo)
				req.session.store_user = userinfo.dataValues;
				req.flash('success', ADMIN_MSG.LanguageSwitched);
				return res.redirect('/dashboard');
			}).catch(function (err) {
				console.log("---err",err)
				req.flash('error', ADMIN_MSG.EmailNotRegistered);
				return res.redirect('/login');
			});
		}).catch(function (err) {
			req.flash('error', ADMIN_MSG.CommonError);
			return res.redirect('/login');
		});
	}
})

/* Admin Logout */
router.all('/logout', function (req, res) {

	if (req.session.store_user) {
		var lang = req.session.store_user.user_lang;
		//req.session.destroy();  // Deletes the session in the database.
		req.session.store_user = null;   // Deletes the cookie.
	}
	req.flash('success', ADMIN_MSG.LogoutSuccess);
	return res.redirect('/login/'+lang);
});


module.exports = router;
