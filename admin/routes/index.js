var express = require('express');
var router = express.Router();
global.Models = require('../../models');
var Users = Models.User;
var Coupons = Models.Coupons;
var Category = Models.Categories;
var Reports = Models.Reports;
var Stores = Models.Stores;
var Redeemed = Models.Redeemed;
const { QueryTypes } = require('sequelize');
global.FUNC = require('../../functions/functions.js');

var multer = require('multer');
var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'public/uploads/admin/')
	},
	filename: function (req, file, cb) {
		var extname = path.extname(file.originalname).toLowerCase();
		cb(null, req.body.fname.trim() + '-' + Date.now()+extname)
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
router.get('/login', function (req, res, next) {
	res.render('login', { title: 'Kupon Admin Login' });
});

/*---> POST Login request <-- */
router.post('/login', FUNC.Auth, function (req, res) {
	if (req.body.email != '' && req.body.email != undefined && req.body.email != '' && req.body.email != undefined) {
		// get encripted password
		var password = req.body.password;
		var email = req.body.email;
		Users.findOne({
			where: { email: email, user_type: 1 },
		}).then(userInfo => {
			var userInfo = userInfo.dataValues;
			if (userInfo) {
				bcrypt.compare(password, userInfo.password, function (err, hash_result) {
					console.log(hash_result);
					if (hash_result) {
						// admin create session
						var localData = userInfo;
						delete localData.password;
						req.session.regenerate(function () {
							req.session.user = localData;
							req.flash('success', 'Logged in Successfully');
							return res.redirect('/dashboard');
						})
					} else {
						req.flash('error', 'The credentials you supplied were not correct or did not grant access to this resource');
						//res.locals.error_flash = req.flash('error')[0];
						//res.render('login');
						return res.redirect('/login');
					}
				});
			} else {
				req.flash('error', 'The credentials you supplied were not correct or did not grant access to this resource');
				return res.redirect('/login');
			}

		}).catch(function (err) {
			req.flash('error', 'The credentials you supplied were not correct or did not grant access to this resource');
			return res.redirect('/login');
		});
	} else {
		req.flash('error', 'The credentials you supplied were not correct or did not grant access to this resource');
		return res.redirect('/login');
	}
});

/*---> GET dashboard page <----*/
router.all('/dashboard', FUNC.Auth,async function (req, res, next) {
	var currentTime = moment().format("YYYY-MM-DD HH:mm");
	var previousOneMonth = moment(currentTime).subtract(30, 'days').format("YYYY-MM-DD HH:mm");

	const userCount = Users.count({
		where: { status: true, user_type: 3 }
	});

	const storeCount = Stores.count({
		where: { status: true }
	});

	const redeemedCouponCount = Redeemed.count({
		where: { status: true, end_date: { $gte: previousOneMonth } }
	});

	const business = await sequelize.query("SELECT users.email,businesses.business_name, count(stores.id) as store_count ,businesses.userId FROM `businesses` inner join users on businesses.userId = users.id left join stores on businesses.userId = stores.userId where users.status = 1 AND users.isActive=1 AND users.nif_number > 0 Group By businesses.id",{ type: QueryTypes.SELECT })
	console.log("business=================",business.length)

	const catCount = Category.count({
		where: { status: true , id: { $notIn: JSON.parse("[10001]") },}

	});
	const couponCount = Coupons.count({
		where: { status: true,created_by:'business' }
	});
	const storesList = Stores.findAll({
		where: { status: true },
		attributes: ['store_name','store_location','latitude', 'longitude']
	})
	//coupon_id : null
	const reports = await Reports.count({
		where: { status: false , coupon_id : null }
	});

	Promise
		.all([userCount, business.length, catCount, couponCount, storesList,reports,storeCount,redeemedCouponCount])
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
			where: { email: reqBody.email, user_type: 1 }
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
					where: { email: reqBody.email, user_type: 1 }
				}).then(result => {
					req.flash('success', 'Check your email for new password');
					return res.redirect('/login');

				}).catch(function (err) {
					req.flash('error', 'The email you supplied were not correct or did not grant access to this resource');
					return res.redirect('/login');
				});

			} else {
				req.flash('error', 'Not associated with any account');
				return res.redirect('/login');
			}
		}).catch(function (err) {
			req.flash('error', 'The email you supplied were not correct or did not grant access to this resource');
			return res.redirect('/login');
		});
	} else {
		req.flash('error', 'The email you supplied were not correct or did not grant access to this resource');
		return res.redirect('/');
	}
});

/* GET profile page. */
router.all('/updateProfile', FUNC.Auth, function (req, res, next) {
	var user_id = req.session.user.id;
	Users.findOne({
		where: { id: user_id, user_type: 1 },
	}).then(userinfo => {
		console.log('============>', userinfo.dataValues);
		res.render('profile', { title: 'profile', userinfo: userinfo })
	}).catch(function (err) {
		req.flash('error', 'User information not found.');
		return res.redirect('/login');
	});
});

/* UPDATE profile page. */
router.post('/changeProfieInfo', FUNC.Auth, function (req, res, next) {
	upload(req, res, function (err) {
		console.log(err);
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
				req.flash('error', 'confirm password not matched with new password');
				return res.redirect('/updateProfile');
			}
		}
		var user_id = req.session.user.id;
		Users.update(update, {
			where: { id: user_id, user_type: 1 }
		}).then(result => {
			Users.findOne({
				where: { id: user_id, user_type: 1 }
			}).then(userinfo => {
				req.session.user = userinfo.dataValues;
				req.flash('success', 'Profile updated successfully');
				return res.redirect('/updateProfile');
			}).catch(function (err) {
				req.flash('error', 'User information not found.');
				return res.redirect('/login');
			});
		}).catch(function (err) {
			req.flash('error', 'Something went wrong.');
			return res.redirect('/login');
		});

	})

});

/* Admin Logout */
router.all('/logout', function (req, res) {
	if (req.session.user) {
		req.session.user.destroy; // Deletes the session in the database.
		req.session.user = null; // Deletes the cookie.
	}

	req.flash('success', 'Your are successfully logged out.');
	return res.redirect('/login');
});


module.exports = router;
