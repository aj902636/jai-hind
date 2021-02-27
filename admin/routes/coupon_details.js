var express = require('express');
app = express();
var router = express.Router();
global.Models = require('../../models');
var Coupons = Models.Coupons;
var Users = Models.User;
var Categories = Models.Categories;
var Subcategories = Models.Subcategories;
global.FUNC = require('../../functions/functions.js');

var path = require('path');


router.get('/', FUNC.Auth, function (req, res, next) {
    var query = 'SELECT users.id,users.fname,users.lname,businesses.business_name, (SELECT COUNT(redeemeds.id) FROM redeemeds where couponId IN (SELECT coupons.id FROM coupons where coupons.userId = users.id)) as redeemCount, (SELECT count(coupons.id) FROM coupons where coupons.userId = users.id) as coupon_count FROM users INNER join businesses on businesses.userId = users.id WHERE users.user_type = 2 GROUP by users.id Order By businesses.business_name';
    sequelize.query(query,
        { type: sequelize.QueryTypes.SELECT })
        .then(results => {
            res.render('coupon_detail/index', { userInfo: results, title: 'coupon_detail' });
        }).catch(function (err) {
            req.flash('error', 'Something went wrong.');
            return res.redirect('/dashboard');
        });
});

module.exports = router;

