var express = require('express');
app = express();
var router = express.Router();
global.Models = require('../../models');
var Stores = Models.Stores;
var Users = Models.User;
var Business = Models.Business;
const StoreRating = Models.storeRating;
global.FUNC = require('../../functions/businessfunctions.js');
const EmailTemplate = require('email-templates').EmailTemplate;
const nodemailer = require('nodemailer');
var asyncFun = require("async");


router.get('/', FUNC.Auth, function (req, res, next) {
    const Sequelize = require('sequelize');
    console.log("--ss")
    var user_id = req.session.business_user.id;
    sequelize.query("SELECT `stores`.`id`, `stores`.`userId`, `stores`.`store_name`, `stores`.`store_location`, `stores`.`store_manager`, `stores`.`store_email`, `stores`.`store_password`, `stores`.`latitude`, `stores`.`longitude`, `stores`.`street_address`, `stores`.`town_city`, `stores`.`isActive`, `stores`.`status`, `stores`.`user_lang`, `stores`.`createdAt`, `stores`.`updatedAt`, `user`.`id` AS `user.id`, `user`.`fname` AS `user.fname`, `user`.`lname` AS `user.lname`,COUNT(store_ratings.rating) AS `userCount`, SUM(store_ratings.rating) AS `userRatingSum` FROM `stores` AS `stores` LEFT OUTER JOIN `users` AS `user` ON `stores`.`userId` = `user`.`id` LEFT OUTER JOIN `store_ratings` AS `store_ratings` ON `store_ratings`.`storeId` = `stores`.`id` AND `user`.`id` = "+user_id+" WHERE `stores`.`status` = true AND `stores`.`userId` = "+user_id+" GROUP BY `stores`.`id` ORDER BY `stores`.`id` DESC",{raw: true})
   .spread(results => {
       console.log(results);
    /*Stores.findAll({
        where: { status: true, userId: user_id },
        include: [
            {
                model: Users,
                where: { id: user_id },
                attributes: ['id', 'fname', 'lname'],
                required: false
            },

        ],
        order: [['id','DESC']]
    }).then(results => {*/
        //console.log('ssssssssssssssssssssssssssssssss '+JSON.parse(results[0].store_ratings));

            var averageRatingArr = new Array();
            var totalUserCountArr = new Array();
            var averageRatingArr1 = new Array();
            results.forEach((storeRating,index) =>  {
                totalUserCountArr.push((storeRating.userCount)?storeRating.userCount:0);
                averageRatingArr1.push((numberWithCommas(storeRating.userRatingSum/storeRating.userCount))?numberWithCommas(storeRating.userRatingSum/storeRating.userCount):0);
                averageRatingArr.push((Math.round(storeRating.userRatingSum/storeRating.userCount))?Math.round(storeRating.userRatingSum/storeRating.userCount):0);
            })
            res.render('stores/index',{
                storeInfo: results,
                averageRatingArr,
                title: 'stores',
                averageRatingArr1:averageRatingArr1,
                totalUserCountArr:totalUserCountArr,
            });
    }).catch(function (err) {
        console.log('catch', err);
        return res.redirect('/');
    });
});

function numberWithCommas(x) {
    let character = x.toString().charAt(2)
    var parts = x.toString().split(".",2);
    return (character =='')?parts[0]+',0':parts[0]+','+character;
}
//,FUNC.hasSubscription
router.get('/add', FUNC.Auth, function (req, res, next) {
    console.log(process.env.BUSINESS_URL)
    res.render('stores/add', { title: 'stores' });
});

router.post('/addStore', FUNC.Auth, function (req, res, next) {
    Stores.count( { where : {store_email: req.body.store_email,status:true }}).then(checkEmail=> {
        if(checkEmail){
            req.flash('error', ADMIN_MSG.StoreEmailExists);
            return res.redirect('/stores/add');
        }else{
            var store = {
                store_name: req.body.store_name.trim(),
                userId: req.session.business_user.id,
                store_location: req.body.store_location,
                store_manager: req.body.store_manager,
                store_email: req.body.store_email,
                latitude: req.body.store_lat,
                longitude: req.body.store_long,
                street_address: req.body.street_address,
                town_city: req.body.town_city,
                status: true
            };
            store.store_password = bcrypt.hashSync(req.body.store_password, 10);
            Stores.create(store).then(result => {
                console.log(result.id)
                // SEND EMAIL TO STORE OWNER START

                var template = new EmailTemplate(path.join(__dirname, '../../templates/', 'welcome'));
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
                    var fullName = req.body.store_manager;
                    //var loginLink = 'https://store.kupon.co.ao/login';
                    var loginLink = 'http://182.76.237.236:3004/login'
                    var email_data = { user_name: fullName,current_year:moment().format('YYYY'),business_url:process.env.BUSINESS_URL, email: req.body.store_email, password: req.body.store_password, loginLink: loginLink };
                    var locals = {
                        custom: email_data
                    }
                    template.render(locals, function (err, results) {
                        if (err) {
                            if (err) return next(err);
                        } else {
                            let mailOptions = {
                                from: process.env.FROM_MAIL,
                                to: req.body.store_email,
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

                // SEND EMAIL TO STORE OWNER END
                console.log(result.get({plain: true}));
                req.flash('success', ADMIN_MSG.StoreAdded);
                return res.redirect('/stores');
            }).catch(function (err) {
                console.log('err========>', err);
                return res.redirect('/stores');
            });
        }
    }).catch(function (err) {
        console.log('err========>', err);
        return res.redirect('/stores');
    });
});

router.get('/view/:id', FUNC.Auth, function (req, res, next) {
    Stores.findOne({
        where: { id: req.params.id },
    }).then(results => {
        res.render('stores/view', { storeInfo: results, title: 'stores' });
    }).catch(function (err) {
        req.flash('error', ADMIN_MSG.CommonError);
        return res.redirect('/stores');
    });
});

router.post('/updateStore/:id', FUNC.Auth, function (req, res, next) {
    var update = {
        store_name: req.body.store_name,
        store_location: req.body.store_location,
        store_manager: req.body.store_manager,
        store_email: req.body.store_email,
        latitude: req.body.store_lat,
        longitude: req.body.store_long,
        street_address: req.body.street_address,
        town_city: req.body.town_city,
    };
    update.store_password = bcrypt.hashSync(req.body.store_password, 10);

    Stores.update(update, {
        where: { id: req.params.id }
    }).then(result => {
        req.flash('success', ADMIN_MSG.StoreUpdated);
        res.redirect('/stores');
    }).catch(function (err) {
        console.log('error========>', err);
        req.flash('error', ADMIN_MSG.CommonError);
        return res.redirect('/stores');
    });

});

router.get('/delete/:id', FUNC.Auth, function (req, res, next) {
    Stores.update({ status: false }, {
        where: { id: req.params.id }
    }).then(result => {
        req.flash('success', ADMIN_MSG.StoreRemoved);
        res.redirect('/stores');
    }).catch(function (err) {
        req.flash('error', ADMIN_MSG.CommonError);
        return res.redirect('/');
    });
});

router.post('/status', FUNC.Auth, function (req, res, next) {
    var {
        id,
        status
    } = req.body;

    Stores.update({ isActive: status }, {
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

router.get("/checkemail",  function(req, res) {
    let email= req.query.store_email;
	Stores.count({
		where: { store_email: email,status:true}
	}).then(userCount => {
		if (userCount) {
			res.send("false")
		}else{
			res.send("true")
		}
	});
});

module.exports = router;

