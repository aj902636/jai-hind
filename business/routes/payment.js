var express = require('express');
const fetch = require('node-fetch');
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
var async = require('async');
var Subscription = Models.Subscription;
var SubscriptionStatus = Models.SubscriptionStatus;
var paymentMessage = Models.paymentMessage;
var Transactions = Models.Transactions;
var Prices = Models.Prices;




global.FUNC = require('../../functions/businessfunctions.js');


var request = require('request');
var querystring = require('querystring');
global.paymenturl = "https://api.sandbox.proxypay.co.ao";

global.paymentkey = "r8rp54d16i92od1aeqbjkihjrkoaieen";
global.entityid = "99992";



router.all('/membership', FUNC.Auth, FUNC.hasSubscription, async function (req, res, next) {

	var user_id = req.session.business_user.id;

	let subs = await Subscription.findOne({
		where:{
			userId: user_id
		},
		order: [
            ['id', 'DESC']
        ],
        raw: true

	});
//	console.log("subs=================", subs);

	var current_date = moment().format("YYYY-MM-DD");


	var isafter = moment(subs.subscription_expire_date).isAfter(current_date);
	if (isafter) {
		var eventdate = moment(subs.subscription_expire_date);
		var remainng = eventdate.diff(current_date, 'days');
		//console.log("remainng=============================", remainng)
		//return;
		res.render('membership', { title: 'membership', subs: subs, moment: moment, remainng: remainng });
	}



})


router.all('/sucess', async function(req, res, next){
	console.log(req.body.email);
	console.log(req.body.total);
	var user_id = req.session.business_user.id;
	//console.log(user_id);
	let subs = await Subscription.findOne({ where: { userId: user_id } });
	console.log("subs=================", subs);

	var cureent_date = moment().format("YYYY-MM-DD");
	var isafter = moment(subs.subscription_expire_date).isAfter(cureent_date);
	if (isafter) {
		req.flash('success', "Subscription already done.");
		//res.redirect('/dashboard');
	}

	const storeCount = Stores.count({
		where: { status: true, userId: user_id }
	});

	const storeIds = Stores.findAll({where: { status: true, userId: user_id }});

	const business = Business.findOne({
		where: { userId: user_id }
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
			if (responses[1]) {
				console.log("responses[1].categoryId", responses[1].categoryId)
				categories = responses[1].categoryId;
				catArray = categories.split(",");

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

			console.log("storeprice -========", storeprice);
			console.log("catprice -========", catprice);
            console.log('ajay vat '+vat_amount);
			totalPrice = storeprice + catprice;
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
				payment_method : "Online",
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

				var uname = req.session.business_user.fname+" "+req.session.business_user.lname;
				var email_data = {
					user_name: uname,
					email: req.session.business_user.email,
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
							to: req.session.business_user.email,
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
		}).catch(err => {
			console.log(err);
			return res.redirect('/login');
		});
});


router.all('/subscription_create_refrence', FUNC.Auth, async function (req, res, next) {

	var user_id = req.session.business_user.id;

	const getrefrence = await SubscriptionStatus.findOne({ where: { userId: user_id, payment_status: { $not: 'done' } } });
	if (getrefrence) {
		req.flash('success', ADMIN_MSG.RefereceAlready);
		res.redirect('/payment/purchase_subscription');

	}

	//return;

	const refrenceId = await getRefrenceId();

	const storeCount = Stores.count({
		where: { status: true, userId: user_id }
	});
	const business = Business.findOne({
		where: { userId: user_id }
	});


	//const prices = Prices.findOne();
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



	//console.log("getPrice==============",getPrice);

	Promise
		.all([storeCount, business, getPrice, refrenceId, getrefrence])
		.then(async responses => {

			console.log("-----------responses===hhh=====>", responses);
			//console.log("-----------responses========>", responses[1]);
			var categories = "";
			var catprice = 0;
			var storeprice = 0;
			var catArray = 0;
			var totalPrice = 0;
			if (responses[1]) {
				console.log("responses[1].categoryId", responses[1].categoryId)
				categories = responses[1].categoryId;
				catArray = categories.split(",");
				console.log("array lenth-========", catArray.length);
			}

			if (responses[2]) {
				catprice = (((catArray.length) * responses[2][0].price_per_cat));
			}

			if (responses[0]) {
				storeprice = ((responses[0] * responses[2][0].price_per_store));
			}
			console.log("storeprice -========", storeprice);
			console.log("catprice -========", catprice);

			totalPrice = storeprice + catprice;

			console.log("here start code for referce")
			var currentYear = moment().format("YYYY");
			var currentDate = moment().format("YYYY-MM-DD");
			var next30DayDate;
			const dayINeed = 30; // for Thursday
			const today = moment().isoWeekday();

			if (today <= dayINeed) {
				next30DayDate = moment().isoWeekday(dayINeed);
			}
			next30DayDate = moment(next30DayDate).format("YYYY-MM-DD");


			var url = `${paymenturl}/references/${refrenceId}`,
				data = {
					"amount": totalPrice,
					"end_datetime": next30DayDate,
					"custom_fields": {
						"invoice": currentYear + "/" + user_id,
						"userId": user_id
					}
				}

			var options = {
				"uri": url,
				"headers": {
					"Authorization": "Token r8rp54d16i92od1aeqbjkihjrkoaieen",
					"Accept": "application/vnd.proxypay.v2+json",
					"Content-Type": "application/json"
				},
				"form": data,
				"method": 'PUT'

			};

			const test6676 = new Promise((a, b) => request(options, function (error, response, body) {

				console.log("error", error)
				console.log("body", body)
				console.log("response.statusCode", response.statusCode)
				if (!error && response.statusCode == 204) {
					console.log('##############', body)
					var info = JSON.parse(JSON.stringify(body));
					console.log(info.stargazers_count + " Stars");
					console.log(info.forks_count + " Forks");
					a(info)
				}
				else {
					console.log("error", error)
					b(error)
				}
			}));

			await test6676;




			var subscription_user_status = {
				userId: user_id,
				sub_amount: totalPrice,
				paid_amount: 0,
				reference_id: refrenceId,
				payment_status: "pending"
			}

			//var currentDate = moment().format("YYYY-MM-DD");
			console.log("subscription_user==================", subscription_user_status);
			SubscriptionStatus.create(subscription_user_status).then(result3 => {

				req.flash('success', ADMIN_MSG.RefereceGenerated);
				res.redirect('/payment/purchase_subscription');

			})
			//refrenceId
		})
	console.log("create refrence")
})

router.all('/purchase_subscription', FUNC.Auth, async function (req, res, next) {

	var user_id = req.session.business_user.id;
	const lang = req.session.business_user.user_lang;
	const email = req.session.business_user.email;
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
	const business = Business.findOne({
		where: { userId: user_id }
	});
	console.log('sdsdsds');
	const getrefrence = await SubscriptionStatus.findOne({ where: { userId: user_id, payment_status: { $not: 'done' } } });
	console.log('ajay');
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

	Promise.all([storeCount, business, getPrice, getrefrence]).then(responses => {
			console.log("-----------responses===jjjj=====>", responses);
			var categories = "";
			var catprice = 0;
			var storeprice = 0;
			var catArray = 0;
			var totalPrice = 0;
			var vat_amount = 0;
			if (responses[1]) {
				console.log("responses[1].categoryId", responses[1].categoryId)
				categories = responses[1].categoryId;
				catArray = categories.split(",");
				/* console.log("str0",array[0]); // Outputs: Harry
				console.log("str1",array[1]);
				console.log("str2",array[2]); */
				console.log("array lenth-========", catArray.length);
			}

			if (responses[2]) {
				catprice = (((catArray.length) * responses[2][0].price_per_cat));
			}

			if (responses[0]) {
				storeprice = ((responses[0] * responses[2][0].price_per_store));
				vat_amount = responses[2][0].vat_price;
			}
			console.log("storeprice -========", storeprice);
			console.log("catprice -========", catprice);
			console.log('ajay vat '+vat_amount);

			totalPrice = storeprice * catprice;
            totalPrice = (totalPrice * vat_amount/100) + totalPrice;

			res.render('subscription', { responses, title: 'Kupon Subscription', totalprice: totalPrice, getrefrence: getrefrence, getSubscriptionMessage:getSubscriptionMessage,vat_amount:vat_amount,email:email, lang:lang });
		})
		.catch(err => {
			console.log(err);
			return res.redirect('/login');
		});



})






router.get("/cron_get_payments", async function (req, res, next) {

	console.log("corn execute====ddddddddddddd=================================>")
	//680900000 720600000
	var url = paymenturl + '/payments';



	var options = {
		"uri": url,
		"headers": {
			"Authorization": "Token r8rp54d16i92od1aeqbjkihjrkoaieen",
			"Accept": "application/vnd.proxypay.v2+json",
			"Content-Type": "application/json"
		},
		"method": 'Get'

	};
	console.log("options", options)
	const test6676 = new Promise((a, b) => request(options, function (error, response, body) {
	///request(options, function (error, response, body) {

		console.log("error", error)
		console.log("body", body)
		if (!body.length) {
			console.log("body.length============", body.length);
			return res.status(203).json({
				response_code: 203,
				type: true,
				message: "Cron Faild."
			});
		} else {

			if (!error && response.statusCode == 200) {
				var info = JSON.parse(body);

				if (info.length) {
					var counter = info.length;
					info.map(function (key, index, arr) {
						if (key.custom_fields) {
							if (key.custom_fields.userId) {
								console.log('payment element', key)
								var user_id;
								user_id = key.custom_fields.userId;

								SubscriptionStatus.findAll({ limit: 1, where: { reference_id: key.reference_id, userId: user_id, payment_status: { $not: 'done' } } }).then(subsStatus => {
									var paystatus = subsStatus[0];

									if (paystatus) {
										console.log("status&&&&&&&&&&&&&&&&&&&&&&&&&&&&&", paystatus)
										console.log("status&&&&&&&&&&&&&&&&&&&&&&&&&&&&&", paystatus.id)

										var updateData;

										var transactionData = {
											userId: user_id,
											paid_amount: key.amount,
											transaction_id: key.terminal_transaction_id,
											reference_id: key.reference_id,
											payment_id: key.id,
											subscriptions_status_id: paystatus.id
										};

										Transactions.create(transactionData).then(transaction => {
											console.log("transaction===============", transaction)
											const getTotal = sequelize.query("SELECT SUM(paid_amount) as totalPaid FROM `transactions` WHERE reference_id='" + key.reference_id + "' and subscriptions_status_id ='" + paystatus.id + "'", { type: sequelize.QueryTypes.SELECT })
												.then(transaction => {
													console.log("transaction4444444444444444444444444444", transaction[0].totalPaid);
													if (transaction[0].totalPaid >= paystatus.sub_amount) {
														var currentDate = moment().format("YYYY-MM-DD");
														var next30DayDate = moment(currentDate).add(30, 'days');


														updateData = { no_of_days: 30, subscription_start_date: currentDate, subscription_expire_date: next30DayDate, subscription_type: 'paid' }
														Subscription.update(updateData, { where: { userId: user_id } });

														statusData = { paid_amount: transaction[0].totalPaid, payment_status: 'done' }
														SubscriptionStatus.update(statusData, { where: { userId: user_id, payment_status: { $not: 'done' }, reference_id: key.reference_id } });

														//SubscriptionStatus.update()
														//awaitdeletePayment(key.id);
														var url1 = `${paymenturl}/payments/${key.id}`;


														var options1 = {
															"uri": url1,
															"headers": {
																"Authorization": "Token r8rp54d16i92od1aeqbjkihjrkoaieen",
																"Accept": "application/vnd.proxypay.v2+json",
																"Content-Type": "application/json"
															},
															"method": 'DELETE'

														};
														console.log("options", options1)
														request(options1, function (error1, response1, body1) {

															console.log("error", error1)
															console.log("payment delete =================== body", body1)
															console.log("response.statusCode", response1.statusCode)
															if (!error1 && response1.statusCode == 200) {
																var info = JSON.parse(body1);
																console.log('info', info)
															}
															else {
																console.log("error", error1)
															}
															//res.send('ok')
														});
														deleteRefrence(key.reference_id)
													} else {

														statusData = { paid_amount: transaction[0].totalPaid, payment_status: 'partial' }
														SubscriptionStatus.update(statusData, { where: { userId: user_id, payment_status: { $not: 'done' }, reference_id: key.reference_id } });
														//deletePayment(key.id);
														var url1 = `${paymenturl}/payments/${key.id}`;


														var options1 = {
															"uri": url1,
															"headers": {
																"Authorization": "Token r8rp54d16i92od1aeqbjkihjrkoaieen",
																"Accept": "application/vnd.proxypay.v2+json",
																"Content-Type": "application/json"
															},
															"method": 'DELETE'

														};
														console.log("options", options1)
														request(options1, function (error1, response1, body1) {

															console.log("error", error1)
															console.log("payment delete =================== body", body1)
															console.log("response.statusCode", response1.statusCode)
															if (!error1 && response1.statusCode == 200) {
																var info = JSON.parse(body1);
																console.log('info', info)
															}
															else {
																console.log("error", error1)
															}
															//res.send('ok')
														});
													}




												}).catch(function (err) {
													console.log('catch after transaction total', err);
												});

										})

									}
								}).catch(function (err) {
									console.log('catch', err);

								});
							}
						}

						setTimeout(function () {
							counter -= 1;
							if (counter === 0)
								callback();

						}, key);
					})

					function callback() {
						console.log("callback execute");
						a( res.status(200).json({
							response_code: 200,
							type: true,
							message: "Cron successfully run."
						}));
					}


				}
				//console.log(info);
			}
			else {
				console.log("error", error)
				b( res.status(203).json({
					response_code: 203,
					type: true,
					message: "Cron Faild."
				}));
			}
		}


		//	res.send('ok')

	}));

	await test6676;
})


async function deleteRefrence(Id) {

	console.log("reference delete for", Id);
	var url = `${paymenturl}/references/${Id}`;


	var options = {
		"uri": url,
		"headers": {
			"Authorization": "Token r8rp54d16i92od1aeqbjkihjrkoaieen",
			"Accept": "application/vnd.proxypay.v2+json",
			"Content-Type": "application/json"
		},
		"method": 'DELETE'

	};
	console.log("options", options)
	request(options, function (error, response, body) {

		console.log("error", error)
		console.log("body", body)
		console.log("response.statusCode", response.statusCode)
		if (!error && response.statusCode == 200) {
			var info = JSON.parse(body);
			console.log('info', info)
		}
		else {
			console.log("error", error)
		}
		//	res.send('ok')
	});
}



async function deletePayment(Id) {


	console.log("payemnet ====================== delete for", Id);
	var url = `${paymenturl}/payments/${Id}`;


	var options = {
		"uri": url,
		"headers": {
			"Authorization": "Token r8rp54d16i92od1aeqbjkihjrkoaieen",
			"Accept": "application/vnd.proxypay.v2+json",
			"Content-Type": "application/json"
		},
		"method": 'DELETE'

	};
	console.log("options", options)
	request(options, function (error, response, body) {

		console.log("error", error)
		console.log("body", body)
		console.log("response.statusCode", response.statusCode)
		if (!error && response.statusCode == 200) {
			var info = JSON.parse(body);
			console.log('info', info)
		}
		else {
			console.log("error", error)
		}
		//res.send('ok')
	});
}

async function getRefrenceId() {

	const p1 = new Promise(function (resolve, reject) {
		var url = paymenturl + '/reference_ids',
			data = {

			};


		var options = {
			"uri": url,
			"headers": {
				"Authorization": "Token r8rp54d16i92od1aeqbjkihjrkoaieen",
				"Accept": "application/vnd.proxypay.v2+json",
				"Content-Type": "application/json"
			},
			"form": data,
			"method": 'POST'

		};
		console.log("options", options)
		request(options, function (error, response, body) {

			console.log("error", error)
			console.log("body", body)
			console.log("response.statusCode", response.statusCode)
			if (!error && response.statusCode == 200) {
				var info = JSON.parse(body);
				return resolve(info);

			}
			else {
				console.log("error", error)
				return reject(false);
			}


		});
	});

	return p1;


}

//Practice code
router.get("/delete_ref/:id", (req, res, next) => {


	var url = `${paymenturl}/references/${req.params.id}`;


	var options = {
		"uri": url,
		"headers": {
			"Authorization": "Token r8rp54d16i92od1aeqbjkihjrkoaieen",
			"Accept": "application/vnd.proxypay.v2+json",
			"Content-Type": "application/json"
		},
		"method": 'DELETE'

	};
	console.log("options", options)
	request(options, function (error, response, body) {

		console.log("error", error)
		console.log("body", body)
		console.log("response.statusCode", response.statusCode)
		if (!error && response.statusCode == 200) {
			var info = JSON.parse(body);
			console.log('info', info)
		}
		else {
			console.log("error", error)
		}
		res.send('ok')
	});

})

router.get("/generate_ref", async (req, res, next) => {
	var dd = await getRefrenceId();
})

router.get("/create_update_ref/:id", (req, res, next) => {


	var url = `${paymenturl}/references/${req.params.id}`,
		data = {
			"amount": 3000.00,
			"end_datetime": "2020-11-02",
			"custom_fields": {
				"invoice": "2020/78956"
			}
		}

	var options = {
		"uri": url,
		"headers": {
			"Authorization": "Token r8rp54d16i92od1aeqbjkihjrkoaieen",
			"Accept": "application/vnd.proxypay.v2+json",
			"Content-Type": "application/json"
		},
		"form": data,
		"method": 'PUT'

	};
	console.log("options", options)
	request(options, function (error, response, body) {

		console.log("error", error)
		console.log("body", body)
		console.log("response.statusCode", response.statusCode)
		if (!error && response.statusCode == 200) {
			var info = JSON.parse(body);
			console.log(info.stargazers_count + " Stars");
			console.log(info.forks_count + " Forks");
		}
		else {
			console.log("error", error)
		}
		res.send('ok')
	});

})




router.get("/get_payments", (req, res, next) => {

	//deletePayment(628800000016);
	//680900000 720600000

	//deleteRefrence(745700000);return;
	var url = paymenturl + '/payments';



	var options = {
		"uri": url,
		"headers": {
			"Authorization": "Token r8rp54d16i92od1aeqbjkihjrkoaieen",
			"Accept": "application/vnd.proxypay.v2+json",
			"Content-Type": "application/json"
		},
		"method": 'Get'

	};
	console.log("options", options)
	request(options, function (error, response, body) {

		console.log("error", error)
		console.log("body", body)
		console.log("response.statusCode", response.statusCode)
		if (!error && response.statusCode == 200) {
			var info = JSON.parse(body);
			console.log(info);
			res.send(info)
		}
		else {
			console.log("error", error)
		}
		//	res.send('ok')

	});

})


router.get("/mock_payments", (req, res, next) => {

	var url = paymenturl + '/payments';

	if(!req.query.refId){
		return res.status(203).json({
			response_code: 203,
			message:"Provide Refrence Id",
			type: true,
		});
	}

	if(!req.query.amount){
		return res.status(203).json({
			response_code: 203,
			message:"Provide Refrence Id Amount",
			type: true,
		});
	}

	console.log("req.queryreq.query",req.query)
	//return;
	var data = {
		"reference_id": req.query.refId,
		"amount": req.query.amount
	};

	var options = {
		"uri": url,
		"headers": {
			"Authorization": "Token r8rp54d16i92od1aeqbjkihjrkoaieen",
			"Accept": "application/vnd.proxypay.v2+json",
			"Content-Type": "application/json"
		},
		'form': data,
		"method": 'POST'

	};
	console.log("options", options)
	request(options, function (error, response, body) {

		console.log("error", error)
		console.log("body", body)
		console.log("response.statusCode", response.statusCode)
		if (!error && response.statusCode == 200) {
			var info = JSON.parse(body);
			console.log(info);
			return res.status(200).json({
				response_code: 200,
				message:"PaymentDone",
				type: true,
			});
		}
		else {
			console.log("error", error)
			return res.status(203).json({
				response_code: 203,
				message:"PaymentNotDone",
				type: true,
			});
		}

	});

})








module.exports = router;