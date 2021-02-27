var express = require('express');
app = express();
var router = express.Router();
global.Models = require('../../models');
var Reports = Models.Reports;
var Coupons = Models.Coupons;
var CouponRating = Models.couponRating;
var User = Models.User;
global.FUNC = require('../../functions/functions.js');


/**
 * Start routing here to list coupon report 19/01/2021
 *
*/

router.get('/', FUNC.Auth, function(req, res, next){
    const Sequelize = require('sequelize');
    const op = Sequelize.Op;
    const results = {};
    var user_id = req.session.user.id;
    CouponRating.findAll({
        where: {status: false , coupon_id : { [op.not]: null, } },
        include: [
            {
                model: User,
                attributes: ["id", "fname", "lname", "email", "phone"]
            },
            {
                model: Coupons,
                attributes: ["title"]
            }
        ],

        order: [['id', 'DESC']],
        //raw: true
    }).then(results => {
        console.log("Coupon Rating Data===========>",results);
        res.render('couponRating', { title: 'couponRating', couponRating: results, });
    }).catch(function (err) {
        console.log('catch', err);
        res.render('couponRating', { title: 'couponRating', couponRating: results });
    });
});

/**
 * End routing here to list coupon report 19/01/2021
 *
*/

/**
 * Start function to view coupon details 19/01/2021
 *
*/

router.get('/couponView/:id', FUNC.Auth, function (req, res, next) {
    Reports.find({
        where: { id: req.params.id,status:false},
        include: [
            {
                model: User,
                attributes: ["id", "fname", "lname", "email", "phone"]
            },
            {
                model: Coupons,
                attributes: ["title"]
            }
        ],
    }).then( async results => {
       await Reports.update({admin_read:true }, { where: { id: req.params.id }});
        res.render('coupon_reports/view', { results: results, title: 'reports' });
    }).catch(function (err) {
        req.flash('error', 'Something went wrong.');
        return res.redirect('/kuponReports');
    });;
});
/**
 *End function to view coupon details 19/01/2021
 *
*/

/**
 *  Start coupon resolved function here 19/01/2021
 *
*/

router.get('/couponResolved/:id', FUNC.Auth, function (req, res, next) {
    Reports.update({ status: true,admin_read:true }, {
        where: { id: req.params.id }
    }).then(result => {
        req.flash('success', 'Complain marked resolved successfully');
        res.redirect('/reports/kuponReports');
    }).catch(function (err) {
        req.flash('error', 'Something went wrong.');
        return res.redirect('/kuponReports');
    });
});

/**
 *  End coupon resolved function here 19/01/2021
 *
*/

module.exports = router;