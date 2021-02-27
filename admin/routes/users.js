var express = require('express');
var router = express.Router();
global.Models = require('../../models');
var Users = Models.User;
var States = Models.States;
var Cities = Models.Cities
var Subcategories = Models.Subcategories;
global.FUNC = require('../../functions/functions.js');


/*----> All Subscribe listing <----*/
router.get('/subscribers', FUNC.Auth, function (req, res, next) {
    var current_date = moment().format("YYYY-MM-DD");
    var user_id = req.session.user.id;
    const getTotal = sequelize.query("SELECT users.email,users.fname,users.lname,subscriptions.subscription_type,subscriptions.subscription_expire_date,subscriptions.subscription_start_date FROM `subscriptions`  INNER JOIN users  ON subscriptions.userId = users.id  ORDER BY `userId` ASC", { type: sequelize.QueryTypes.SELECT

    }).then(results => {
        console.log("susbcribers==========================",results);
        res.render('users/subscribers', { userInfo: results,title: 'subscriber',moment:moment });
    }).catch(function (err) {
        console.log('catch', err);
        return res.redirect('/');
    });
});
/*----> All Users listing <----*/
router.get('/', FUNC.Auth, function (req, res, next) {
    var user_id = req.session.user.id;
    Users.findAll({
        where: { status: true, user_type: 3 },
        include : [
            {
				model: States,
				as: 'state_name',
				attributes: ['id', 'name'],
            },
            {
				model: Cities,
				as: 'city_name',
				attributes: ['id', 'name'],
			},
        ],
        order: [
            ['id', 'DESC']
        ],
        raw: true
    }).then( async results => {
       // console.log(results);
       result_new = Array();
        const promises = results.map(async function (element, index) {
            let subCategoiesIds = element.subcategory.split(",");
            var state = await States.findOne({ where: { id: element.state }, attributes: [ 'name'], raw: true });
            if(state){
                results[index]['state'] = state.name;
            }else{
                results[index]['state'] = "";
            }

            var city = await Cities.findOne({ where: { id: element.city }, attributes: [ 'name'], raw: true });
            if(city){
                results[index]['city'] = city.name;
            }else{
                results[index]['city'] = "";
            }
            var subcateories = await Subcategories.findOne({ where: { id: { $in: JSON.parse("[" + subCategoiesIds + "]") } }, attributes: [[sequelize.fn('GROUP_CONCAT', sequelize.col('name')), 'subcategories']], raw: true });
            //console.log("subcateories=================",subcateories)
            //results.subcategory = subcateories.subcategories

            console.log("sdfsd",element.city)
            if(element.state_name){
                console.log("state=================",element.state_name.name)
            }
            results[index]['subcategory'] = subcateories.subcategories;

            if(element.city && element.state && subcateories.subcategories){
                result_new.push(element)
            }

        }, this);
        await Promise.all(promises);
        //console.log("results[index]=======================",results[117])
        results.sort(function(a, b) {
            return b.id - a.id;
        });
        res.render('users/index', { userInfo: results, title: 'users' });
    }).catch(function (err) {
        console.log('catch', err);
        return res.redirect('/');
    });
});

/*-------> Edit User By ID  <----------*/
router.get('/edit/:id', FUNC.Auth, function (req, res, next) {
    Users.findOne({
        where: { id: req.params.id, user_type: 3 },
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

/*-------> View User By ID  <----------*/
router.get('/view/:id', FUNC.Auth, function (req, res, next) {
    Users.findOne({
        where: { id: req.params.id, user_type: 3 },
        include:[
            {
				model: States,
				as: 'state_name',
				attributes: ['id', 'name'],
            },
            {
				model: Cities,
				as: 'city_name',
				attributes: ['id', 'name'],
			},


        ]
    }).then(async function(results) {
        //console.log(results);
        //console.log( results.city_name.name)
        let subCategoiesIds = results.subcategory.split(",");
        var subcateories = await Subcategories.findOne({ where: { id: { $in: JSON.parse("[" + subCategoiesIds + "]") } }, attributes: [[sequelize.fn('GROUP_CONCAT', sequelize.col('name')), 'subcategories']], raw: true });
        console.log("subcateories=================",subcateories)
        results.subcategory = subcateories.subcategories
        console.log(results.subcategory);
        res.render('users/view', { userInfo: results, title: 'users',moment:moment });
    }).catch(function (err) {
        console.log(err);
        req.flash('error', 'Something went wrong.');
      //  return res.redirect('/users');
    });
});

/*-------> Update User  <----------*/
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

    Users.update({ status: false, fb_id:'', google_id:'' }, {
        where: { id: req.params.id, user_type: 3 }
    }).then(result => {
        console.log(result)
        req.flash('success', 'User removed successfully');
        res.redirect('/users');
    }).catch(function (err) {
        console.log(err);
        req.flash('error', 'Something went wrong.');
        return res.redirect('/users');
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
    sequelize.query("SELECT * FROM `cities` WHERE `state_id`=:state_id ORDER BY name", { replacements: { state_id: req.body.id } },
        { type: sequelize.QueryTypes.SELECT })
        .spread(cities => {
            var y = new Array('<option value="">-- Select Comunas --</option>');
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
