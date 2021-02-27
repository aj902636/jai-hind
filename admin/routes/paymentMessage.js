var express = require('express');
app = express();
var router = express.Router();
global.Models = require('../../models');
var Pages = Models.Pages;
const paymentMessage = Models.paymentMessage;
global.FUNC = require('../../functions/functions.js');


router.get('/', FUNC.Auth, function (req, res, next) {
    var user_id = req.session.user.id;
    paymentMessage.findAll({
        where: { user_id: user_id},
        raw: true
    }).then(results => {
        console.log(results);
        res.render('paymentMessage', {title: 'paymentMessage', data:results});
    }).catch(function (err) {
        console.log('catch', err);
        res.render('paymentMessage', { title: 'paymentMessage' });
    });
});


router.post('/updatePaymentMessage', FUNC.Auth, function (req, res, next) {

    var data = {
        user_id: req.session.user.id,
        english_message : req.body.english_message,
        spanish_message : req.body.spanish_message,
    }
    var id = req.body.id;
    paymentMessage.update(data, {
        where: { id : id}
    }).then(result => {
        req.flash('success', 'Payment Message Updated Successfully.');
        return res.redirect('/paymentMessage');
    }).catch(function (err) {
        req.flash('error', 'Something went wrong.');
        return res.redirect('/');
    });

});

module.exports = router;

