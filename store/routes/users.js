var express = require('express');
var router = express.Router();
global.Models = require('../../models');
var Users = Models.User;
var Business = Models.Business;
global.FUNC = require('../../functions/businessfunctions.js');


/*----> All Users listing <----*/
router.get('/', function (req, res, next) {
    Users.findAll({
        where: {city: 6460, user_type: 3},
        group: ['gender'],
        attributes: ['gender', [sequelize.fn('count', sequelize.col('id')), 'counts']],
        row: true
    }).then(results => {
        console.log("results===========>", results);
        res.render('users/view', { userInfo: results, title: 'users' });
    }).catch(function (err) {
        console.log('catch', err);
        return res.redirect('/dashboard');
    });
});


// /*----> All Users listing <----*/
// router.get('/', function (req, res, next) {
//     var user_id = req.session.business_user.id;
//     Users.findAll({
//         where: { status: true, user_type: 3 },
//         raw: true
//     }).then(results => {
//         console.log(results);
//         res.render('users/index', { userInfo: results, title: 'users' });
//     }).catch(function (err) {
//         console.log('catch', err);
//         return res.redirect('/');
//     });
// });

/*-------> Edit Category By ID  <----------*/
router.get('/edit/:id', FUNC.Auth, function (req, res, next) {
    Users.findOne({
        where: { id: req.params.id, user_type: 3 }
    }).then(results => {
        sequelize.query("SELECT * FROM `states`", { type: sequelize.QueryTypes.SELECT })
            .then(states => {
                res.render('users/edit', { userInfo: results, states, title: 'users' });
            });
    }).catch(function (err) {
        req.flash('error', 'Something went wrong.');
        return res.redirect('/users');
    });
});

/*-------> View Category By ID  <----------*/
router.get('/view/:id', FUNC.Auth, function (req, res, next) {
    Users.findOne({
        where: { id: req.params.id, user_type: 3 },
    }).then(results => {
        console.log(results);
        res.render('users/view', { userInfo: results, title: 'users' });
    }).catch(function (err) {
        req.flash('error', 'Something went wrong.');
        return res.redirect('/users');
    });
});

/*-------> Update Category  <----------*/
router.post('/updateUser/:id', FUNC.Auth, function (req, res, next) {
    var update = req.body;
    delete update['email'];
    Users.update(update, {
        where: { id: req.params.id, user_type: 3 }
    }).then(result => {
        req.flash('success', 'User updated successfully');
        res.redirect('/users');
    }).catch(function (err) {
        req.flash('error', 'Something went wrong.');
        return res.redirect('/users');
    });


});

/*-------> Delete User  <----------*/
router.get('/delete/:id', FUNC.Auth, function (req, res, next) {
    Users.update({ status: false }, {
        where: { id: req.params.id, user_type: 3 }
    }).then(result => {
        req.flash('success', 'User removed successfully');
        res.redirect('/users');
    }).catch(function (err) {
        req.flash('error', 'Something went wrong.');
        return res.redirect('/');
    });
});

/*---------> Change Active Status <---------*/
router.post('/status', FUNC.Auth, function (req, res, next) {
    var {
        id,
        status
    } = req.body;

    Users.update({ isActive: status }, {
        where: { id: id, user_type: 3 }
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

router.post('/get_cities', function (req, res, next) {
    sequelize.query("SELECT * FROM `cities` WHERE `state_id`=:state_id", { replacements: { state_id: req.body.id } },
        { type: sequelize.QueryTypes.SELECT })
        .spread(cities => {
            var y = new Array('<option value="">-- Select City --</option>');
            if (cities && cities.length > 0) {
                cities.forEach(function (value, index) {
                    var selected = "";
                    if (value.id == req.body.cityId) { var selected = "selected" }
                    var temp = '<option value="' + value.id + '"' + selected + '>' + value.name + '</option>';
                    y.push(temp);
                });
                res.json(JSON.parse(JSON.stringify(y)));
            } else {
                res.json(JSON.parse(JSON.stringify(y)));
            }
        }).catch(function (err) {
            req.flash('error', 'Something went wrong.');
            return res.redirect('/users');
        });
});


module.exports = router;
