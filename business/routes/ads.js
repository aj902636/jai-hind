var express = require('express');
app = express();
var router = express.Router();
global.Models = require('../../models');
var Ads = Models.Ads;
global.FUNC = require('../../functions/businessfunctions.js');


router.get('/', FUNC.Auth, function (req, res, next) {
    var user_id = req.session.business_user.id;
    Ads.findAll({
        where: { status: true, userId: user_id }
    }).then(results => {
        res.render('ads/index', { adsinfo: results, title: 'ads' });
    }).catch(function (err) {
        console.log('catch', err);
        return res.redirect('/');
    });
});

router.get('/add', FUNC.Auth, function (req, res, next) {
    res.render('ads/add', { title: 'ads' });
})

router.post('/addAds', FUNC.Auth, function (req, res, next) {

    var ads = {
        userId: req.session.business_user.id,
        title: req.body.title,
        link: req.body.link,
        duration: req.body.duration,
        status: true
    };

    Ads.create(ads).then(result => {
        console.log(result.get({ plain: true }));
        req.flash('success', 'Advertisement added Successfully.');
        return res.redirect('/ads');
    }).catch(function (err) {
        console.log('err========>', err);
        return res.redirect('/ads');
    });
});

router.get('/view/:id', FUNC.Auth, function (req, res, next) {
    Ads.findOne({
        where: { id: req.params.id },
    }).then(results => {
        res.render('ads/view', { adsInfo: results, title: 'ads' });
    }).catch(function (err) {
        req.flash('error', 'Something went wrong.');
        return res.redirect('/ads');
    });;
});

router.post('/updateAds/:id', FUNC.Auth, function (req, res, next) {
    var ads = {
        title: req.body.title,
        link: req.body.link,
        duration: req.body.duration
    };
    //console.log(deal); return;
    Ads.update(ads, {
        where: { id: req.params.id }
    }).then(result => {
        req.flash('success', 'Advertisement updated successfully');
        res.redirect('/ads');
    }).catch(function (err) {
        console.log('error========>', err);
        req.flash('error', 'Something went wrong.');
        return res.redirect('/ads');
    });

});

router.get('/delete/:id', FUNC.Auth, function (req, res, next) {
    Ads.update({ status: false }, {
        where: { id: req.params.id }
    }).then(result => {
        req.flash('success', 'Advertisement removed successfully');
        res.redirect('/ads');
    }).catch(function (err) {
        req.flash('error', 'Something went wrong.');
        return res.redirect('/');
    });
});

router.post('/status', FUNC.Auth, function (req, res, next) {
    var {
        id,
        status
    } = req.body;

    Ads.update({ isActive: status }, {
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


module.exports = router;

