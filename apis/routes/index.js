var express = require('express');
var router = express.Router();
global.Models = require('../../models');
var Users = Models.User;
var Business = Models.Business;
var Coupons = Models.Coupons;
var Stores = Models.Stores;
var Deals = Models.Deals;
var Category = Models.Categories;
var Subcategories = Models.Subcategories;
var States = Models.States;
var Cities = Models.Cities;
var Uninterested = Models.Uninterested;
var Interested = Models.Interested;
var Reports = Models.Reports;
var Notifications = Models.Notifications;
var NotificationsStatus = Models.NotificationsStatus;
var Redeemed = Models.Redeemed;
const CouponRating = Models.couponRating;
const StoreRating = Models.storeRating;
var config = require('../../config');
var jwt = require('jsonwebtoken');
global.FUNC = require('../../functions/businessfunctions.js');
const EmailTemplate = require('email-templates').EmailTemplate;
const nodemailer = require('nodemailer');
const path = require('path');
var app = express();
app.set('superSecret', config.secret);
var multer = require('multer');
var asyncFun = require("async");

var Twocheckout = require('2checkout-node');




router.get('/payment', function(request, response) {
	var tco = new Twocheckout({
		sellerId: "250705925819",         // Seller ID, required for all non Admin API bindings
		privateKey: "B30E3CF1-0951-4A54-9E39-50D87BF21137",     // Payment API private key, required for checkout.authorize binding
		sandbox: true                          // Uses 2Checkout sandbox URL for all bindings
	});

	var params = {
		"merchantOrderId": "123",
		"token": 'fsdsdfsdfsdfsdfsdfsdfsdfsdfsdfsd',//	 request.body.token,
		"currency": "USD",
		"total": "10.00",
		"billingAddr": {
			"name": "Testing Tester",
			"addrLine1": "123 Test St",
			"city": "Columbus",
			"state": "Ohio",
			"zipCode": "43123",
			"country": "USA",
			"email": "example@2co.com",
			"phoneNumber": "5555555555"
		}
	};

	tco.checkout.authorize(params, function (error, data) {
		if (error) {
			response.send("aaa "+error.message+" aaaaa");
		} else {
			response.send(data.response.responseMsg);
		}
	});

});

// Pass in your private key and seller ID
/*var tco = new Twocheckout({
    apiUser: "APIuser250705925819",                              // Admin API Username, required for Admin API bindings
    apiPass: "APIpass250705925819",                              // Admin API Password, required for Admin API bindings
    sellerId: "250705925819",                                    // Seller ID, required for all non Admin API bindings
    privateKey: "B30E3CF1-0951-4A54-9E39-50D87BF21137",     // Payment API private key, required for checkout.authorize binding
    secretWord: "Nb6%5Hpjhz-uzA%YU-rk-T#a4Pb!nC6nb%EwaT#R#zxC%Vsg*p&WN8J-SrHu8c3A"                                    // Secret Word, required for response and notification checks
});


// Setup the authorization object
var params = {
    "merchantOrderId": "123",
    "token": "MWQyYTI0ZmUtNjhiOS00NTIxLTgwY2MtODc3MWRlNmZjY2Jh",
    "currency": "USD",
    "total": "10.00",
    "billingAddr": {
        "name": "Testing Tester",
        "addrLine1": "123 Test St",
        "city": "Columbus",
        "state": "Ohio",
        "zipCode": "43123",
        "country": "USA",
        "email": "example@2co.com",
        "phoneNumber": "5555555555"
    }
};

// Make the call using the authorization object and your callback function
tco.checkout.authorize(params, function (error, data) {
    if (error) {
		console.log(error);
        console.log('ajay '+error.message);
    } else {
        console.log(JSON.stringify(data));
    }
});

tco.sales.retrieve({sale_id: 205203115664}, function (error, data) {
    if (error) {
        console.log(error);
    } else {
        console.log(data);
    }
});


// Setup checkout params
var params = {
    mode: '2CO',
    li_0_name: 'Test Product',
    li_0_price: '0.01'
};

// Get a URL encoded payment link
var link = tco.checkout.link(params);

tco.checkout.authorize(params, function (error, data) {
    if (error) {
        console.log(error.message);
    } else {
        console.log(JSON.stringify(data));
    }
});*/








var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'public/uploads/business/')
	},
	filename: function (req, file, cb) {
		if (req.body.fname) {
			cb(null, req.body.fname.trim() + '-' + Date.now())
		} else {
			let extArray = file.mimetype.split("/");
			let extension = extArray[extArray.length - 1];
			cb(null, file.fieldname + '-' + Date.now()+ '.' +extension)
		}
	}
});

/*var upload = multer({
	storage: storage,
	fileFilter: function (req, file, cb) { console.log('10');
		var filetypes = /jpeg|jpg|gif|png/;
		var mimetype = filetypes.test(file.mimetype);
		var extname = filetypes.test(path.extname(file.originalname).toLowerCase());
		if (mimetype && extname) {
			return cb(null, true);
		}
		cb(DM.ONLY_IMAGE_ALLOWED + filetypes);
	},
	limits: { fileSize: 150000 }
}).single('profileImg');


const storage = multer.diskStorage({
	destination: function (req, file, cb) {
	  cb(null, 'public/uploads/business/');
	},
	filename: function (req, file, cb) {
	  cb(null, file.fieldname + '-' + Date.now());
	}
  });*/

  const upload = multer({ storage: storage });

router.post('/updateProfileImage',upload.single('profileImg'),function(req,res,next){
	var update = {};
	if(typeof (req.file) != 'undefined') {
		update.user_image = req.file.filename;
	} else {
		update.user_image = req.body.profileImg;
	}
	return res.status(HttpStatus.OK).send({
		status: true,
		error: HttpStatus.getStatusText(HttpStatus.OK),
		reply: 'Profile update successfully!',
		data : update,
	});
})

// Test api
router.get("/", (req, res, next) => {
	console.log("---working well");
	const payload = {
		login_token: 10,
		user_type: 3,
	};
	console.log(jwt.sign(payload, process.env.JWT_KEY));
	res.send({ status: 200, msg: "working fine" });

	var currentTime = moment().format("YYYY-MM-DD HH:mm");//"2019-04-11 13:29:00";// "2019-03-28 05:55:00";//
	console.log("---currentTime", currentTime);
	//var distanceInMiles = 1.60934 * 10; //miles * KM
	var distanceInMiles = 1.60934 * 6.2; //miles * KM
	//AND c.start_date = '"+currentTime+"' AND s.isActive = 1 AND s.status = 1
	//, start_date: currentTime

	Coupons.findAll({
		where: { isActive: true, status: true, blockAdmin: false, id: 240 },
		group: 'coupons.id'
	}).then(allCoupons => {
		if (allCoupons) {
			asyncFun.eachSeries(allCoupons, async (coupon) => {
				let storeArr = coupon.storeId.split(",");
				var usersArr = [];
				var allStore = await Stores.findAll({
					attributes: ['id', 'latitude', 'longitude'],
					where: { id: { $in: JSON.parse("[" + storeArr + "]") } }
				});
				//console.log("---stores--",allStore);
				var notin = "";
				let eng_userIds = [];
				let eng_userTokens = [];
				let pt_userIds = [];
				let pt_userTokens = [];
				asyncFun.eachSeries(allStore, async (element) => {
					notin = (usersArr.length) ? " AND id NOT IN (" + JSON.parse("[" + usersArr + "]") + ")" : "";
					var getUsers = await sequelize.query("SELECT id, device_id, user_lang FROM users WHERE (FIND_IN_SET(:id, subcategory)) AND CHAR_LENGTH(device_id) > 50 AND status = true AND user_type = 3 AND allow_notificatoin = 1 AND latitude!='' and longitude!='' " + notin + "  AND ( 6387.7 * acos( cos( radians(" + element.latitude + ") ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(" + element.longitude + ") ) + sin( radians(" + element.latitude + ") ) * sin( radians( latitude ) ) ) ) < " + distanceInMiles + " group by id", { replacements: { id: coupon.subcategoryId }, type: sequelize.QueryTypes.SELECT, raw: true })
					//console.log("---getUserslength---",getUsers.length);
					getUsers.map((user, index) => {
						if (usersArr.indexOf(user.id) === -1) {
							usersArr.push(user.id);
							if (user.user_lang == 'en' || user.user_lang == '') {
								eng_userIds.push(user.id);
								eng_userTokens.push(user.device_id);
							} else {
								pt_userIds.push(user.id);
								pt_userTokens.push(user.device_id);
							}
						}
					})
				}, function (err) {
					if (err) console.error(err.message);
					console.log('inner eng_userIds end', eng_userIds)
					console.log('inner eng_userTokens end', eng_userTokens)
				});
				console.log("---ourter end")
			}, function (err) {
				if (err) console.error(err.message);
				console.log('done')
			});
		}
	})
})

/*coupn count get userwise*/

router.post('/couponCount', FUNC.apiAuth, function(req, res, next){

	console.log("CouponImageUrl===================", CouponImageUrl)


	var perPage = 10;
	var page = req.body.page || 1;
	var latitude = req.userData.latitude;
	var longitude = req.userData.longitude;
	//var distanceInMiles = 1.60934 * 10; //miles * KM
	//var distanceInMiles = 1.60934 * 4.2; //miles * KM

	var distanceInMiles = 1.60934 * 6.2; //10 km
	if (typeof req.body.search == 'undefined' || req.body.search == '') {
		req.body.search = '';
	} else {
		req.body.searreatilerch = req.body.search;
	}
	Uninterested.findAll({
		where: { user_id: req.userData.id },
		attributes: ['couponId']
	}).then(UninterestedData => {
		let couponIds = UninterestedData.map(a => a.couponId);
		Redeemed.findAll({
			where: { userId: req.userData.id },
			attributes: ['couponId']
		}).then(InterestedData => {
			let IntcouponIds = InterestedData.map(a => a.couponId);
			console.log("couponIds================uninterested====", couponIds)
			console.log("couponIds================IntcouponIds====", IntcouponIds)
			console.log(couponIds.concat(IntcouponIds));
			let nemoveCouponsId = new Array();
			nemoveCouponsId = couponIds.concat(IntcouponIds)
			console.log("couponIds================removed====", nemoveCouponsId);
			Stores.findAll({
				attributes: ['id', [sequelize.literal(' (3959 * acos ( '
					+ 'cos( radians(' + latitude + ') ) '
					+ '* cos( radians( `latitude` ) ) '
					+ '* cos( radians( `longitude` ) - radians(' + longitude + ') )'
					+ '+ sin( radians(' + latitude + ') )'
					+ '* sin( radians( `latitude` )))) '), 'distance'],],

				where: { isActive: 1, status: 1 },
				group: 'id',
				having: { 'distance': { $lte: distanceInMiles } },
				//order: [['distance', 'ASC']],
			}).then(storeResult => {
				storeResult = JSON.parse(JSON.stringify(storeResult));
				storeResult.sort(function (a, b) { return a.distance - b.distance; });
				let storeids = storeResult.map(a => a.id);
				let storeIdInJoin = storeids.join("|");

				console.log("req.userData###########", req.userData.welcome_coupon)
				var couponby;
				if ((req.userData.welcome_coupon)) {
					couponby = ['admin', 'business'];
				} else {
					couponby = ['business'];
				}


				Coupons.findAll({
					where: {
						subcategoryId: { $in: JSON.parse("[" + req.userData.subcategory + ",20001]") },
						//storeId: {$in: JSON.parse("[" + storeids + "]")},
						storeId: sequelize.literal(" CONCAT(  ',',  `storeId` ,  ',' ) REGEXP  ',(" + storeIdInJoin + "),' "),
						//created_by: couponby,
						id: { $notIn: JSON.parse("[" + nemoveCouponsId + "]") },
						//	id: { $notIn: JSON.parse("[" + IntcouponIds + "]") },
						status: true,
						isActive: true,
						blockAdmin: false,
						//start_date: { $lte: Date.now() },
						//end_date: { $gte: Date.now() },
						createdAt: { $gte: req.userData.createdAt },
						$or: [{ title: { $like: '%' + req.body.search + '%' } }]
					},
					group: 'coupons.id',
					order: [['id', 'DESC']],
					//limit: perPage, offset: (perPage * page) - perPage,
					include: [
						{
							model: Subcategories,
							attributes: ['id', 'name']
						},
						{
							model: Users,
							attributes: [['user_image', 'store_image']]
						}
					],
					raw: true
				}).then(coupons => {
					console.log("------------------coupons ajay", coupons.length);
					let couponsArr = [];
					let couponsDataArr = [];
					asyncFun.eachSeries(coupons, (element, callback) => {
						if (couponsArr.indexOf(element.id) === -1) {
							//console.log()
							//(6387.7 * acos ( cos( radians(" + latitude + ") ) * cos( radians( `latitude` ) ) * cos( radians( `longitude` ) - radians(" + longitude + ") )+ sin( radians(" + latitude + ") )* sin( radians( `latitude` ))))
							//sequelize.query("SELECT stores.id ,stores.store_location ,stores.latitude ,stores.longitude ,stores.store_name,stores.store_name ,stores.street_address , stores.street_address , 0 AS `distance` FROM `stores` AS `stores` WHERE `stores`.`isActive` = 1 AND `stores`.`status` = 1 AND id IN (" + JSON.parse("[" + element.storeId + "]") + ") GROUP BY `id` HAVING `distance` <= " + distanceInMiles + " ORDER BY `distance` ASC LIMIT 1",
							sequelize.query("SELECT stores.id ,stores.store_location ,stores.latitude ,stores.longitude ,stores.store_name,stores.store_name ,stores.street_address , stores.street_address ,stores.town_city, (6387.7 * acos ( cos( radians(" + latitude + ") ) * cos( radians( `latitude` ) ) * cos( radians( `longitude` ) - radians(" + longitude + ") )+ sin( radians(" + latitude + ") )* sin( radians( `latitude` )))) AS `distance` FROM `stores` AS `stores` WHERE `stores`.`isActive` = 1 AND `stores`.`status` = 1 AND id IN (" + JSON.parse("[" + element.storeId + "]") + ") GROUP BY `id` HAVING `distance` <= " + distanceInMiles + " ORDER BY `distance` ASC LIMIT 1",
								{ type: sequelize.QueryTypes.SELECT, raw: true, plain: true })
								.then(getStore => {
									if (getStore) {
										element['user_id'] = element.userId;
										element['couponId'] = element.id;
										element['coupon.user.id'] = element.userId;
										element['coupon.user.store_image'] = element.image;
										element['coupon.subcategory.id'] = element.subcategoryId;
										element['coupon.subcategory.name'] = '';
										element['coupon.id'] = element.id;
										element['coupon.storeId'] = element.storeId;
										element['coupon.max_users'] = element.max_users;
										element['coupon.discount'] = element.discount;
										element['coupon.original_price'] = element.original_price;
										element['coupon.final_price'] = element.final_price;
										element['coupon.start_date'] = element.start_date;
										element['coupon.end_date'] = element.end_date;
										element['coupon.coupon_duration'] = element.coupon_duration;
										element['coupon.isSpecial'] = element.isSpecial;
										element['coupon.isActive'] = element.isActive;
										element['coupon.title'] = element.title;
										element['coupon.description'] = element.description;
										element['coupon.items'] = element.items;
										element['coupon.created_by'] = element.created_by;

										element['coupon.image'] = "thumb_" + element.image;
										element['coupon.store.id'] = getStore.id;
										element['coupon.store.store_location'] = getStore.store_location;
										element['coupon.store.street_address'] = getStore.street_address;
										element['coupon.store.town_city'] = getStore.town_city;
										element['coupon.store.latitude'] = getStore.latitude;
										element['coupon.store.longitude'] = getStore.longitude;
										element['coupon.store.store_name'] = getStore.store_name;
										element['coupon.store.distance'] = getStore.distance;
										//console.log("element=================",element)
										if (element['created_by'] == "admin") {
											//console.log("element=================",element)
											var UserCreatedDate = moment(req.userData.createdAt);
											var cureent_date = moment().format("YYYY-MM-DD HH:MM");
											var isafter = moment(element.start_date).isAfter(UserCreatedDate);
											if (isafter) {
												var isafterforexpire = moment(element['end_date']).isAfter(UserCreatedDate);
												if (isafterforexpire) {
													//For IOS
													//element['end_date'] = moment(UserCreatedDate).add(24, 'hours');
													element['coupon.end_date'] = moment(element['start_date']).add(24, 'hours');

													console.log("after udrt current date")
													var isafterforexpire = moment(element['end_date']).isAfter(cureent_date);
													if (isafterforexpire) {
													couponsDataArr.push(element);
													couponsArr.push(element.id);
													}
												}
											} else {
												console.log("after udrt123 current date")
												element['coupon.start_date'] = UserCreatedDate;
												element['coupon.end_date'] = moment(UserCreatedDate).add(24, 'hours');
												element['coupon.current_date'] = cureent_date;
												var isafterforexpire = moment(element['end_date']).isAfter(cureent_date);
												if (isafterforexpire) {
													//element['title'] = "4" + element['title'];
													//	element['start_date'] = UserCreatedDate;
													//	element['end_date'] = moment(UserCreatedDate).add(24, 'hours');
													couponsDataArr.push(element);
													couponsArr.push(element.id);
												}

											}

										} else {
											//var cureent_date = moment().format("YYYY-MM-DD");
											//var user_register_date = moment().format("YYYY-MM-DD");
											//var isafter = moment(req.userData.createdAt).isAfter(cureent_date);
											//console.log(cureent_date)
											//console.log(req.userData.createdAt)
											//if (isafter) { console.log("------------------coupons ajay2", element);
												couponsDataArr.push(element);
												couponsArr.push(element.id);
											//}

										}

										//var isafter = moment(checkSubscription.subscription_expire_date).isAfter(cureent_date);


										callback();
									} else {
										//console.log("else=========================",element)
										callback();
									}
								})
						}


					}, (err) => {

						console.log("befourcount=====================", couponsDataArr)
						Coupons.count({
							where: {
								subcategoryId: { $in: JSON.parse("[" + req.userData.subcategory + "]") },
								//storeId: {$in: JSON.parse("[" + storeids + "]")},
								id: { $notIn: JSON.parse("[" + nemoveCouponsId + "]") },
								status: true,
								isActive: true,
								blockAdmin: false,
								//start_date: { $lte: Date.now() },
								//end_date: { $gte: Date.now() },
								createdAt: { $gte: req.userData.createdAt },
								//title: {$like: '%' + req.body.search + '%'}
								$or: [{ title: { $like: '%' + req.body.search + '%' } }]
							},
							//limit: perPage, offset: (perPage * page) - perPage,
							raw: true
						}).then(count => {
							console.log("couponsDataArr====",couponsDataArr)
							console.log("sdfsdfsdffinel=====================")
							return res.status(HttpStatus.OK).send({
								status: true,
								reply: 'Success',
								data: {
									'coupons': couponsDataArr,
									'store_image_url': "http://"+req.headers.host+ '/uploads/business/',
									'coupon_image_url': "http://"+req.headers.host+ '/uploads/coupons/',
									//'coupon_image_url': CouponImageUrl,
									'default_image_url': "http://"+req.headers.host+ '/uploads/def_cat/',
									'current': page,
									'pages': Math.ceil(count / perPage)
								}
							});
						});
					});
					console.log("fffffsddddddddddddddddddddddddddddddddddd", couponsDataArr.length)
				}).catch(function (err) {
					console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%1", err);
					return res.status(HttpStatus.OK).send({
						status: false,
						error: HttpStatus.getStatusText(HttpStatus.OK),
						reply: err
					});
				});
			}).catch(function (err) {
				console.log(" err======>", err);
				return res.status(HttpStatus.OK).send({
					status: false,
					error: HttpStatus.getStatusText(HttpStatus.OK),
					reply: err
				});
			});
		}).catch(err => {
			console.log("$$$$$$$$$$$$$$$$$$$$$$$32", err);
			return res.status(HttpStatus.OK).send({
				status: false,
				error: HttpStatus.getStatusText(HttpStatus.OK),
				reply: err
			});
		});
	}).catch(err => {
		console.log("$$$$$$$$$$$$$$$$$$$$$$$32", err);
		return res.status(HttpStatus.OK).send({
			status: false,
			error: HttpStatus.getStatusText(HttpStatus.OK),
			reply: err
		});
	});
})




/*----> GET check index <----*/
router.get('/pages/:slug', async function (req, res, next) {
	if (typeof req.params.slug == 'undefined' || req.params.slug == '') {
		return res.status(200).json({
			status: false,
			data: {}
		})
	}
	var pageModel = Models.Pages;
	const pageData = await pageModel.findOne({
		where: { user_type: 1, slug: req.params.slug },
		attributes: ['slug', 'description', 'description_pt']
	});
	return res.status(200).json({
		status: true,
		data: (pageData) ? pageData : {}
	})

});

// Get front deals
router.get('/front_deals', function (req, res, next) {
	Deals.findAll({
		where: { start_date: { $lte: Date.now() }, isActive: true },
		include: [
			{
				model: Category,
				attributes: ['id', 'name']
			},
			{
				model: Subcategories,
				attributes: ['id', 'name']
			}
		],
		limit: 2,
		order: [['id', 'DESC']]
	}).then(results => {
		console.log('results=======', results);
		res.status(200).json({ dealInfo: results });
	}).catch(function (err) {
		console.log('catch', err);
		res.status(200).json({ dealInfo: {} });
	});
});

/* POST users Signup. */
router.post('/signup', function (req, res, next) {
	var reqBody = req.body;
	var headers = req.headers;
	var otp = FUNC.generateOTP();
	var conditions = new Array();
	conditions.push({ email: reqBody.email });
	if(reqBody.phone != "" && reqBody.phone != undefined ){
		conditions.push({ phone: reqBody.phone });
	}
	Users.findOne({
		where: {
			user_type: 3,
			status: 1,
			$or: conditions
		},
		attributes: ['fname', 'lname', 'email', 'phone', 'user_type', 'device_type', 'device_id']
	}).then(userData => {
		console.log("USERDATA======>", userData);
		if (!userData) {

			var randomObj = require("randomstring");
			var verifycode = randomObj.generate({
				length: 10,
				charset: 'alphanumeric',
				capitalization: 'uppercase'
			});
			var user = {
				fname: reqBody.fname,
				lname: reqBody.lname,
				email: reqBody.email,
				phone: reqBody.phone,
				latitude: reqBody.latitude,
				longitude: reqBody.longitude,
				user_type: 3,
				device_type: headers.device_type,
				device_id: headers.device_id,
				app_version: headers.app_version,
				otp: otp,
				otpExpDate: moment().add(1, "h").format(),
				status: 1,
				isActive: 1,
				welcome_coupon: 1,
				email_verification_code: verifycode,
				email_verified: 0
			};
			//console.log(user);
			user.password = bcrypt.hashSync(reqBody.password, 10);
			Users.create(user).then(result => {
				console.log(result.get({ plain: true }));
				const payload = {
					login_token: result.id,
					user_type: result.user_type
				};
				//var token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2dpbl90b2tlbiI6MzAyLCJ1c2VyX3R5cGUiOjMsImlhdCI6MTU5ODAwMTU3OH0.rhGP4RSUMEYn7EBnRZh1jERiInEgwuu6cAxmObt3RIY';
				var token = jwt.sign(payload, process.env.JWT_KEY);

				Users.update({ 'access_token': token }, {
					where: { id: result.id, user_type: 3 }
				}).then(newresult => {

				var currdate = moment().format("YYYY");
				var template = new EmailTemplate(path.join(__dirname, '../../templates/', 'verification'));
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

					var verification_code = verifycode;
					var email_data = { currdate: currdate, verification_code: "http://"+req.headers.host+ "/verify_email?email_verification_code=" + verification_code };
					var locals = {
						custom: email_data
					};
					console.log("locals=========================", locals)
					template.render(locals, function (err, results) {
						if (err) {
							if (err) return next(err);
						} else {

							let mailOptions = {
								from: process.env.FROM_MAIL,
								to: reqBody.email,
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
				});


					res.status(HttpStatus.OK).send({
						status: true,
						reply: DM.ACCOUNT_REGISTER_SUCCESSFULLY,
						data: { id: result.id, phone: result.phone, fname: result.fname, lname: result.lname, email: result.email, user_type: result.user_type, status: result.status, access_token: token }
					});

				});
			}).catch(function (err) {
				console.log(err)
				return res.status(HttpStatus.OK).send({
					status: false,
					error: HttpStatus.getStatusText(HttpStatus.OK),
					reply: err
				});
			});
		} else {
			if (userData.email == reqBody.email) { var message = DM.EMAIL_EXISTS; }
			if (userData.phone == reqBody.phone) {
				var message = DM.PHONE_EXISTS;
			}
			return res.status(HttpStatus.OK).send({
				status: false,
				error: HttpStatus.getStatusText(HttpStatus.OK),
				reply: message
			});
		}
	});
});


router.post('/addCity', function(req, res, next){
	console.log(req.body)
	Cities.findAll({
		attributes: ['cities.*'],
		where: { state_id: req.body.stateId,name:req.body.city_name },
		order: [['name', 'ASC']],
		raw: true,
	}).then(cities2 => {
		if(cities2.length <= 0){
			console.log(cities2)
			var cityData = {
				name: req.body.city_name,
				state_id: req.body.stateId
			};
			Cities.create(cityData).then(result => {
				cities = {};
				Cities.findAll({
					attributes: ['cities.*'],
					where: { state_id: req.body.stateId},
					order: [['id', 'DESC']],
					raw: true,
				}).then(cities1 => {
					cities.cities = cities1;
					return res.status(HttpStatus.OK).send({
						status: true,
						error: HttpStatus.getStatusText(HttpStatus.OK),
						reply: DM.CITY_ADDED,
						data: cities
					});
				})
			}).catch( function(err){
				return res.status(HttpStatus.OK).send({
					status: false,
					error: HttpStatus.getStatusText(HttpStatus.OK),
					reply: err
				});
			})
		}else{
			return res.status(HttpStatus.OK).send({
				status: false,
				error: HttpStatus.getStatusText(HttpStatus.OK),
				reply: DM.CITY_ALREADY_ADDED,
			});
		}

	}).catch(function (err) {
		console.log(err)
		return res.status(HttpStatus.OK).send({
			status: false,
			error: HttpStatus.getStatusText(HttpStatus.OK),
			reply: err
		});
	});

});


router.post('/check_verify_email', FUNC.apiAuth, function (req, res, next) {
	console.log(req.userData.email_verified)
	if(req.userData.email_verified) {
		res.status(HttpStatus.OK).send({
			status: true,
			reply: DM.EMAIL_VERIFYED,
		});
	}else{
		return res.status(HttpStatus.OK).send({
			status: false,
			error: HttpStatus.getStatusText(HttpStatus.OK),
			reply: DM.VERIFY_YOUR_LINK,
		});
	}
});



router.post('/resend_verify_email_link', function (req, res, next) {
	var reqBody = req.body;
	var headers = req.headers;
	Users.findOne({
		where: {
			user_type: 3,
			email: reqBody.email
		},
		attributes: ['fname', 'lname', 'email', 'phone', 'user_type', 'device_type', 'device_id']
	}).then(userData => {
		console.log("USERDATA======>", userData);
		if (userData) {
			console.log(userData)
			var randomObj = require("randomstring");
			var verifycode = randomObj.generate({
				length: 10,
				charset: 'alphanumeric',
				capitalization: 'uppercase'
			});

			var user = {
			//	isActive: 0,
			//	status: 0,
				email_verification_code: verifycode,
				email_verified: 0
			};

			Users.update(user, {
				where: { user_type: 3, email: reqBody.email }
			}).then(newresult => {
				var currdate = moment().format("YYYY");
				var template = new EmailTemplate(path.join(__dirname, '../../templates/', 'verification'));
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

					var verification_code = verifycode;
					var email_data = { currdate: currdate, verification_code: "http://"+req.headers.host+ "/verify_email?email_verification_code=" + verification_code, business_url:process.env.BUSINESS_URL };
					var locals = {
						custom: email_data
					};
					console.log("locals=========================", locals)
					template.render(locals, function (err, results) {
						if (err) {
							if (err) return next(err);
						} else {

							let mailOptions = {
								from: process.env.FROM_MAIL,
								to: reqBody.email,
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
				});


				// console.log("newresult-------->", newresult);
				res.status(HttpStatus.OK).send({
					status: true,
					reply: DM.ACCOUNT_VERIFIED_LINK_EMAIL,
				});

			}).catch(function (err) {
				return res.status(HttpStatus.OK).send({
					status: false,
					error: HttpStatus.getSotpExpDatetatusText(HttpStatus.OK),
					reply: err
				});
			});

		} else {

			var message = DM.ACCOUNT_NOT_FOUND_EMAIL;
			return res.status(HttpStatus.OK).send({
				status: false,
				error: HttpStatus.getStatusText(HttpStatus.OK),
				reply: message
			});
		}
	});
})

/* Verification code enter */
router.get('/verify_email', function (req, res, next) {

	var reqBody = req.query;
	console.log("reqBody===========", reqBody);
	var headers = req.headers;


	Users.findOne({
		where: { email_verification_code: reqBody.email_verification_code },
	}).then(userData => {
		if (userData) {
			if (userData.email_verified) {
				var message = DM.ACCOUNT_ALREADY_ACTIVE;
				return res.status(HttpStatus.OK).send({
					status: false,
					error: HttpStatus.getStatusText(HttpStatus.OK),
					reply: message
				});
			} else {

				Users.update({ 'email_verified': 1, 'isActive': 1, 'status': 1 }, {
					where: {
						email_verification_code: reqBody.email_verification_code,
						email_verified: 0
					}
				}).then(result => {
					console.log('result============>', result);
					userData.isActive = 1
					userData.email_verified = 1
					userData.status = 0,
					res.writeHead(200, { 'Content-Type': 'text/html'});
					res.end('<h3 style="color:green">'+DM.EMAIL_VERIFYED+'</h3>');
				}).catch((err) => {
					console.log('err============>', err);
					res.writeHead(400, { 'Content-Type': 'text/html'});
  					res.end('<h3 style="color:red">'+DM.SOMETHING_WENT_WRONG+'</h3>');
				});
			}
		} else {
			var message = DM.NOT_ASSOCIATED_ACCOUNT;
			res.writeHead(400, { 'Content-Type': 'text/html'});
			res.end('<h3 style="color:red">'+DM.SOMETHING_WENT_WRONG+'</h3>');
		}
	})
})

/* POST users Resend OTP. */
router.post('/resend_otp', function (req, res, next) {
	var reqBody = req.body;
	var headers = req.headers;
	var otp = FUNC.generateOTP();
	Users.findOne({
		where: { phone: reqBody.phone, user_type: 3 },
		attributes: ['id', 'fname', 'lname', 'email', 'phone', 'user_type', 'otp', 'isActive', 'device_type', 'device_id']
	}).then(userData => {
		//console.log(userData);
		if (userData.isActive) {
			res.status(HttpStatus.OK).send({
				status: true,
				reply: DM.ACCOUNT_ALREADY_ACTIVE,
				data: { userId: userData.id, mobileNo: userData.phone }
			});
		} else {
			if(process.env.env != "development"){
				FUNC.sendOTP(userData, function () {
					return true;
				})
			}
			res.status(HttpStatus.OK).send({
				status: true,
				reply: DM.OTP_SEND_SUCCESSFULLY,
				data: { userId: userData.id, mobileNo: userData.phone }
			});
		}

	}).catch(function (err) {
		return res.status(HttpStatus.OK).send({
			status: false,
			error: HttpStatus.getStatusText(HttpStatus.OK),
			reply: err
		});
	});
});

/* POST users Verify OTP. */
router.post('/verify_otp', function (req, res, next) {
	var reqBody = req.body;
	Users.update({ 'otp': '', 'otpExpDate': null, isActive: 1 }, {
		where: { id: reqBody.userId, otp: reqBody.otp },
		plain: true
	}).then(newresult => {
		if (newresult[0] === 1) {
			Users.findOne({
				where: { id: reqBody.userId, status: true },
				include: [
					{
						model: States,
						as: 'state_name',
						attributes: ['id', 'name'],
					},
					{
						model: Cities,
						as: 'city_name',
						attributes: ['id', 'name']
					}
				]
			}).then(userData => {
				//console.log("newresult-------->", userData);
				res.status(HttpStatus.OK).send({
					status: true,
					reply: DM.ACCOUNT_VERIFIED_BY_OTP,
					data: userData
				});
			});
		} else {
			res.status(HttpStatus.OK).send({
				status: false,
				reply: DM.OPT_NOT_MATCHED
			});
		}
	}).catch(function (err) {
		console.log(err);
		res.status(HttpStatus.OK).send({
			status: false,
			reply: DM.OPT_NOT_MATCHED
		});
	});
});

/* POST users Login. */
router.post('/login', function (req, res, next) {
	var reqBody = req.body;
	var headers = req.headers;
	Users.findOne({
		where: { email: reqBody.email,status : true, user_type: 3 }, //, status: true
		include: [
			{
				model: States,
				as: 'state_name',
				attributes: ['id', 'name'],
			},
			{
				model: Cities,
				as: 'city_name',
				attributes: ['id', 'name']
			}
		]
	}).then(userData => {
		console.log(userData)
		if (userData) {
			var userId = userData.id;
			var mobileNo = userData.phone;
			var fname = userData.fname;
			var lname = userData.lname;
			var email = userData.email;
			var user_type = userData.user_type;
			var status = userData.status;
			var access_token = userData.access_token;

			if (userData.otp == '') {
				var otpVerification = true
			} else {
				//var otpVerification = false
				var otpVerification = true
			}
			if (userData.subcategory == '') {
				var category = false
			} else {
				var category = true
			}

			if (userData.isActive) {
				bcrypt.compare(reqBody.password, userData.password, function (err, hash_result) {
					if (hash_result) {
						Users.update({
							last_login: Date.now(),
							device_type: headers.device_type,
							device_id: headers.device_id,
							app_version: headers.app_version
						}, {
							where: { id: userData.id, user_type: 3 }
						}).then(update => {
							// console.log("update-------->", update);
							return res.status(HttpStatus.OK).send({
								status: true,
								reply: DM.SUCCESSESSFULLY_LOGIN,
								data: userData,
								otpVerification: otpVerification,
								category: category
							});
						}).catch(function (err) {
							return res.status(HttpStatus.OK).send({
								status: true,
								error: HttpStatus.getStatusText(HttpStatus.OK),
								reply: err,
								otpVerification: otpVerification,
								category: category,
								data: userData,
								userId: userId,
								mobileNo: mobileNo
							});
						});
					} else {
						res.status(HttpStatus.OK).send({
							status: false,
							error: HttpStatus.getStatusText(HttpStatus.OK),
							reply: DM.INVALID_LOGIN
						});
					}
				});
			} else {
				if (userData.otp == '') {
					return res.status(HttpStatus.OK).send({
						status: false,
						error: HttpStatus.getStatusText(HttpStatus.OK),
						reply: DM.ACCOUNT_NOT_ACTIVE,
						otpVerification: otpVerification,
						category: category,
						data: userData,
						userId: userId,
						mobileNo: mobileNo
					});
				} else {
					return res.status(HttpStatus.OK).send({
						status: true,
						error: HttpStatus.getStatusText(HttpStatus.OK),
						reply: DM.ACCOUNT_NOT_ACTIVE_VERIFY_OTP,
						otpVerification: otpVerification,
						category: category,
						data: userData,
						userId: userId,
						mobileNo: mobileNo
					});
				}
			}

		} else {
			return res.status(HttpStatus.OK).send({
				status: false,
				error: HttpStatus.getStatusText(HttpStatus.OK),
				reply: DM.INVALID_LOGIN
			});
		}
	});
});

/* POST users fb Login. */
router.post('/fbLogin', function (req, res, next) {
	var reqBody = req.body;
	reqBody.headers = req.headers;
	var headers = req.headers;
	if (reqBody.newUser == 0) {
		Users.count({
			where: { fb_id: reqBody.fb_id, user_type: 3, status: true }
		}).then(userCount => {
			if (userCount) {
				Users.findOne({
					where: { fb_id: reqBody.fb_id, user_type: 3, status: true },
					include: [
						{
							model: States,
							as: 'state_name',
							attributes: ['id', 'name'],
						},
						{
							model: Cities,
							as: 'city_name',
							attributes: ['id', 'name']
						}
					]
				}).then(userinfo => {
					if (userinfo) {
						console.log("------------------userinfo.isActive---------------", userinfo.isActive);
						if (userinfo.isActive) {
							Users.update({
								last_login: Date.now(),
								device_type: headers.device_type,
								device_id: headers.device_id,
								app_version: headers.app_version
							}, {
								where: { fb_id: reqBody.fb_id }
							}).then(update => {
								if (userinfo.subcategory == '') {
									var category = false
								} else {
									var category = true
								}
								if (userinfo.otp == '') {
									var otpVerification = true
								} else {
									var otpVerification = false
								}
								return res.status(HttpStatus.OK).send({
									status: true,
									is_registered: true,
									reply: DM.SUCCESSESSFULLY_LOGIN,
									data: userinfo,
									category: category,
									otpVerification: otpVerification
								});
							});
						} else {
							console.log("-----------false-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=");
							return res.status(HttpStatus.OK).send({
								status: false,
								error: HttpStatus.getStatusText(HttpStatus.OK),
								reply: DM.ACCOUNT_NOT_ACTIVE,
								otpVerification: false,
								category: "",
								userId: userinfo.id,
								mobileNo: userinfo.phone,
								deactivate: true
							});
						}

					} else {
						return res.status(HttpStatus.OK).send({
							status: false,
							error: HttpStatus.getStatusText(HttpStatus.OK),
							reply: DM.INVALID_LOGIN,
							is_registered: false
						});
					}
				});
			} else {
				return res.status(HttpStatus.OK).send({
					status: false,
					is_registered: false,
					reply: DM.USER_NOT_FOUND_THIS_ID,
				});
			}
		});
	} else {
		Users.findOne({
			where: { email: reqBody.email, user_type: 3, status: true },
			include: [
				{
					model: States,
					as: 'state_name',
					attributes: ['id', 'name'],
				},
				{
					model: Cities,
					as: 'city_name',
					attributes: ['id', 'name']
				}
			]
		}).then(userData => {
			console.log("USERDATA======>", userData);
			if (!userData) {
				Users.findOne({
					where: { fb_id: reqBody.fb_id, user_type: 3, status: true },
				}).then(userData1 => {
					if(!userData1){
						//console.log("=========>",reqBody);
						var randomObj = require("randomstring");
						var verifycode = randomObj.generate({
							length: 10,
							charset: 'alphanumeric',
							capitalization: 'uppercase'
						});
						var user = {
							fname: reqBody.fname,
							lname: reqBody.lname,
							email: reqBody.email,
							phone: reqBody.phone,
							fb_id: reqBody.fb_id,
							fb_image: reqBody.fb_image,
							fb_link: reqBody.fb_link,
							latitude: reqBody.latitude,
							longitude: reqBody.longitude,
							user_type: 3,
							device_type: reqBody.headers.device_type,
							device_id: reqBody.headers.device_id,
							app_version: reqBody.headers.app_version,
							status: 1,
							isActive: 1,
							email_verification_code: verifycode,
							email_verified: 0
						};

						Users.create(user).then(result => {
							const payload = {
								login_token: result.id,
								user_type: result.user_type
							};
							var token = jwt.sign(payload, process.env.JWT_KEY); //ajay'; //jwt.sign(payload, process.env.JWT_KEY);
							console.log(token)
							Users.update({ 'access_token': token }, {
								where: { id: result.id, user_type: 3 }
							}).then(newresult => {
								result.access_token = token;
								if (result.subcategory == '') {
									var category = false
								} else {
									var category = true
								}
								if (result.otp == '') {
									var otpVerification = true
								} else {
									var otpVerification = false
								}

								var currdate = moment().format("YYYY");
								var template = new EmailTemplate(path.join(__dirname, '../../templates/', 'verification'));
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

									var verification_code = verifycode;
									var email_data = { currdate: currdate, verification_code: "http://"+req.headers.host+ "/verify_email?email_verification_code=" + verification_code };
									var locals = {
										custom: email_data
									};
									console.log("locals=========================", locals)
									template.render(locals, function (err, results) {
										if (err) {
											if (err) return next(err);
										} else {

											let mailOptions = {
												from: process.env.FROM_MAIL,
												to: reqBody.email,
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
								});


								res.status(HttpStatus.OK).send({
									status: true,
									reply: DM.ACCOUNT_REGISTER_SUCCESSFULLY,
									data: result,
									category: category,
									otpVerification: otpVerification,
									is_registered: true
								});
							}).catch(function (err) {
								return res.status(HttpStatus.OK).send({
									status: false,
									error: HttpStatus.getSotpExpDatetatusText(HttpStatus.OK),
									reply: err
								});
							});
						}).catch(function (err) {
							return res.status(HttpStatus.OK).send({
								status: false,
								error: HttpStatus.getStatusText(HttpStatus.OK),
								reply: err
							});
						});
					} else {
						if (userData1.fb_id == reqBody.fb_id) {
							var message = DM.ACCOUNT_ALREADY_EXIT;
						}
						return res.status(HttpStatus.OK).send({
							status: false,
							error: HttpStatus.getStatusText(HttpStatus.OK),
							reply: message,
						});
					}
				});
			} else {
				if (userData.email == reqBody.email) {
					var message = DM.EMAIL_EXISTS;
				}
				return res.status(HttpStatus.OK).send({
					status: false,
					error: HttpStatus.getStatusText(HttpStatus.OK),
					reply: message
				});
			}
		});
	}
});


/* POST users fb Login. */
router.post('/googleLogin', function (req, res, next) {
	var reqBody = req.body;
	reqBody.headers = req.headers;
	var headers = req.headers;
	if (reqBody.newUser == 0) {
		Users.count({
			where: { google_id: reqBody.google_id, user_type: 3, status: true }
		}).then(userCount => {
			if (userCount) {
				Users.findOne({
					where: { google_id: reqBody.google_id, user_type: 3, status: true },
					include: [
						{
							model: States,
							as: 'state_name',
							attributes: ['id', 'name'],
						},
						{
							model: Cities,
							as: 'city_name',
							attributes: ['id', 'name']
						}
					]
				}).then(userinfo => {
					if (userinfo) {
						console.log("------------------userinfo.isActive---------------", userinfo.isActive);
						if (userinfo.isActive) {
							Users.update({
								last_login: Date.now(),
								device_type: headers.device_type,
								device_id: headers.device_id,
								app_version: headers.app_version
							}, {
								where: { google_id: reqBody.google_id }
							}).then(update => {
								if (userinfo.subcategory == '') {
									var category = false
								} else {
									var category = true
								}
								if (userinfo.otp == '') {
									var otpVerification = true
								} else {
									var otpVerification = false
								}
								return res.status(HttpStatus.OK).send({
									status: true,
									is_registered: true,
									reply: DM.SUCCESSESSFULLY_LOGIN,
									data: userinfo,
									category: category,
									otpVerification: otpVerification
								});
							});
						} else {
							console.log("-----------false-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=");
							return res.status(HttpStatus.OK).send({
								status: false,
								error: HttpStatus.getStatusText(HttpStatus.OK),
								reply: DM.ACCOUNT_NOT_ACTIVE,
								otpVerification: false,
								category: "",
								userId: userinfo.id,
								mobileNo: userinfo.phone,
								deactivate: true
							});
						}
					} else {
						return res.status(HttpStatus.OK).send({
							status: false,
							error: HttpStatus.getStatusText(HttpStatus.OK),
							reply: DM.INVALID_LOGIN,
							is_registered: false
						});
					}
				});
			} else {
				return res.status(HttpStatus.OK).send({
					status: false,
					is_registered: false,
					reply: DM.USER_NOT_FOUND_THIS_ID,
				});
			}
		});
	} else {
		Users.findOne({
			where: { email: reqBody.email, user_type: 3, status: true },
			include: [
				{
					model: States,
					as: 'state_name',
					attributes: ['id', 'name'],
				},
				{
					model: Cities,
					as: 'city_name',
					attributes: ['id', 'name']
				}
			]
		}).then(userData => {
			console.log("USERDATA======>", userData);
			if (!userData) {
				Users.findOne({
					where: { google_id: reqBody.google_id, user_type: 3, status: true },

				}).then(userData1 => {
					if(!userData1){

						var randomObj = require("randomstring");
						var verifycode = randomObj.generate({
							length: 10,
							charset: 'alphanumeric',
							capitalization: 'uppercase'
						});

						console.log("=========>",reqBody);
						var user = {
							fname: reqBody.fname,
							lname: reqBody.lname,
							email: reqBody.email,
							phone: reqBody.phone,
							google_id: reqBody.google_id,
							//fb_image: reqBody.fb_image,
							//fb_link: reqBody.fb_link,
							latitude: reqBody.latitude,
							longitude: reqBody.longitude,
							user_type: 3,
							device_type: reqBody.headers.device_type,
							device_id: reqBody.headers.device_id,
							app_version: reqBody.headers.app_version,
							status: 1,
							isActive: 1,
							email_verification_code: verifycode,
							email_verified: 0
						};

						//console.log(user)

						Users.create(user).then(result => {
							const payload = {
								login_token: result.id,
								user_type: result.user_type
							};
							var token = jwt.sign(payload, process.env.JWT_KEY);

							Users.update({ 'access_token': token }, {
								where: { id: result.id, user_type: 3 }
							}).then(newresult => {
								result.access_token = token;
								if (result.subcategory == '') {
									var category = false
								} else {
									var category = true
								}
								if (result.otp == '') {
									var otpVerification = true
								} else {
									var otpVerification = false
								}

								var currdate = moment().format("YYYY");
								var template = new EmailTemplate(path.join(__dirname, '../../templates/', 'verification'));
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

									var verification_code = verifycode;
									var email_data = { currdate: currdate, verification_code: "http://"+req.headers.host+ "/verify_email?email_verification_code=" + verification_code };
									var locals = {
										custom: email_data
									};
									console.log("locals=========================", locals)
									template.render(locals, function (err, results) {
										if (err) {
											if (err) return next(err);
										} else {

											let mailOptions = {
												from: process.env.FROM_MAIL,
												to: reqBody.email,
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
								});



								res.status(HttpStatus.OK).send({
									status: true,
									reply: DM.ACCOUNT_REGISTER_SUCCESSFULLY,
									data: result,
									category: category,
									otpVerification: otpVerification,
									is_registered: true
								});
							}).catch(function (err) {

								return res.status(HttpStatus.OK).send({
									status: false,
									error: HttpStatus.getSotpExpDatetatusText(HttpStatus.OK),
									reply: err
								});
							});
						}).catch(function (err) {
							console.log(err)

							return res.status(HttpStatus.OK).send({
								status: false,
								error: HttpStatus.getStatusText(HttpStatus.OK),
								reply: err
							});
						});
					} else {
						if (userData1.google_id == reqBody.google_id) {
							var message = DM.ACCOUNT_ALREADY_EXIT;
						}
						return res.status(HttpStatus.OK).send({
							status: false,
							error: HttpStatus.getStatusText(HttpStatus.OK),
							reply: message
						});
					}
				});
			} else {
				if (userData.email == reqBody.email) {
					var message = DM.EMAIL_EXISTS;
				}
				return res.status(HttpStatus.OK).send({
					status: false,
					error: HttpStatus.getStatusText(HttpStatus.OK),
					reply: message
				});
			}
		});
	}
});



/*  Forgot Password  */
router.post('/forgotPassword', function (req, res, next) {
	var reqBody = req.body;
	var headers = req.headers;
	//console.log(reqBody)
	//console.log(process.env);
	Users.findOne(
		{
			where: { email: reqBody.email, user_type: 3, status: 1, isActive: 1 },
			attributes: ['id', 'fname', 'lname', 'fb_id', 'email', 'user_type', 'device_type', 'device_id']
		}).then(userData => {
			//console.log("USERDATA", userData); return;
			if (userData) {

				if (userData.fb_id == '') {
					var template = new EmailTemplate(path.join(__dirname, '../../templates/', 'customer_forget_password'));
					var newpass = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;
					var emailMessage = 'Hello ' + userData.fname + ' ' + userData.lname + ' <br> Your new password is "' + newpass + '"';
					//console.log(newpass);
					//console.log(emailMessage);
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
								console.log('err=========>', err);
								if (err) return next(err);
							} else {
								let mailOptions = {
									from: process.env.FROM_MAIL,
									to: userData.email,
									subject: 'Kupon Forgot Password',
									text: results.text,
									html: results.html // html body
								};
								// send mail with defined transport object
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
					//console.log(newpass)
					Users.update({ 'password': Newpassword }, {
						where: {
							id: userData.id,
							user_type: 3
						}
					}).then(result => {
						console.log('result============>', result);
						res.status(HttpStatus.OK).send({
							// error: HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR),
							status: true,
							reply: DM.CHECK_EMAIL_PASSWORD,
							data: { userInfo: userData }
						});
					}).catch((err) => {
						console.log('err============>', err);
						return res.status(HttpStatus.OK).send({
							status: false,
							reply: err
						});
					});
				} else {
					return res.status(HttpStatus.OK).send({
						status: false,
						error: 'ok',
						reply: DM.USE_FACEBOOK
					});
				}

			} else {
				return res.status(HttpStatus.OK).send({
					status: false,
					error: HttpStatus.getStatusText(HttpStatus.OK),
					reply: DM.NOT_ASSOCIATED_ACCOUNT
				});
			}
		});
});

/* POST Change Password. */
router.post('/changePassword', FUNC.apiAuth, function (req, res, next) {
	var postData = req.body;
	var oldpassword = postData.oldPassword;
	var newpassword = postData.newPassword;
	console.log(req.userData);
	console.log('sd');
	bcrypt.compare(oldpassword, req.userData.password, function (err, isMatched) {
		if (isMatched) {
			Users.update({
				password: bcrypt.hashSync(newpassword, 10)
			}, { where: { id: req.userData.id } })
				.then((done) => {
					return res.status(HttpStatus.OK).send({
						status: true,
						reply: DM.PASSWORD_CHANGED_SUCCESSFULLY
					});
				}).catch((err) => {
					return res.status(HttpStatus.OK).send({
						status: false,
						reply: err
					});
				});
		} else {
			return res.status(HttpStatus.OK).send({
				status: false,
				reply: DM.OLD_PASSWORD_DIFFERENT
			});
		}
	});
});

/*  Logout  */
router.post('/logout', FUNC.apiAuth, function (req, res, next) {
	Users.update({ device_id: "" },
		{
			where: { id: req.userData.id }
		}).then((update) => {
			return res.status(HttpStatus.OK).send({
				status: true,
				reply: DM.LOGOUT_SUCCESS
			});
		}).catch((err) => {
			return res.status(HttpStatus.OK).send({
				status: false,
				reply: err
			});
		});

});

/* POST all Category. */
router.post('/category', function (req, res, next) {
	var perPage = 10;
	var page = req.body.page || 1;
	Category.findAll({
		attributes: ['categories.*'],
		where: {
			status: true, isActive: true,
			id: { $notIn: JSON.parse("[10001]") },
		},
		limit: perPage, offset: (perPage * page) - perPage,
		order: [['name', 'ASC']],
		raw: true,
	}).then(catResult => {
		const subCatPromises = catResult.map(function (value, i) {
			return Subcategories.findAll({
				attributes: ['subcategories.*'],
				where: {
					categoryId: value.id, status: true, isActive: true,
					id: { $notIn: JSON.parse("[20001]") },
				},

				order: [['name', 'ASC']], raw: true,
			});
		});
		Promise.all(subCatPromises).then(subCats => {
			subCats.forEach((cat, catIndex) => {
				catResult[catIndex].subCategories = cat;
			});
			//console.log(process.env);
			Category.count({
				attributes: ['categories.*'],
				where: {
					status: true, isActive: true,
					id: { $notIn: JSON.parse("[10001]") },
				},
				order: [['name', 'ASC']],
				raw: true,
			}).then(count => {
				res.status(HttpStatus.OK).send({
					status: true,
					reply: 'Success',
					data: {
						'categories': catResult,
						'category_path': "http://"+req.headers.host+  '/uploads/cats/',
						'current': page,
						'pages': Math.ceil(count / perPage)
					}
				});
			});
		});
	}).catch(function (err) {
		return res.status(HttpStatus.OK).send({
			status: false,
			error: HttpStatus.getStatusText(HttpStatus.OK),
			reply: err
		});
	});
});

/* POST Subcategory by Category. */
router.post('/subcategory', FUNC.apiAuth, function (req, res, next) {
	var perPage = 10;
	var page = req.body.page || 1;

	Subcategories.findAll({
		attributes: ['subcategories.*'],
		where: { categoryId: req.body.categoryId, status: true, isActive: true },
		order: [['name', 'ASC']], raw: true
	}).then(catResult => {
		Subcategories.count({ where: { categoryId: req.body.categoryId, status: true, isActive: true } }).then(count => {
			res.status(HttpStatus.OK).send({
				status: true,
				reply: 'Success',
				data: { 'categories': catResult, 'current': page, 'pages': Math.ceil(count / perPage) }
			});
		});
	}).catch(function (err) {
		return res.status(HttpStatus.OK).send({
			status: false,
			error: HttpStatus.getStatusText(HttpStatus.OK),
			reply: err
		});
	});
});

/* POST Update Category. */
router.post('/updateCategory', FUNC.apiAuth, function (req, res, next) {
	var category = req.body.category;

	//var distanceInMiles = 1.60934 * 10; //miles * KM
	var distanceInMiles = 1.60934 * 6.2; //miles * KM
	if (category != '') {
		Users.update({
			subcategory: category
		}, { where: { id: req.body.id } })
			.then((done) => {
				var latitude = req.userData.latitude;
				var longitude = req.userData.longitude;
				/*
				 Welecome cupon code  start here
				*/
				/* 	Stores.findAll({
						 attributes: ['id', [sequelize.literal(' (6387.7 * acos ( '
							+ 'cos( radians(' + latitude + ') ) '
							+ '* cos( radians( `latitude` ) ) '
							+ '* cos( radians( `longitude` ) - radians(' + longitude + ') )'
							+ '+ sin( radians(' + latitude + ') )'
							+ '* sin( radians( `latitude` )))) '), 'distance'],],
						where: { isActive: 1, status: 1 },
						group: 'id',
						//having: { 'distance': { $lte: distanceInMiles } },
						//order: [['distance', 'ASC']],
					}).then(storeResult => {
						storeResult = JSON.parse(JSON.stringify(storeResult));
						storeResult.sort(function (a, b) { return a.distance - b.distance; });
						let storeids = storeResult.map(a => a.id);
						let storeIdInJoin = storeids.join("|");

						Coupons.findAll({
							where: {
								subcategoryId: { $in: JSON.parse("[" + req.userData.subcategory + "]") },
								//storeId: {$in: JSON.parse("[" + storeids + "]")},
							//	storeId: sequelize.literal(" CONCAT(  ',',  `storeId` ,  ',' ) REGEXP  ',(" + storeIdInJoin + "),' "),
								created_by:'admin',
								status: true,
								isActive: true,
								blockAdmin: false,
								start_date: { $lte: Date.now() },
								end_date: { $gte: Date.now() },
								//$or: [{ title: { $like: '%' + req.body.search + '%' } }]
							},
							group: 'coupons.id',
							//limit: perPage, offset: (perPage * page) - perPage,
							include: [
								{
									model: Subcategories,
									attributes: ['id', 'name']
								},
								{
									model: Users,
									attributes: [['user_image', 'store_image']]
								}
							],
							raw: true
						}).then(coupons => {
							console.log("------------------coupons", coupons);
							let couponsArr = [];
							let couponsDataArr = [];
							asyncFun.eachSeries(coupons, (element, callback) => {
								if (couponsArr.indexOf(element.id) === -1) {
									sequelize.query("SELECT stores.id ,stores.store_location ,stores.latitude ,stores.longitude ,stores.store_name,stores.store_name ,stores.street_address , stores.street_address , (6387.7 * acos ( cos( radians(" + latitude + ") ) * cos( radians( `latitude` ) ) * cos( radians( `longitude` ) - radians(" + longitude + ") )+ sin( radians(" + latitude + ") )* sin( radians( `latitude` )))) AS `distance` FROM `stores` AS `stores` WHERE `stores`.`isActive` = 1 AND `stores`.`status` = 1 AND id IN (" + JSON.parse("[" + element.storeId + "]") + ") GROUP BY `id` HAVING `distance` <= " + distanceInMiles + " ORDER BY `distance` ASC LIMIT 1",
										{ type: sequelize.QueryTypes.SELECT, raw: true, plain: true })
										.then(getStore => {
											if (getStore) {
												element['image'] = "thumb_" + element.image;
												element['store.id'] = getStore.id;
												element['store.store_location'] = getStore.store_location;
												element['store.latitude'] = getStore.latitude;
												element['store.longitude'] = getStore.longitude;
												element['store.store_name'] = getStore.store_name;
												element['store.distance'] = getStore.distance;
												couponsDataArr.push(element);
												couponsArr.push(element.id);
												callback();
											}
										})
								} else {
									callback();
								}
								console.log("couponsArr",couponsArr)
							}, (err) => {

							});

						}).catch(function (err) {
							console.log(err);
							return res.status(HttpStatus.OK).send({
								status: false,
								error: HttpStatus.getStatusText(HttpStatus.OK),
								reply: err
							});
						});
					}).catch(function (err) {
						console.log(" err======>", err);
						return res.status(HttpStatus.OK).send({
							status: true,
							reply: DM.CATEGORY_UPDATED
						});
					}); */
				/* Welcome cupon code end here */

				/*  */
				return res.status(HttpStatus.OK).send({
					status: true,
					reply: DM.CATEGORY_UPDATED
				});
			}).catch((err) => {
				console.log(err)
				return res.status(HttpStatus.OK).send({
					status: false,
					reply: err
				});
			});



	} else {
		return res.status(HttpStatus.OK).send({
			status: false,
			reply: DM.PLZ_SELECT_A_CATEGORY
		});
	}
});

/* POST all states. */
router.post('/states', function (req, res, next) {
	States.findAll({
		attributes: ['states.id', 'states.name'],
		order: [['name', 'ASC']],
		raw: true,
	}).then(states => {
		res.status(HttpStatus.OK).send({
			status: true,
			reply: 'Success',
			data: { 'states': states }
		});
	}).catch(function (err) {
		return res.status(HttpStatus.OK).send({
			status: false,
			error: HttpStatus.getStatusText(HttpStatus.OK),
			reply: err
		});
	});
});

/* POST Cities by State. */
router.post('/cities', function (req, res, next) {
	console.log(req.body)
	const stateId  = req.body.stateId;
	Cities.findAll({
		attributes: ['cities.*'],
		where: { state_id: stateId },
		order: [['name', 'ASC']],
		raw: true,
	}).then(cities => {
		res.status(HttpStatus.OK).send({
			status: true,
			reply: 'Success',
			data: { 'cities': cities }
		});
	}).catch(function (err) {
		return res.status(HttpStatus.OK).send({
			status: false,
			error: HttpStatus.getStatusText(HttpStatus.OK),
			reply: err
		});
	});
});

/* POST Update Profile. */
router.post('/updateProfile', FUNC.apiAuth, function (req, res, next) {
	var update = {
		fname: req.body.fname,
		lname: req.body.lname,
		dob: req.body.dob,
		gender: req.body.gender,
		city: req.body.city,
		state: req.body.state
	};

	if(typeof (req.file) != 'undefined') {
		update.user_image = req.file.filename;
	} else {
		update.user_image = req.body.profileImg;
	}
	console.log(update);
	Users.update(update, {
		where: { id: req.body.id, user_type: 3 }
	}).then(result => {
		Users.findOne({
			where: { id: req.body.id, user_type: 3 },
			include: [
				{
					model: States,
					as: 'state_name',
					attributes: ['id', 'name'],
				},
				{
					model: Cities,
					as: 'city_name',
					attributes: ['id', 'name']
				}
			]
		}).then(userinfo => {
			userinfo.profileimageurl = "http://"+req.headers.host+ '/uploads/business/';
			return res.status(HttpStatus.OK).send({
				status: true,
				reply: DM.PROFILE_UPDATED,
				data: userinfo,
				profileimageurl:"http://"+req.headers.host+ '/uploads/business/',
			});
		})
	}).catch(function (err) {
		console.log(err)
		return res.status(HttpStatus.OK).send({
			status: false,
			error: HttpStatus.getStatusText(HttpStatus.OK),
			reply: DM.SOMETHING_WENT_WRONG
		});
	});
	//});
});

/* POST Update Location */
router.post('/updateLocation', FUNC.apiAuth, function (req, res, next) {
	var update = {
		latitude: req.body.latitude,
		longitude: req.body.longitude
	};
	Users.update(update, {
		where: { id: req.body.id, user_type: 3 }
	}).then(result => {
		Users.findOne({
			where: { id: req.body.id, user_type: 3 },
			include: [
				{
					model: States,
					as: 'state_name',
					attributes: ['id', 'name'],
				},
				{
					model: Cities,
					as: 'city_name',
					attributes: ['id', 'name']
				}
			]
		}
		).then(userInfo => {
			return res.status(HttpStatus.OK).send({
				status: true,
				reply: DM.LOCATION_UPDATED,
				data: userInfo
			});
		}).catch(err => {
			return res.status(HttpStatus.OK).send({
				status: false,
				error: HttpStatus.getStatusText(HttpStatus.OK),
				reply: DM.SOMETHING_WENT_WRONG
			});
		});
	}).catch(function (err) {
		return res.status(HttpStatus.OK).send({
			status: false,
			error: HttpStatus.getStatusText(HttpStatus.OK),
			reply: DM.SOMETHING_WENT_WRONG
		});
	});
});


router.get('/fcmtest', function (req, res, next) {

	var FCM = require('fcm-push');

	var device_token = "dcs4VlB4TVqLaRR7aIjbRQ:APA91bF02j_f0jaSTKANQoWbP6D9ZQXCZxKnEYo_2wWx9cCo6qtXL0FaDIDKaFYgZNfgxvFa_nwQpjdPPo-7PTv8gIs55XWd_YZlSwni43J2UN4O1-AidS8AoGrJ98lHCR3cEZaG7h8p";

	var fcm = new FCM(process.env.FCM_KEY);


	var message1 = {
		data: {
			title: "out of server",
			body: "Out of server test",
			badge: 1,
			sound: "default",
			noti_type: "coupon",
			coupon_id: "1"
		},
		notification: {
			title: "out of server",
			body: "Out of server test",
			badge: 1,
			sound: "default",
			noti_type: "coupon",
			coupon_id: "1"
		},
		// to: 'coQexYqp3ZI:APA91bHTUhcWjTiz1Yz6C0C5iFhKVvVkQ8OlsEP8qHlU-xx1NcpX2iFXSEyBkcba6Pp0hNHSnuQJ2zyXgccXq0hCEe-GLk-asRiwWX_aPIV5K_TRdrBaG5laCl8W95KwvZhnJdHRSne3',
		collapse_key: 'applice',
		sound: 'default',
		delayWhileIdle: true,
		timeToLive: 3,

	};
	message1.to = device_token;
	fcm.send(message1, function (err, response) {
		if (err) {
			console.log("Something has gone wrong !", err);
		} else {
			console.log("Successfully sent with response :", response);
		}
	});


});
/* POST Coupons List by User. */
router.post('/coupons', FUNC.apiAuth, function (req, res, next) {

	console.log("CouponImageUrl===================", CouponImageUrl)
	var perPage = 10;
	var page = req.body.page || 1;
	var latitude = req.userData.latitude;
	var longitude = req.userData.longitude;
	//var distanceInMiles = 1.60934 * 10; //miles * KM
	//var distanceInMiles = 1.60934 * 4.2; //miles * KM

	var distanceInMiles = 1.60934 * 6.2; //10 km
	if (typeof req.body.search == 'undefined' || req.body.search == '') {
		req.body.search = '';
	} else {
		req.body.search = req.body.search;
	}
	Uninterested.findAll({
		where: { user_id: req.userData.id },
		attributes: ['couponId']
	}).then(UninterestedData => {
		let couponIds = UninterestedData.map(a => a.couponId);
		Redeemed.findAll({
			where: { userId: req.userData.id },
			attributes: ['couponId']
		}).then(InterestedData => {
			let IntcouponIds = InterestedData.map(a => a.couponId);
			console.log("couponIds================uninterested====", couponIds)
			console.log("couponIds================IntcouponIds====", IntcouponIds)
			console.log(couponIds.concat(IntcouponIds));
			let nemoveCouponsId = new Array();
			nemoveCouponsId = couponIds.concat(IntcouponIds)
			console.log("couponIds================removed====", nemoveCouponsId);
			Stores.findAll({
				attributes: ['id', [sequelize.literal(' (3959 * acos ( '
					+ 'cos( radians(' + latitude + ') ) '
					+ '* cos( radians( `latitude` ) ) '
					+ '* cos( radians( `longitude` ) - radians(' + longitude + ') )'
					+ '+ sin( radians(' + latitude + ') )'
					+ '* sin( radians( `latitude` )))) '), 'distance'],],

				where: { isActive: 1, status: 1 },
				group: 'id',
				having: { 'distance': { $lte: distanceInMiles} },
				//order: [['distance', 'ASC']],
			}).then(storeResult => {
				console.log(storeResult);
				storeResult = JSON.parse(JSON.stringify(storeResult));
				storeResult.sort(function (a, b) { return a.distance - b.distance; });
				let storeids = storeResult.map(a => a.id);
				let storeIdInJoin = storeids.join("|");

				console.log("req.userData###########", req.userData.welcome_coupon)
				var couponby;
				if ((req.userData.welcome_coupon)) {
					couponby = ['admin', 'business'];
				} else {
					couponby = ['business'];
				}

				Coupons.findAll({
					where: {
						subcategoryId: { $in: JSON.parse("[" + req.userData.subcategory + ",20001]") },
						//storeId: {$in: JSON.parse("[" + storeids + "]")},
						storeId: sequelize.literal(" CONCAT(  ',',  `storeId` ,  ',' ) REGEXP  ',(" + storeIdInJoin + "),' "),
						//created_by: couponby,
						id: { $notIn: JSON.parse("[" + nemoveCouponsId + "]") },
						//	id: { $notIn: JSON.parse("[" + IntcouponIds + "]") },
						status: true,
						isActive: true,
						blockAdmin: false,
						start_date: { $lte: Date.now() },
						end_date: { $gte: Date.now() },
						$or: [{ title: { $like: '%' + req.body.search + '%' } }]
					},
					group: 'coupons.id',
					order: [['id', 'DESC']],
					//limit: perPage, offset: (perPage * page) - perPage,
					include: [
						{
							model: Subcategories,
							attributes: ['id', 'name']
						},
						{
							model: Users,
							attributes: [['user_image', 'store_image']]
						}
					],
					raw: true
				}).then(coupons => {
					console.log("------------------coupons", coupons);
					let couponsArr = [];
					let couponsDataArr = [];
					asyncFun.eachSeries(coupons, (element, callback) => {
						if (couponsArr.indexOf(element.id) === -1) {
							//console.log()
							//(6387.7 * acos ( cos( radians(" + latitude + ") ) * cos( radians( `latitude` ) ) * cos( radians( `longitude` ) - radians(" + longitude + ") )+ sin( radians(" + latitude + ") )* sin( radians( `latitude` ))))
							//sequelize.query("SELECT stores.id ,stores.store_location ,stores.latitude ,stores.longitude ,stores.store_name,stores.store_name ,stores.street_address , stores.street_address , 0 AS `distance` FROM `stores` AS `stores` WHERE `stores`.`isActive` = 1 AND `stores`.`status` = 1 AND id IN (" + JSON.parse("[" + element.storeId + "]") + ") GROUP BY `id` HAVING `distance` <= " + distanceInMiles + " ORDER BY `distance` ASC LIMIT 1",
							sequelize.query("SELECT stores.id ,stores.store_location ,stores.latitude ,stores.longitude ,stores.store_name,stores.store_name ,stores.street_address , stores.street_address , (6387.7 * acos ( cos( radians(" + latitude + ") ) * cos( radians( `latitude` ) ) * cos( radians( `longitude` ) - radians(" + longitude + ") )+ sin( radians(" + latitude + ") )* sin( radians( `latitude` )))) AS `distance` FROM `stores` AS `stores` WHERE `stores`.`isActive` = 1 AND `stores`.`status` = 1 AND id IN (" + JSON.parse("[" + element.storeId + "]") + ") GROUP BY `id` HAVING `distance` <= " + distanceInMiles + " ORDER BY `distance` ASC LIMIT 1",
								{ type: sequelize.QueryTypes.SELECT, raw: true, plain: true })
								.then(getStore => {
									if (getStore) {
										element['image'] = element.image;
										element['store.id'] = getStore.id;
										element['store.store_location'] = getStore.store_location;
										element['store.latitude'] = getStore.latitude;
										element['store.longitude'] = getStore.longitude;
										element['store.store_name'] = getStore.store_name;
										element['store.distance'] = getStore.distance;
										if (element['created_by'] == "admin") {
											//console.log("element=================",element)
											var UserCreatedDate = moment(req.userData.createdAt);
											var cureent_date = moment().format("YYYY-MM-DD HH:MM");
											var isafter = moment(element.start_date).isAfter(UserCreatedDate);
											if (isafter) {
												var isafterforexpire = moment(element['end_date']).isAfter(UserCreatedDate);
												if (isafterforexpire) {
													//For IOS
													//element['end_date'] = moment(UserCreatedDate).add(24, 'hours');
													element['end_date'] = moment(element['start_date']).add(24, 'hours');

													console.log("after udrt current date")
													var isafterforexpire = moment(element['end_date']).isAfter(cureent_date);
													if (isafterforexpire) {
													couponsDataArr.push(element);
													couponsArr.push(element.id);
													}
												}
											} else {
												console.log("after udrt123 current date")
												element['start_date'] = UserCreatedDate;
												element['end_date'] = moment(UserCreatedDate).add(24, 'hours');
												element['current_date'] = cureent_date;
												var isafterforexpire = moment(element['end_date']).isAfter(cureent_date);
												if (isafterforexpire) {
													//element['title'] = "4" + element['title'];
													//	element['start_date'] = UserCreatedDate;
													//	element['end_date'] = moment(UserCreatedDate).add(24, 'hours');
													couponsDataArr.push(element);
													couponsArr.push(element.id);
												}

											}

										} else {
											var cureent_date = moment().format("YYYY-MM-DD");
											var isafter = moment(element.end_date).isAfter(cureent_date);
											if (isafter) {
												couponsDataArr.push(element);
												couponsArr.push(element.id);
											}

										}

										//var isafter = moment(checkSubscription.subscription_expire_date).isAfter(cureent_date);


										callback();
									} else {
										//console.log("else=========================",element)
										callback();
									}
								})
						}


					}, (err) => {

						console.log("befourcount=====================", couponsDataArr)
						Coupons.count({
							where: {
								subcategoryId: { $in: JSON.parse("[" + req.userData.subcategory + "]") },
								//storeId: {$in: JSON.parse("[" + storeids + "]")},
								id: { $notIn: JSON.parse("[" + nemoveCouponsId + "]") },
								status: true,
								isActive: true,
								blockAdmin: false,
								start_date: { $lte: Date.now() },
								end_date: { $gte: Date.now() },
								//title: {$like: '%' + req.body.search + '%'}
								$or: [{ title: { $like: '%' + req.body.search + '%' } }]
							},
							//limit: perPage, offset: (perPage * page) - perPage,
							raw: true
						}).then(count => {
							//console.log("couponsDataArr====",couponsDataArr)
							console.log("sdfsdfsdffinel=====================")
							return res.status(HttpStatus.OK).send({
								status: true,
								reply: 'Success',
								data: {
									'coupons': couponsDataArr,
									'store_image_url': "http://"+req.headers.host+ '/uploads/business/',
									'coupon_image_url': "http://"+req.headers.host+ '/uploads/coupons/',
									//'coupon_image_url': CouponImageUrl,
									'default_image_url': "http://"+req.headers.host+ '/uploads/def_cat/',
									'current': page,
									'pages': Math.ceil(count / perPage)
								}
							});
						});
					});
					console.log("fffffsddddddddddddddddddddddddddddddddddd", couponsDataArr.length)
				}).catch(function (err) {
					console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%1", err);
					return res.status(HttpStatus.OK).send({
						status: false,
						error: HttpStatus.getStatusText(HttpStatus.OK),
						reply: err
					});
				});
			}).catch(function (err) {
				console.log(" err======>", err);
				return res.status(HttpStatus.OK).send({
					status: false,
					error: HttpStatus.getStatusText(HttpStatus.OK),
					reply: err
				});
			});
		}).catch(err => {
			console.log("$$$$$$$$$$$$$$$$$$$$$$$32", err);
			return res.status(HttpStatus.OK).send({
				status: false,
				error: HttpStatus.getStatusText(HttpStatus.OK),
				reply: err
			});
		});
	}).catch(err => {
		console.log("$$$$$$$$$$$$$$$$$$$$$$$32", err);
		return res.status(HttpStatus.OK).send({
			status: false,
			error: HttpStatus.getStatusText(HttpStatus.OK),
			reply: err
		});
	});
});

/* POST Coupon Detail by Coupon. */
router.post('/couponDetail', FUNC.apiAuth, function (req, res, next) {
	var curTime = moment().format("YYYY-MM-DD HH:mm");
	var latitude = req.userData.latitude;
	var longitude = req.userData.longitude;
	//var distanceInMiles = 1.60934 * 10; //miles * KM
	var distanceInMiles = 15; //miles * KM
	var location = "";
	var noStoreMsg = DM.NO_STORE_YOUR_LOCATION;
	Coupons.findOne({
		//, end_date: {$gte: curTime}  -- removed by muk - 23-4-2019
		where: { id: req.body.couponId, blockAdmin: false, isActive: true, status: true, start_date: { $lte: curTime } },
		include: [
			{
				model: Category,
				attributes: ['id', 'icon', 'name'],
			},
			{
				model: Subcategories,
				attributes: ['id', 'name']
			},
			{
				model: Users,
				attributes: [['user_image', 'store_image']]
			}
		],
		//raw:true
	}).then(async (couponInfo) => {
		if (couponInfo != null) {
			var endDate = moment(couponInfo.end_date).format("YYYY-MM-DD HH:mm");
			if (couponInfo.created_by == 'admin') {
				couponInfo.coupon_duration = 24;


				//console.log("element=================",element)
				var currentUserDate = moment(req.userData.createdAt);
				var cureent_date = moment().format("YYYY-MM-DD HH:MM");
				var isafter = moment(couponInfo.start_date).isAfter(currentUserDate);
				if (!isafter) {


					couponInfo['start_date'] = currentUserDate;
					couponInfo['end_date'] = moment(currentUserDate).add(24, 'hours');
					couponInfo['current_date'] = cureent_date;


				}



			}
			var currentStatus = true;
			var currentStatusMsg = DM.COUPON_EXPIRED;

			var getStore = await sequelize.query("SELECT stores.id ,stores.store_location ,stores.latitude ,stores.longitude,stores.store_name ,stores.store_name ,stores.street_address ,stores.street_address ,stores.town_city, stores.town_city, (6387.7 * acos ( cos( radians(" + latitude + ") ) * cos( radians( `latitude` ) ) * cos( radians( `longitude` ) - radians(" + longitude + ") )+ sin( radians(" + latitude + ") )* sin( radians( `latitude` )))) AS `distance` FROM `stores` AS `stores` WHERE `stores`.`isActive` = 1 AND `stores`.`status` = 1 AND id IN (" + JSON.parse("[" + couponInfo.storeId + "]") + ") GROUP BY `id` HAVING `distance` <= " + distanceInMiles + " ORDER BY `distance` ASC LIMIT 1",
				{ type: sequelize.QueryTypes.SELECT, raw: true, plain: true });
			if (getStore) {
				let store = JSON.parse(JSON.stringify({
					id: getStore.id,
					store_location: getStore.store_location,
					latitude: getStore.latitude,
					longitude: getStore.longitude,
					store_name: getStore.store_name,
					street_address: getStore.street_address,
					town_city: getStore.town_city,
				}));
				couponInfo.setDataValue('store', store);

				location = (store.street_address || store.town_city) ? store.street_address + " " + store.town_city : store.store_location;
			} else {
				location = "";
			}
			if (curTime >= endDate) {
				currentStatus = false;
			}

			Interested.findOne({
				where: {
					couponId: couponInfo.id,
					user_id: req.userData.id
				}
			}).then(getIntrested => {
				var encodeCoupon = (getIntrested != null) ? getIntrested.coupon_code : '';
				var interestedCount = (getIntrested != null) ? 1 : 0;
				Uninterested.count({
					where: {
						couponId: couponInfo.id,
						user_id: req.userData.id
					}
				}).then(uninterestedCount => {
					res.status(HttpStatus.OK).send({
						status: true,
						reply: 'Success',
						data: {
							'couponInfo': couponInfo, interested: interestedCount, uninterested: uninterestedCount, encodeCoupon, currentStatus, currentStatusMsg, location, noStoreMsg,
							'store_image_url': "http://"+req.headers.host+ '/uploads/business/',
							'coupon_image_url': "http://"+req.headers.host+ '/uploads/coupons/',
							//'coupon_image_url': CouponImageUrl,
							'default_image_url': "http://"+req.headers.host+ '/uploads/def_cat/'
						}
					});
				});
			});
		} else {
			res.status(HttpStatus.OK).send({
				status: false,
				reply: DM.COUPON_EXPIRED,
				data: {}
			});
		}
	}).catch(function (err) {
		console.log(" err======>", err);
		return res.status(HttpStatus.OK).send({
			status: false,
			error: HttpStatus.getStatusText(HttpStatus.OK),
			reply: err
		});
	});
});

/* POST Deals List by User. */
router.post('/deals', FUNC.apiAuth, function (req, res, next) {
	var perPage = 100;
	var page = req.body.page || 1;
	var offset = (perPage * page) - perPage;
	var latitude = req.userData.latitude;
	var longitude = req.userData.longitude;
	//var distanceInMiles = 1.60934 * 20; //miles * KM
	var distanceInMiles = 1.60934 * 12.4; //miles * KM
	var curTime = moment().format("YYYY-MM-DD HH:mm");
	var subCat = JSON.parse("[" + req.userData.subcategory + "]");
	sequelize.query("SELECT T.* FROM ( SELECT stores.store_name,stores.store_location,stores.store_manager,stores.store_email,stores.street_address ,stores.town_city,stores.latitude,stores.longitude, ( 6387.7 * acos( cos( radians(" + latitude + ") ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(" + longitude + ") ) + sin( radians(" + latitude + ") ) * sin( radians( latitude ) ) ) ) as distance, deals.title as dealTitle,deals.description as dealDescription, deals.isSpecial, deals.createdAt as deCr, deals.createdAt as deUp, deals.id as dealId, deals.original_price, deals.final_price, deals.discount,deals.image,  deals.subcategoryId, deals.start_date as dealStartDate, deals.end_date as dealEndDate, subcategories.name as subcatname FROM stores RIGHT JOIN deals ON deals.userId = stores.userId LEFT JOIN subcategories ON subcategories.id = deals.subcategoryId WHERE stores.status = 1 AND stores.isActive = 1  AND deals.status = 1 AND deals.isActive = 1 AND deals.subcategoryId IN(" + subCat + ") AND deals.blockAdmin = 0 AND deals.start_date <= '" + curTime + "' AND deals.end_date >= '" + curTime + "' AND ( 6387.7 * acos( cos( radians(" + latitude + ") ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(" + longitude + ") ) + sin( radians(" + latitude + ") ) * sin( radians( latitude ) ) ) ) < " + distanceInMiles + " order by distance ) T GROUP BY T.dealId LIMIT " + offset + ", " + perPage + "",
		{ type: sequelize.QueryTypes.SELECT })
		.then(async getDeals => {
			if (getDeals.length) {
				for (var index = 0; index < getDeals.length; index++) {
					var element = getDeals[index];

					/*New code start */
					console.log('deal=================', element.dealId)
					deal = await sequelize.query("SELECT stores.store_name,stores.store_location,stores.store_manager,stores.store_email,stores.street_address ,stores.town_city,stores.latitude,stores.longitude,( 6387.7 * acos( cos( radians(" + latitude + ") ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(" + longitude + ") ) + sin( radians(" + latitude + ") ) * sin( radians( latitude ) ) ) )	as distance  FROM stores  RIGHT JOIN deals ON deals.userId = stores.userId  where deals.id = " + element.dealId + " and stores.status = 1 AND stores.isActive = 1  having distance < 19.955816000000002 order by distance ASC 	limit 0,1", { type: sequelize.QueryTypes.SELECT });
					/* New code end */
					console.log('deal=================', deal)
					getDeals[index].title = element.dealTitle;
					getDeals[index].image = element.image;
					getDeals[index].description = element.dealDescription;
					getDeals[index].store_name = element.store_name;
					//getDeals[index].location = '';
					getDeals[index].start_date = element.dealStartDate;
					getDeals[index].end_date = element.dealEndDate;
					getDeals[index].createdAt = element.deCr;
					getDeals[index].updatedAt = element.deUp;
					getDeals[index]['subcategory.name'] = element.subcatname;

					if (deal.length) {
						getDeals[index].latitude = deal[0].latitude;
						getDeals[index].longitude = deal[0].longitude;
						getDeals[index].location = deal[0].street_address + ' ' + deal[0].town_city;
						getDeals[index].street_address = deal[0].street_address;
						getDeals[index].store_location = deal[0].store_location;

					}


				}
				console.log("--getDeals", getDeals);
				res.status(HttpStatus.OK).send({
					status: true,
					reply: 'Success',
					data: {
						'deals': getDeals,
						'current': page,
						'deal_image_url': "http://"+req.headers.host+ '/uploads/deals/',
						//'deal_image_url': DealImageUrl,
						'default_image_url': "http://"+req.headers.host+ '/uploads/def_cat/',
						'pages': Math.ceil(getDeals.length / perPage)
					}
				});
			} else {
				res.status(HttpStatus.OK).send({
					status: true,
					reply: 'Success',
					data: {
						'deals': [],
						'current': page,
						'deal_image_url': "http://"+req.headers.host+ '/uploads/deals/',
						//'deal_image_url': DealImageUrl,
						'default_image_url': "http://"+req.headers.host+  '/uploads/def_cat/',
						'pages': 0
					}
				});
			}
		}).catch(function (err) {
			console.log(" err======>", err);
			return res.status(HttpStatus.OK).send({
				status: false,
				error: HttpStatus.getStatusText(HttpStatus.OK),
				reply: err
			});
		});
});

/* POST Deal Detail by User. */
router.post('/dealDetail', FUNC.apiAuth, function (req, res, next) {
	Deals.findOne({
		where: { id: req.body.dealId, blockAdmin: false, isActive: true, status: true },
		include: [
			{
				model: Category,
				attributes: ['id', 'icon', 'name'],
			},
			{
				model: Subcategories,
				attributes: ['id', 'name']
			}
		]
	}).then(dealInfo => {
		res.status(HttpStatus.OK).send({
			status: true,
			reply: 'Success',
			data: { 'dealInfo': dealInfo }
		});
	}).catch(function (err) {
		console.log(" err======>", err);
		return res.status(HttpStatus.OK).send({
			status: false,
			error: HttpStatus.getStatusText(HttpStatus.OK),
			reply: err
		});
	});
});

/* POST Coupon Not interested by User. */
router.post('/notInterest', FUNC.apiAuth, function (req, res, next) {
	Uninterested.count({ where: { user_id: req.userData.id, couponId: req.body.couponId } }).then(count => {
		if (count) {
			res.status(HttpStatus.OK).send({
				status: true,
				reply: DM.COUPON_ALREADY_NOT_INTERESTED,
			});
		} else {
			var data = {
				user_id: req.userData.id,
				couponId: req.body.couponId
			};
			Uninterested.create(data).then(result => {
				res.status(HttpStatus.OK).send({
					status: true,
					reply: DM.COUPON_NOT_INTERESTED
				});
			});
		}
	}).catch(err => {
		console.log(" err======>", err);
		return res.status(HttpStatus.OK).send({
			status: false,
			error: HttpStatus.getStatusText(HttpStatus.OK),
			reply: err
		});
	});
});

/* POST Remove Not interested Coupon from list. */
router.post('/removeNotInterest', FUNC.apiAuth, function (req, res, next) {
	Uninterested.destroy({ where: { user_id: req.userData.id, couponId: req.body.couponId } }).then(count => {
		return res.status(HttpStatus.OK).send({
			status: true,
			reply: 'success'
		});
	}).catch(err => {
		console.log(" err======>", err);
		return res.status(HttpStatus.OK).send({
			status: false,
			error: HttpStatus.getStatusText(HttpStatus.OK),
			reply: err
		});
	});
});

/* POST Coupon Not interested List. */
router.post('/notInterestList', FUNC.apiAuth, function (req, res, next) {
	var perPage = 10;
	var page = req.body.page || 1;
	var latitude = req.userData.latitude;
	var longitude = req.userData.longitude;
	var noStoreMsg = DM.NO_STORE_YOUR_LOCATION;
	Uninterested.findAll({
		where: { user_id: req.userData.id },
		include: [
			{
				model: Coupons,
				attributes: ['id', 'image', 'storeId', 'max_users', 'discount', 'original_price', 'final_price', 'start_date', 'end_date', 'coupon_duration', 'isSpecial', 'isActive', 'title', 'description', 'items', 'created_by'],
				include: [
					{
						model: Users,
						attributes: [['user_image', 'store_image']]
					},
					{
						model: Subcategories,
						attributes: ['id', 'name']
					}
				]
			}
		],
		limit: perPage, offset: (perPage * page) - perPage,
		raw: true
	}).then(UninterestedData => {
		console.log("-----------UninterestedData", UninterestedData);
		//var distanceInMiles = 1.60934 * 10; //miles * KM
		var distanceInMiles = 1.60934 * 6.2; //miles * KM
		asyncFun.eachSeries(UninterestedData, (element, callback) => {
			if (element['coupon.created_by'] == "admin") {
				console.log("element=================", element)
				var currentUserDate = moment(req.userData.createdAt);
				element['coupon.start_date'] = currentUserDate;
				element['coupon.end_date'] = moment(currentUserDate).add(24, 'hours');
			}
			if(element['coupon.storeId'] != null){
			sequelize.query("SELECT stores.id ,stores.store_location ,stores.latitude ,stores.longitude,stores.store_name ,stores.store_name ,stores.street_address ,stores.street_address ,stores.town_city, (6387.7 * acos ( cos( radians(" + latitude + ") ) * cos( radians( `latitude` ) ) * cos( radians( `longitude` ) - radians(" + longitude + ") )+ sin( radians(" + latitude + ") )* sin( radians( `latitude` )))) AS `distance` FROM `stores` AS `stores` WHERE `stores`.`isActive` = 1 AND `stores`.`status` = 1 AND id IN (" + JSON.parse("[" + element["coupon.storeId"] + "]") + ") GROUP BY `id` HAVING `distance` <= " + distanceInMiles + " ORDER BY `distance` ASC LIMIT 1",
				{
					type: sequelize.QueryTypes.SELECT, raw: true, plain: true
				}).then(getStore => {
					if (getStore) {
						element["coupon.store.id"] = getStore.id;
						element["coupon.store.store_location"] = getStore.store_location;
						element["coupon.store.latitude"] = getStore.latitude;
						element["coupon.store.longitude"] = getStore.longitude;
						element["coupon.store.store_name"] = getStore.store_name;
						element["coupon.store.street_address"] = getStore.street_address;
						element["coupon.store.town_city"] = getStore.town_city;
						element["coupon.store.distance"] = getStore.distance;
						callback();
					} else {
						element["noStoreMsg"] = noStoreMsg;
						callback();
					}
				})
		}
		}, (err) => {
			Uninterested.count({
				where: { user_id: req.userData.id },
				limit: perPage, offset: (perPage * page) - perPage,
				raw: true
			}).then(count => {
				res.status(HttpStatus.OK).send({
					status: true,
					reply: 'Success',
					data: {
						'coupons': UninterestedData,
						'current': page,
						'store_image_url': "http://"+req.headers.host+ '/uploads/business/',
						'coupon_image_url': "http://"+req.headers.host+ '/uploads/coupons/',
						//'coupon_image_url': CouponImageUrl,
						'default_image_url': "http://"+req.headers.host+ '/uploads/def_cat/',
						'pages': Math.ceil(count / perPage)
					}
				});
			});
		});
	}).catch(function (err) {
		console.log(" err======>", err);
		return res.status(HttpStatus.OK).send({
			status: false,
			error: HttpStatus.getStatusText(HttpStatus.OK),
			reply: err
		});
	});
});

/* POST Coupon interested by User. */
router.post('/couponInterest', FUNC.apiAuth, async function (req, res, next) {
	if (req.body.uninterested) {
		await Uninterested.destroy({ where: { user_id: req.userData.id, couponId: req.body.couponId } });
	}
	Interested.count({ where: { user_id: req.userData.id, couponId: req.body.couponId } }).then(count => {
		if (count) {
			res.status(HttpStatus.OK).send({
				status: true,
				reply: DM.COUPON_ALREADY_INTERESTED
			});
		} else {
			var couponKeyCode = FUNC.getUnqiueString();
			var data = {
				user_id: req.userData.id,
				couponId: req.body.couponId,
				coupon_code: couponKeyCode
			};
			Interested.create(data).then(result => {
				res.status(HttpStatus.OK).send({
					status: true,
					reply: 'Success',
					encodeCoupon: couponKeyCode
				});
			});
		}
	}).catch(err => {
		console.log(" err======>", err);
		return res.status(HttpStatus.OK).send({
			status: false,
			error: HttpStatus.getStatusText(HttpStatus.OK),
			reply: err
		});
	});
});

/* POST Coupon interested List. */
router.post('/interestList', FUNC.apiAuth, function (req, res, next) {
	var perPage = 10;
	var page = req.body.page || 1;
	var latitude = req.userData.latitude;
	var longitude = req.userData.longitude;
	var noStoreMsg = DM.NO_STORE_YOUR_LOCATION;
	Interested.findAll({
		where: { user_id: req.userData.id },
		include: [
			{
				model: Coupons,
				attributes: ['id', 'image', 'storeId', 'max_users', 'discount', 'original_price', 'final_price', 'start_date', 'end_date', 'coupon_duration', 'isSpecial', 'isActive', 'title', 'description', 'items', 'created_by'],
				include: [
					{
						model: Users,
						attributes: [['user_image', 'store_image']]
					},
					{
						model: Subcategories,
						attributes: ['id', ['name', 'name']]
					}
				]
			}
		],
		limit: perPage, offset: (perPage * page) - perPage,
		raw: true
	}).then(InterestedData => {
		//var distanceInMiles = 1.60934 * 10; //miles * KM
		var distanceInMiles = 1.60934 * 6.2; //miles * KM
		asyncFun.eachSeries(InterestedData, (element, callback) => {
			if (element['coupon.created_by'] == "admin") {
				console.log("element=================", element)
				var currentUserDate = moment(req.userData.createdAt);
				element['coupon.start_date'] = currentUserDate;
				element['coupon.end_date'] = moment(currentUserDate).add(24, 'hours');
			}
			sequelize.query("SELECT stores.id ,stores.store_location ,stores.latitude ,stores.longitude,stores.store_name ,stores.store_name ,stores.street_address ,stores.street_address ,stores.town_city, (6387.7 * acos ( cos( radians(" + latitude + ") ) * cos( radians( `latitude` ) ) * cos( radians( `longitude` ) - radians(" + longitude + ") )+ sin( radians(" + latitude + ") )* sin( radians( `latitude` )))) AS `distance` FROM `stores` AS `stores` WHERE `stores`.`isActive` = 1 AND `stores`.`status` = 1 AND id IN (" + JSON.parse("[" + element["coupon.storeId"] + "]") + ") GROUP BY `id` HAVING `distance` <= " + distanceInMiles + " ORDER BY `distance` ASC LIMIT 1",
				{
					type: sequelize.QueryTypes.SELECT, raw: true, plain: true
				}).then(getStore => {
					if (getStore) {
						element["coupon.store.id"] = getStore.id;
						element["coupon.store.store_location"] = getStore.store_location;
						element["coupon.store.latitude"] = getStore.latitude;
						element["coupon.store.longitude"] = getStore.longitude;
						element["coupon.store.store_name"] = getStore.store_name;
						element["coupon.store.street_address"] = getStore.street_address;
						element["coupon.store.town_city"] = getStore.town_city;
						element["coupon.store.distance"] = getStore.distance;
						callback();
					} else {
						element["noStoreMsg"] = noStoreMsg;
						callback();
					}
				})
		}, (err) => {
			Interested.count({
				where: { user_id: req.userData.id },
				limit: perPage, offset: (perPage * page) - perPage,
				raw: true
			}).then(count => {
				console.log("InterestedData=================", InterestedData)
				res.status(HttpStatus.OK).send({
					status: true,
					reply: 'Success',
					data: {
						'coupons': InterestedData,
						'current': page,
						'store_image_url': "http://"+req.headers.host+ '/uploads/business/',
						'coupon_image_url': "http://"+req.headers.host+ '/uploads/coupons/',
						//'coupon_image_url': CouponImageUrl,
						'default_image_url': "http://"+req.headers.host+ '/uploads/def_cat/',
						'pages': Math.ceil(count / perPage)
					}
				});
			});
		});
	}).catch(function (err) {
		console.log(" err======>", err);
		return res.status(HttpStatus.OK).send({
			status: false,
			error: HttpStatus.getStatusText(HttpStatus.OK),
			reply: err
		});
	});
});

/* POST Send Report  */
router.post('/sendReport', FUNC.apiAuth, function (req, res, next) {
	var report = {
		subject: req.body.subject,
		message: req.body.message,
		user_type: 3,
		user_id: req.userData.id
	};
	Reports.create(report).then(result => {

		res.status(HttpStatus.OK).send({
			status: true,
			reply: DM.REPORT_SEND_SUCCESSFULLY
		});

		var template = new EmailTemplate(path.join(__dirname, '../../templates/', 'business_complain'));
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
			var uname = req.userData.fname + ' ' + req.userData.lname;
			var locals = {
				custom: {
					user_name: uname,current_year:moment().format('YYYY'),
					business_url:process.env.BUSINESS_URL,
					email: req.userData.email,
					subject: req.body.subject,
					message: req.body.message
				}
			};
			template.render(locals, function (err, results) {
				if (err) {
					if (err) return next(err);
				} else {

					let mailOptions = {
						from: process.env.FROM_MAIL,
						to: process.env.ADMIN_EMAIL,
						subject: 'Complain by User',
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

	}).catch(function (err) {
		console.log(" err======>", err);
		return res.status(HttpStatus.OK).send({
			status: false,
			error: HttpStatus.getStatusText(HttpStatus.OK),
			reply: err
		});
	});
});

/* POST Send Report  */
router.post('/sendCouponReport', FUNC.apiAuth, function (req, res, next) {
	var report = {
		subject: req.body.subject,
		message: req.body.message,
		coupon_id : req.body.couponId,
		user_type: 3,
		user_id: req.userData.id
	};
	Reports.create(report).then(result => {

		res.status(HttpStatus.OK).send({
			status: true,
			reply: DM.REPORT_SEND_SUCCESSFULLY
		});

		var template = new EmailTemplate(path.join(__dirname, '../../templates/', 'business_complain'));
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
			var uname = req.userData.fname + ' ' + req.userData.lname;
			var locals = {
				custom: {
					user_name: uname,current_year:moment().format('YYYY'),
					business_url:process.env.BUSINESS_URL,
					email: req.userData.email,
					subject: req.body.subject,
					message: req.body.message
				}
			};
			template.render(locals, function (err, results) {
				if (err) {
					if (err) return next(err);
				} else {

					let mailOptions = {
						from: process.env.FROM_MAIL,
						to: process.env.ADMIN_EMAIL,
						subject: 'Complain by User',
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

	}).catch(function (err) {
		console.log(" err======>", err);
		return res.status(HttpStatus.OK).send({
			status: false,
			error: HttpStatus.getStatusText(HttpStatus.OK),
			reply: err
		});
	});
});

/**
 * start function to rating of coupon by user 19/01/2020
 *
*/

router.post('/ratingCoupon', FUNC.apiAuth, function (req, res, next) {

	CouponRating.findAll({
		attributes: ['id'],
		where: { coupon_id : req.body.couponId, user_type: 3, user_id: req.userData.id },
	}).then(couponRatingCount => {
		if(couponRatingCount.length > 0){
			return res.status(HttpStatus.OK).send({
				status: false,
				error: HttpStatus.getStatusText(HttpStatus.OK),
				reply: DM.COUPON_ALREADY_RATED,
			});
		}else{
			var couponRating = {
				//message: req.body.feedback,
				coupon_id : req.body.couponId,
				user_type: 3,
				user_id: req.userData.id,
				rating: req.body.rating,
			};
			CouponRating.create(couponRating).then(result => {
				res.status(HttpStatus.OK).send({
					status: true,
					reply: DM.RATING_SUCCESSFULLY,
				});
			}).catch(function (err) {
				console.log(" err======>", err);
				return res.status(HttpStatus.OK).send({
					status: false,
					error: HttpStatus.getStatusText(HttpStatus.OK),
					reply: err
				});
			});
		}
		console.log('sddfsfsdfsdf  '+couponRatingCount.length);
	}).catch(function (err) {
		return res.status(HttpStatus.OK).send({
			status: false,
			error: HttpStatus.getStatusText(HttpStatus.OK),
			reply: err
		});
	});

	/**/
});

/**
 * start function to rating of coupon by user 19/01/2020
 *
*/



/**
 * start function to rating of store by user 19/01/2020
 *
*/

router.post('/ratingStore', FUNC.apiAuth, function (req, res, next) {

	StoreRating.findAll({
		attributes: ['id'],
		where: { coupon_id : req.body.couponId, storeId : req.body.storeId, user_type: 3, user_id: req.userData.id },
	}).then(storeRatingCount => {
		if(storeRatingCount.length > 0){
			return res.status(HttpStatus.OK).send({
				status: false,
				error: HttpStatus.getStatusText(HttpStatus.OK),
				reply: DM.STORE_ALREADY_RATED,
			});
		}else{
			var storeRating = {
				//message: req.body.feedback,
				coupon_id : req.body.couponId,
				storeId : req.body.storeId,
				user_type: 3,
				user_id: req.userData.id,
				rating: req.body.rating,
			};
			StoreRating.create(storeRating).then(result => {
				res.status(HttpStatus.OK).send({
					status: true,
					reply: DM.RATING_SUCCESSFULLY,
				});
			}).catch(function (err) {
				console.log(" err======>", err);
				return res.status(HttpStatus.OK).send({
					status: false,
					error: HttpStatus.getStatusText(HttpStatus.OK),
					reply: err
				});
			});
		}
	}).catch(function (err) {
		console.log(err)
		return res.status(HttpStatus.OK).send({
			status: false,
			error: HttpStatus.getStatusText(HttpStatus.OK),
			reply: err
		});
	});

	/**/
});

router.post('/ratingStoreCoupon', FUNC.apiAuth, function (req, res, next) {
	StoreRating.findAll({
		attributes: ['id'],
		where: { coupon_id : req.body.couponId, storeId : req.body.storeId, user_type: 3, user_id: req.userData.id },
	}).then(storeRatingCount => {
		if(storeRatingCount.length > 0){
			return res.status(HttpStatus.OK).send({
				status: false,
				error: HttpStatus.getStatusText(HttpStatus.OK),
				reply: DM.STORE_ALREADY_RATED,
			});
		}else{
			var storeRating = {
				//message: req.body.feedback,
				coupon_id : req.body.couponId,
				storeId : req.body.storeId,
				user_type: 3,
				user_id: req.userData.id,
				rating: req.body.rating,
			};
			StoreRating.create(storeRating).then(result => {
				CouponRating.findAll({
					attributes: ['id'],
					where: { coupon_id : req.body.couponId, user_type: 3, user_id: req.userData.id },
				}).then(couponRatingCount => {
					if(couponRatingCount.length > 0){
						return res.status(HttpStatus.OK).send({
							status: false,
							error: HttpStatus.getStatusText(HttpStatus.OK),
							reply: DM.COUPON_ALREADY_RATED,
						});
					}else{
						var couponRating = {
							//message: req.body.feedback,
							coupon_id : req.body.couponId,
							user_type: 3,
							user_id: req.userData.id,
							rating: req.body.rating,
						};
						CouponRating.create(couponRating).then(result => {
							res.status(HttpStatus.OK).send({
								status: true,
								reply: DM.RATING_SUCCESSFULLY,
							});
						}).catch(function (err) {
							console.log(" err======>", err);
							return res.status(HttpStatus.OK).send({
								status: false,
								error: HttpStatus.getStatusText(HttpStatus.OK),
								reply: err
							});
						});
					}
				}).catch(function (err) {
					return res.status(HttpStatus.OK).send({
						status: false,
						error: HttpStatus.getStatusText(HttpStatus.OK),
						reply: err
					});
				});
			}).catch(function (err) {
				console.log(" err======>", err);
				return res.status(HttpStatus.OK).send({
					status: false,
					error: HttpStatus.getStatusText(HttpStatus.OK),
					reply: err
				});
			});
		}
	}).catch(function (err) {
		console.log(err)
		return res.status(HttpStatus.OK).send({
			status: false,
			error: HttpStatus.getStatusText(HttpStatus.OK),
			reply: err
		});
	});

	/**/
});


/**
 * start function to rating of store by user 19/01/2020
 *
*/



/* POST Notifications List. */
router.post('/notificationsList', FUNC.apiAuth, function (req, res, next) {
	var perPage = 10;
	var page = req.body.page || 1;
	var offset = (perPage * page) - perPage;
	sequelize.query("SELECT notifications_status.*, `user`.`fname` AS `user.fname`, `user`.`lname` AS `user.lname`, `user`.`user_image` AS `user.user_image` FROM `notifications_status` AS `notifications_status` LEFT OUTER JOIN `users` AS `user` ON `notifications_status`.`userId` = `user`.`id` WHERE read_status = 0 AND notifications_status.userId=:id ORDER BY `notifications_status`.`id` DESC LIMIT " + offset + ", " + perPage + "", { replacements: { id: req.userData.id } },
		{ type: sequelize.QueryTypes.SELECT, mapToModel: true })
		.spread(notificationData => {
			console.log("---notificationData", notificationData);
			sequelize.query("SELECT id FROM `notifications_status` AS `notifications` WHERE read_status=0 AND user_id=:id", { replacements: { id: req.userData.id } },
				{ type: sequelize.QueryTypes.SELECT, mapToModel: true })
				.spread(count => {
					console.log("---count", count.length);
					// Update Notification Table Start

					/*NotificationsStatus.update({ 'read_status': 1 }, {
						where: { read_status: 0, user_id: req.userData.id }
					}).then(newresult => {

					}).catch(function (err) {

					});*/
					// Update Notification Table End
					res.status(HttpStatus.OK).send({
						status: true,
						reply: 'Success',
						data: {
							'notification': notificationData,
							'current': page,
							'store_image_url': "http://"+req.headers.host+ '/uploads/business/',
							'pages': Math.ceil(count.length / perPage)
						}
					});
				}).catch(function (err) {
					console.log(" err======>", err);
					return res.status(HttpStatus.OK).send({
						status: false,
						error: HttpStatus.getStatusText(HttpStatus.OK),
						reply: err
					});
				});
		}).catch(function (err) {
			console.log(" err======>", err);
			return res.status(HttpStatus.OK).send({
				status: false,
				error: HttpStatus.getStatusText(HttpStatus.OK),
				reply: err
			});
		});
});

/* POST Change Notification  Status */
router.post('/allowNotification', FUNC.apiAuth, function (req, res, next) {
	Users.update({ allow_notificatoin: req.body.allow }, {
		where: { id: req.userData.id, user_type: 3 }
	}).then(result => {
		return res.status(HttpStatus.OK).send({
			status: true,
			reply: DM.NOTIFICATION_STATUS_UPDATED
		});
	}).catch(function (err) {
		return res.status(HttpStatus.OK).send({
			status: false,
			error: HttpStatus.getStatusText(HttpStatus.OK),
			reply: DM.SOMETHING_WENT_WRONG
		});
	});
});

router.get('/usersList', async function (req, res, next) {

	Users.findAll({
		attributes: ['fname', 'lname'],
		where: { status: true, user_type: 2 },
	}).then(users => {
		res.status(HttpStatus.OK).send({
			status: true,
			reply: 'Success',
			data: { 'users': users }
		});
	}).catch(function (err) {
		return res.status(HttpStatus.OK).send({
			status: false,
			error: HttpStatus.getStatusText(HttpStatus.OK),
			reply: err
		});
	});
});

router.post('/update_user_lang', FUNC.apiAuth, function (req, res, next) {
	var postData = req.body;
	var user_lang = postData.user_lang;


	Users.update({
		user_lang: user_lang
	}, { where: { id: req.userData.id } })
		.then((done) => {
			return res.status(HttpStatus.OK).send({
				status: true,
				reply: "User language has been changed successfully"
			});
		}).catch((err) => {
			return res.status(HttpStatus.OK).send({
				status: false,
				reply: err
			});
		});


});

/**
* Function Name :- getNotificationCount
* Description :- to get count of unread notification
*/
router.get('/getNotificationCount', FUNC.apiAuth, async function (req, res, next) {

	NotificationsStatus.count({
		where: { read_status: 0, user_id: req.userData.id },
	}).then(users => {
		res.status(HttpStatus.OK).send({
			status: true,
			reply: 'Success',
			data: { 'unReadNotificationCount': 0 }
			//data: { 'unReadNotificationCount': users }
		});
	}).catch(function (err) {
		return res.status(HttpStatus.OK).send({
			status: false,
			error: HttpStatus.getStatusText(HttpStatus.OK),
			reply: err
		});
	});
});

//start_date: { $lte: Date.now() },
//end_date: { $gte: Date.now() },

router.post('/getInterstedCouponNotification',FUNC.apiAuth ,function (req, res, next) {
	var cureent_date = moment().format("YYYY-MM-DD HH:mm");
	var addedDate = moment(cureent_date).add(15, 'minutes').format('YYYY-MM-DD HH:mm');
	//console.log(addedDate)
	//console.log(cureent_date);
	sequelize.query("SELECT ic.*, c.title, c.start_date, c.end_date FROM interested_coupons as ic INNER JOIN coupons as c ON c.id = ic.couponId where c.end_date between '"+cureent_date+"' AND '"+addedDate+"' AND ic.is_view = false AND user_id = '"+req.userData.id+"' order by c.end_date DESC;",
		{ type: sequelize.QueryTypes.SELECT, raw: true })
		.then(interastedCouponNotification => {
			res.status(HttpStatus.OK).send({
				status: true,
				reply: 'Success',
				data: interastedCouponNotification
			});
	//	console.log(interastedCouponNotification);
	}).catch(function (err) {
		return res.status(HttpStatus.OK).send({
			status: false,
			error: HttpStatus.getStatusText(HttpStatus.OK),
			reply: err
		});
	});
})

/* POST Change interasted coupon notification status */
router.post('/changeNotificationStatus', FUNC.apiAuth, function (req, res, next) {
	var updateData = {'is_view':1};
	/*Interested.update({$set: updateData},
		{where: {user_id: req.userData.id, couponId: req.body.couponId }
	}).*/

	sequelize.query("UPDATE `interested_coupons` SET `is_view`= 1 WHERE `user_id` = '"+req.userData.id+"' AND `couponId` = '"+req.body.couponId+"';",
		{ type: sequelize.QueryTypes.UPDATE, raw: true }).then(result => {
		return res.status(HttpStatus.OK).send({
			status: true,
			reply: DM.NOTIFICATION_STATUS_UPDATED
		});
	}).catch(function (err) {
		return res.status(HttpStatus.OK).send({
			status: false,
			error: HttpStatus.getStatusText(HttpStatus.OK),
			reply: DM.SOMETHING_WENT_WRONG
		});
	});
});

router.post('/isViewNotification', FUNC.apiAuth, function (req, res, next) {
	console.log(req.userData);
	NotificationsStatus.update({ 'read_status': 1 }, {
		where: { read_status: 0, user_id: req.userData.id }
	}).then(newresult => {
		res.status(HttpStatus.OK).send({
			status: true,
			reply: DM.NOTIFICATION_CLEAR,
		});
	}).catch(function (err) {
		return res.status(HttpStatus.OK).send({
			status: false,
			error: HttpStatus.getStatusText(HttpStatus.OK),
			reply: DM.SOMETHING_WENT_WRONG
		});
	});

});

router.post('/deleteInterastedCoupon', FUNC.apiAuth, function (req, res, next) {
	console.log(req.userData);
	console.log("DELETE FROM `interested_coupons` WHERE `interested_coupons`.`user_id` = "+req.userData.id+" AND `interested_coupons`.`couponId` = "+req.body.couponId);
	sequelize.query("DELETE FROM `interested_coupons` WHERE `interested_coupons`.`user_id` = "+req.userData.id+" AND `interested_coupons`.`couponId` = "+req.body.couponId, { type: sequelize.QueryTypes.DELETE })
	.then(result => {
        console.log(result)
		res.status(HttpStatus.OK).send({
			status: true,
			reply: DM.DELETE_INTERASTED_COUPON,
		});
    }).catch(function (err) {
        console.log(err);
        return res.status(HttpStatus.OK).send({
			status: false,
			error: HttpStatus.getStatusText(HttpStatus.OK),
			reply: DM.SOMETHING_WENT_WRONG
		});
    });

});

router.post('/deleteNotInterastedCoupon', FUNC.apiAuth, function (req, res, next) {
	//console.log("DELETE FROM `not_interested_coupons` WHERE `interested_coupons`.`user_id` = "+req.userData.id+" AND `interested_coupons`.`couponId` = "+req.body.couponId);
	sequelize.query("DELETE FROM `not_interested_coupons` WHERE `not_interested_coupons`.`user_id` = "+req.userData.id+" AND `not_interested_coupons`.`couponId` = "+req.body.couponId, { type: sequelize.QueryTypes.DELETE })
	.then(result => {
        console.log(result)
		res.status(HttpStatus.OK).send({
			status: true,
			reply: DM.DELETE_NOT_INTERASTED_COUPON,
		});
    }).catch(function (err) {
        console.log(err);
        return res.status(HttpStatus.OK).send({
			status: false,
			error: HttpStatus.getStatusText(HttpStatus.OK),
			reply: DM.SOMETHING_WENT_WRONG
		});
    });

});




module.exports = router;
