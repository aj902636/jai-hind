var express = require('express');
app = express();
var router = express.Router();
global.Models = require('../../models');
var Stores = Models.Stores;
var Users = Models.User;
global.FUNC = require('../../functions/businessfunctions.js');


router.get('/', FUNC.Auth, function (req, res, next) {
    var user_id = req.session.business_user.id;
    Stores.findAll({
        where: { status: true, userId: user_id },
        include: [
            {
                model: Users,
                where: { id: user_id },
                attributes: ['id', 'fname', 'lname'],
                required: false
            }
        ],
        order: [
            ['id', 'DESC']
        ]
    }).then(results => {
        res.render('stores/index', { storeInfo: results, title: 'stores' });
    }).catch(function (err) {
        console.log('catch', err);
        return res.redirect('/');
    });
});

router.get('/add', FUNC.Auth, function (req, res, next) {
    res.render('stores/add', { title: 'stores' });
});

router.post('/addStore', FUNC.Auth, function (req, res, next) {
    var store = {
        store_name: req.body.store_name.trim(),
        userId: req.session.business_user.id,
        store_location: req.body.store_location,
        store_manager: req.body.store_manager,
        store_email: req.body.store_email,
        latitude: req.body.store_lat,
        longitude: req.body.store_long,
        status: true
    };

    store.store_password = bcrypt.hashSync(req.body.store_password, 10);

    Stores.create(store).then(result => {
        console.log(result.get({ plain: true }));
        req.flash('success', 'Store added Successfully.');
        return res.redirect('/stores');
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
        req.flash('error', 'Something went wrong.');
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
        longitude: req.body.store_long
    };
    update.store_password = bcrypt.hashSync(req.body.store_password, 10);

    Stores.update(update, {
        where: { id: req.params.id }
    }).then(result => {
        req.flash('success', 'Store updated successfully');
        res.redirect('/stores');
    }).catch(function (err) {
        console.log('error========>', err);
        req.flash('error', 'Something went wrong.');
        return res.redirect('/stores');
    });

});

router.get('/delete/:id', FUNC.Auth, function (req, res, next) {
    Stores.update({ status: false }, {
        where: { id: req.params.id }
    }).then(result => {
        req.flash('success', 'Store removed successfully');
        res.redirect('/stores');
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



module.exports = router;

