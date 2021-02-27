var express = require('express');
app = express();
var router = express.Router();
global.Models = require('../../models');
var Prices = Models.Prices;
global.FUNC = require('../../functions/functions.js');


router.get('/', FUNC.Auth, function (req, res, next) {
    var user_id = req.session.user.id;
    Prices.findOne({
        where: { id: 1 },
        raw: true
    }).then(results => {
        res.render('prices', { title: 'prices', data: results });
    }).catch(function (err) {
        console.log('catch', err);
        return res.redirect('/');
    });
});


router.post('/updatePrice', FUNC.Auth, function (req, res, next) {

    var { price_per_store, price_per_cat,vat_price } = req.body;
    var page_id = req.params.id;
    Prices.update(req.body, {
        where: { id: 1 }
    }).then(result => {
        req.flash('success', 'Price Updated Successfully.');
        return res.redirect('/prices');
    }).catch(function (err) {
        req.flash('error', 'Something went wrong.');
        return res.redirect('/');
    });

});

module.exports = router;

