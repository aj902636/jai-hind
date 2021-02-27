var express = require('express');
app = express();
var router = express.Router();
global.Models = require('../../models');
var Deals = Models.Deals;
var Users = Models.User;
var Categories = Models.Categories;
var Subcategories = Models.Subcategories;
global.FUNC = require('../../functions/functions.js');

var path = require('path');


router.get('/', FUNC.Auth, function (req, res, next) {
    var query = 'SELECT users.id,fname,lname,COUNT(deals.id) as deals_count, businesses.business_name FROM `users` INNER JOIN `deals` ON `deals`.`userId` = `users`.`id` INNER JOIN `businesses` ON `businesses`.`userId` = `users`.`id` WHERE `user_type` = 2 GROUP by deals.userId';
    sequelize.query(query,
        { type: sequelize.QueryTypes.SELECT })
        .then(results => {
            res.render('deals/index', { userInfo: results, title: 'deals' });
        }).catch(function (err) {
            req.flash('error', 'Something went wrong.');
            return res.redirect('/dashboard');
        });
});

router.get('/view/:id', FUNC.Auth, function (req, res, next) {
    Deals.findAll({
        where: { status: true, userId: req.params.id },
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
        res.render('deals/view', { dealInfo: results, title: 'deals' });
    }).catch(function (err) {
        console.log('catch', err);
        return res.redirect('/dashboard');
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
                attributes: ['id', 'name']
            }
        ],
        order: [['createdAt', 'DESC']],
    }).then(couponInfo => {
        res.render('deals/detail', { title: 'deals', couponInfo, deatStaticText });
    }).catch(function (err) {
        console.log(" req.params.id======>", err);
        req.flash('error', 'Something went wrong.');
        return res.redirect('/deals');
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
            var coupon_link = process.env.BUSINESS_URL + 'deals/view/' + id;
            var email_data = { user_name: uname, type: 'deal',business_url:process.env.BUSINESS_URL,current_year:moment().format('YYYY'), description: description, coupon_link: coupon_link };
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
                        subject: 'Kupon Deal Blocked',
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

        Deals.update({ blockAdmin: true }, {
            where: { id: id }
        }).then(result => {
            req.flash('success', 'Deal Blocked successfully');
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
    Deals.update({ blockAdmin: false }, {
        where: { id: req.params.id }
    }).then(result => {
        req.flash('success', 'Deal Unblocked successfully');
        res.redirect(req.header('Referer'));
    }).catch(function (err) {
        req.flash('error', 'Something went wrong.');
        return res.redirect('/');
    });
});


module.exports = router;

